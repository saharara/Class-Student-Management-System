import math

from odoo.exceptions import ValidationError
from odoo.http import request

from .export_factory import ExportFactory
from .import_factory import ImportFactory
from .normalizer import ApiNormalizer
from .serializer import ApiSerializer
from .validator import ApiValidator


class RestApiService:
    CONSTRAINT_MESSAGES = {
        "tra_class_code_unique": "Mã lớp đã tồn tại. Vui lòng nhập mã khác.",
        "tra_class_pkey": "ID lớp đã tồn tại.",
        "tra_student_code_unique": "Mã học sinh đã tồn tại. Vui lòng nhập mã khác.",
        "tra_student_email_unique": "Email đã tồn tại. Vui lòng nhập email khác.",
        "tra_student_username_unique": "Tài khoản đã tồn tại. Vui lòng nhập tài khoản khác.",
        "tra_student_pkey": "ID học sinh đã tồn tại.",
        "tra_student_class_id_fkey": "Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ.",
    }

    REQUIRED_FIELD_LABELS = {
        "tra_class": {
            "code": "Mã lớp",
            "name": "Tên lớp",
        },
        "tra_student": {
            "code": "Mã học sinh",
            "fullname": "Họ và tên",
            "dob": "Ngày sinh",
            "email": "Email",
            "class_id": "Lớp học",
            "username": "Tài khoản",
            "password": "Mật khẩu",
        },
    }

    def __init__(self, config):
        self.config = config
        self.normalizer = ApiNormalizer(self)
        self.serializer = ApiSerializer()
        self.validator = ApiValidator()
        self.import_factory = ImportFactory()
        self.export_factory = ExportFactory()

    @property
    def model_name(self):
        return self.config.MODEL

    @property
    def model(self):
        return request.env[self.model_name].with_context(bin_size=False)

    @property
    def fields(self):
        return self.config.FIELDS

    @property
    def writable_fields(self):
        return self.config.WRITABLE_FIELDS

    @property
    def aliases(self):
        return self.config.ALIASES

    @property
    def search_fields(self):
        return self.config.SEARCH_FIELDS

    @property
    def unique_copy_fields(self):
        return self.config.UNIQUE_COPY_FIELDS

    @property
    def default_order(self):
        return self.config.DEFAULT_ORDER

    def get_all(self):
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("C607", error)

        records = self.model.search([], order=self.default_order)
        return self.serializer.success(self.serializer.read_records(records, fields_list))

    def get_by_page(self, init=1):
        payload = self.normalizer.payload()
        current, size, error = self.validator.page_params(init, payload)
        if error:
            return self.serializer.error(error[0], error[1])

        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("C607", error)

        domain = self.normalizer.search_domain(payload.get("search") or payload.get("kw"))
        total_items = self.model.search_count(domain)
        total_pages = int(math.ceil(float(total_items) / size)) if total_items else 0
        records = self.model.search(
            domain,
            limit=size,
            offset=(current - 1) * size,
            order=self.normalizer.order(payload.get("order")),
        )
        return self.serializer.success(
            {
                "page_info": {
                    "total_items": total_items,
                    "total_pages": total_pages,
                    "current": current,
                    "size": size,
                },
                "records": self.serializer.read_records(records, fields_list),
            }
        )

    def store(self):
        payload = self.normalizer.payload()
        field_errors = self._field_errors(payload)
        if field_errors:
            return self.serializer.error(
                "E603",
                "Vui lòng kiểm tra lại thông tin.",
                {"errors": field_errors},
            )

        try:
            record = self.model.create(self.normalizer.writable_values(payload))
        except ValidationError as exc:
            message = self._user_error_message(exc)
            return self.serializer.error("E603", message, self._error_payload(message))
        except Exception as exc:
            message = self._user_error_message(exc, action="create")
            return self.serializer.error("E600", message, self._error_payload(message))
        return self.serializer.success({"id": record.id}, "Thêm mới thành công.")

    def get_by_id(self, record_id):
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("D607", error)

        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("D604", "Bản ghi không tồn tại.")
        return self.serializer.success(self.serializer.read_record(record, fields_list))

    def update(self, record_id, payload=None):
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("D604", "Bản ghi không tồn tại.")

        try:
            record.write(self.normalizer.writable_values(payload or self.normalizer.payload()))
        except ValidationError as exc:
            return self.serializer.error("F603", self._user_error_message(exc))
        except Exception as exc:
            return self.serializer.error("F600", self._user_error_message(exc, action="update"))
        return self.serializer.success({"id": record.id}, "Cập nhật thành công.")

    def destroy(self, record_id):
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("G604", "Bản ghi không tồn tại.")

        try:
            deleted_id = record.id
            record.unlink()
        except Exception as exc:
            return self.serializer.error("G600", self._user_error_message(exc, action="delete"))
        return self.serializer.success({"id": deleted_id}, "Xóa thành công.")

    def copy_or_update(self, record_id):
        payload = self.normalizer.payload()
        if payload.get("action") != "copy" and self.normalizer.writable_values(payload):
            return self.update(record_id, payload)
        return self.copy(record_id)

    def copy(self, record_id):
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("H604", "Id không tồn tại.")

        fields_list, error = self.normalizer.resolve_fields(self.normalizer.payload().get("columnlist"))
        if error:
            return self.serializer.error("H603", error)

        try:
            copied = record.copy(self.normalizer.copy_values(record))
        except ValidationError as exc:
            return self.serializer.error("H603", self._user_error_message(exc))
        except Exception as exc:
            return self.serializer.error("H600", self._user_error_message(exc, action="copy"))
        return self.serializer.success(
            self.serializer.read_record(copied, fields_list),
            "Sao chép thành công.",
        )

    def mass_copy(self):
        payload = self.normalizer.payload()
        ids = self.normalizer.ids(payload)
        records = self.validator.records_by_ids(self.model, ids)
        if not ids or records is None:
            return self.serializer.error("H604", "Id không tồn tại.")

        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("H603", error)

        try:
            copied_records = self.model
            for record in records:
                copied_records |= record.copy(self.normalizer.copy_values(record))
        except ValidationError as exc:
            return self.serializer.error("H603", self._user_error_message(exc))
        except Exception as exc:
            return self.serializer.error("H600", self._user_error_message(exc, action="copy"))
        return self.serializer.success(
            self.serializer.read_records(copied_records, fields_list),
            "Sao chép thành công.",
        )

    def mass_delete(self):
        payload = self.normalizer.payload()
        ids = self.normalizer.ids(payload)
        records = self.validator.records_by_ids(self.model, ids)
        if not ids or records is None:
            return self.serializer.error("I604", "Các bản ghi không xóa được.")

        try:
            records.unlink()
        except Exception as exc:
            return self.serializer.error("I600", self._user_error_message(exc, action="delete"))
        return self.serializer.success({"ids": ids}, "Xóa thành công.")

    def import_data(self):
        rows, error_code, error = self.import_factory.rows(self.normalizer.payload())
        if error:
            return self.serializer.error(error_code, error)

        try:
            records = self.model.create([self.normalizer.writable_values(row) for row in rows])
        except ValidationError as exc:
            return self.serializer.error("E603", self._user_error_message(exc))
        except Exception as exc:
            return self.serializer.error("E600", self._user_error_message(exc, action="import"))
        return self.serializer.success(
            self.serializer.read_records(records, self.fields),
            "Import thành công.",
        )

    def export_by_id(self, record_id):
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("K607", error)

        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("K604", "Mã bản ghi không tồn tại.")

        data = [self.serializer.read_record(record, fields_list)]
        result = self.export_factory.export(
            self.model_name,
            fields_list,
            data,
            payload.get("type") or "json",
        )
        if result.get("error"):
            code, message = result["error"]
            return self.serializer.error("K601" if code == "L601" else "K600", message)
        return self.serializer.success(result["data"])

    def export_data(self):
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("L607", error)

        ids = self.normalizer.ids(payload)
        domain = [("id", "in", ids)] if ids else []
        records = self.model.search(domain, order=self.default_order)
        if ids and len(records) != len(ids):
            return self.serializer.error("L602", "Danh sách bản ghi không tồn tại.")

        data = self.serializer.read_records(records, fields_list)
        result = self.export_factory.export(
            self.model_name,
            fields_list,
            data,
            payload.get("type") or "json",
        )
        if result.get("error"):
            return self.serializer.error(result["error"][0], result["error"][1])
        return self.serializer.success(result["data"])

    def _field_errors(self, payload):
        if self.model_name != "tra_student":
            return {}

        source = payload.get("kw") if isinstance(payload.get("kw"), dict) else payload
        labels = self.REQUIRED_FIELD_LABELS.get(self.model_name, {})
        errors = {}

        for field_name, label in labels.items():
            value = source.get(field_name)
            if value in (None, ""):
                errors[field_name] = "%s là trường bắt buộc." % label

        class_value = source.get("class_id")
        if class_value not in (None, ""):
            try:
                self.normalizer.convert_writable_value("class_id", class_value)
            except ValidationError:
                errors["class_id"] = "Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ."

        return errors

    def _error_payload(self, message):
        field_name = self._field_name_from_message(message)
        if not field_name:
            return None
        return {"errors": {field_name: message}}

    def _field_name_from_message(self, message):
        lower_message = (message or "").lower()
        if "lớp" in lower_message or "class_id" in lower_message:
            return "class_id"
        if "mã học sinh" in lower_message or "code" in lower_message:
            return "code"
        if "email" in lower_message:
            return "email"
        if "tài khoản" in lower_message or "username" in lower_message:
            return "username"
        if "mật khẩu" in lower_message or "password" in lower_message:
            return "password"
        if "ngày sinh" in lower_message or "dob" in lower_message:
            return "dob"
        if "họ và tên" in lower_message or "fullname" in lower_message:
            return "fullname"
        return None

    def _user_error_message(self, exc, action=None):
        message = str(exc)
        lower_message = message.lower()

        for constraint_name, translated_message in self.CONSTRAINT_MESSAGES.items():
            if constraint_name in message:
                return translated_message

        required_message = self._required_field_message(message)
        if required_message:
            return required_message

        if "foreign key constraint" in lower_message or "violates foreign key" in lower_message:
            if self.model_name == "tra_student" and "tra_student_class_id_fkey" in message:
                return "Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ."
            return "Dữ liệu liên kết không hợp lệ."

        if "duplicate key value" in lower_message or "unique constraint" in lower_message:
            return "Dữ liệu bị trùng. Vui lòng kiểm tra lại các trường duy nhất."

        if "invalid input syntax for type integer" in lower_message or "invalid literal for int" in lower_message:
            return "Giá trị số không hợp lệ. Vui lòng kiểm tra lại dữ liệu nhập."

        if "invalid input syntax for type date" in lower_message:
            return "Ngày không đúng định dạng. Vui lòng nhập theo dạng YYYY-MM-DD."

        if "not null" in lower_message or "null value in column" in lower_message:
            return "Thiếu dữ liệu bắt buộc. Vui lòng kiểm tra lại thông tin."

        if action == "delete":
            return "Không thể xóa bản ghi vì bản ghi đang được dữ liệu khác sử dụng hoặc không hợp lệ."

        if action == "import":
            return "Import thất bại. Vui lòng kiểm tra dữ liệu trong file."

        return message

    def _required_field_message(self, message):
        labels = self.REQUIRED_FIELD_LABELS.get(self.model_name, {})
        for field_name, label in labels.items():
            if '"%s"' % field_name in message or "'%s'" % field_name in message:
                if "null value in column" in message.lower() or "required" in message.lower():
                    return "%s là trường bắt buộc." % label
        return None
