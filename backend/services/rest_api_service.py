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
        "Mã lớp phải là duy nhất.": "Mã lớp đã tồn tại. Vui lòng nhập mã khác.",
        "tra_class_pkey": "ID lớp đã tồn tại.",
        "tra_student_code_unique": "Mã học sinh đã tồn tại. Vui lòng nhập mã khác.",
        "Mã học sinh phải là duy nhất.": "Mã học sinh đã tồn tại. Vui lòng nhập mã khác.",
        "tra_student_email_unique": "Email đã tồn tại. Vui lòng nhập email khác.",
        "Email phải là duy nhất.": "Email đã tồn tại. Vui lòng nhập email khác.",
        "tra_student_username_unique": "Tài khoản đã tồn tại. Vui lòng nhập tài khoản khác.",
        "Tài khoản phải là duy nhất.": "Tài khoản đã tồn tại. Vui lòng nhập tài khoản khác.",
        "tra_student_pkey": "ID học sinh đã tồn tại.",
        "tra_student_class_id_fkey": "Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ.",
    }

    CONSTRAINT_FIELD_ERRORS = {
        "tra_class_code_unique": ("code", "Mã lớp đã tồn tại. Vui lòng nhập mã khác."),
        "Mã lớp phải là duy nhất.": ("code", "Mã lớp đã tồn tại. Vui lòng nhập mã khác."),
        "tra_student_code_unique": ("code", "Mã học sinh đã tồn tại. Vui lòng nhập mã khác."),
        "Mã học sinh phải là duy nhất.": ("code", "Mã học sinh đã tồn tại. Vui lòng nhập mã khác."),
        "tra_student_email_unique": ("email", "Email đã tồn tại. Vui lòng nhập email khác."),
        "Email phải là duy nhất.": ("email", "Email đã tồn tại. Vui lòng nhập email khác."),
        "tra_student_username_unique": ("username", "Tài khoản đã tồn tại. Vui lòng nhập tài khoản khác."),
        "Tài khoản phải là duy nhất.": ("username", "Tài khoản đã tồn tại. Vui lòng nhập tài khoản khác."),
    }


    def __init__(self, config):
        """Mô tả: Khởi tạo service REST và các thành phần hỗ trợ.
        Input: config - controller/mixin chứa cấu hình model API.
        Output: RestApiService sẵn sàng xử lý request.
        Ràng buộc: config phải khai báo đầy đủ các thuộc tính cấu hình.
        Ngoại lệ: Ngoại lệ khởi tạo thành phần được truyền lên.
        """
        self.config = config
        self.normalizer = ApiNormalizer(self)
        self.serializer = ApiSerializer()
        self.validator = ApiValidator()
        self.import_factory = ImportFactory()
        self.export_factory = ExportFactory()

    @property
    def model_name(self):
        """Mô tả: Lấy tên model Odoo từ cấu hình API.
        Input: Không có.
        Output: Chuỗi tên model.
        Ràng buộc: config phải khai báo MODEL.
        Ngoại lệ: AttributeError nếu thiếu cấu hình.
        """
        return self.config.MODEL

    @property
    def model(self):
        """Mô tả: Lấy model Odoo trong môi trường request hiện tại.
        Input: Không có.
        Output: Model recordset với bin_size=False.
        Ràng buộc: Phải có request Odoo và model_name hợp lệ.
        Ngoại lệ: Ngoại lệ registry hoặc request được truyền lên.
        """
        return request.env[self.model_name].with_context(bin_size=False)

    @property
    def fields(self):
        """Mô tả: Lấy danh sách trường được công khai qua API.
        Input: Không có.
        Output: Danh sách tên trường.
        Ràng buộc: config phải khai báo FIELDS.
        Ngoại lệ: AttributeError nếu thiếu cấu hình.
        """
        return self.config.FIELDS

    @property
    def writable_fields(self):
        """Mô tả: Lấy danh sách trường API được phép ghi.
        Input: Không có.
        Output: Danh sách tên trường có thể create hoặc update.
        Ràng buộc: config phải khai báo WRITABLE_FIELDS.
        Ngoại lệ: AttributeError nếu thiếu cấu hình.
        """
        return self.config.WRITABLE_FIELDS

    @property
    def aliases(self):
        """Mô tả: Lấy ánh xạ bí danh cột API sang trường model.
        Input: Không có.
        Output: Dictionary alias.
        Ràng buộc: config phải khai báo ALIASES.
        Ngoại lệ: AttributeError nếu thiếu cấu hình.
        """
        return self.config.ALIASES

    @property
    def search_fields(self):
        """Mô tả: Lấy các trường tham gia tìm kiếm từ khóa.
        Input: Không có.
        Output: Danh sách tên trường tìm kiếm.
        Ràng buộc: config phải khai báo SEARCH_FIELDS.
        Ngoại lệ: AttributeError nếu thiếu cấu hình.
        """
        return self.config.SEARCH_FIELDS

    @property
    def unique_copy_fields(self):
        """Mô tả: Lấy các trường cần tạo giá trị duy nhất khi sao chép.
        Input: Không có.
        Output: Danh sách tên trường.
        Ràng buộc: config phải khai báo UNIQUE_COPY_FIELDS.
        Ngoại lệ: AttributeError nếu thiếu cấu hình.
        """
        return self.config.UNIQUE_COPY_FIELDS

    @property
    def copy_values(self):
        """Values forced onto every copy of the configured resource."""
        return dict(self.config.COPY_VALUES)

    @property
    def default_order(self):
        """Mô tả: Lấy biểu thức sắp xếp mặc định của API.
        Input: Không có.
        Output: Chuỗi order dùng cho ORM.
        Ràng buộc: config phải khai báo DEFAULT_ORDER.
        Ngoại lệ: AttributeError nếu thiếu cấu hình.
        """
        return self.config.DEFAULT_ORDER

    def get_all(self):
        """Mô tả: Lấy toàn bộ bản ghi với các cột được yêu cầu.
        Input: Payload của request, có thể chứa columnlist.
        Output: JSON response chứa danh sách bản ghi hoặc lỗi cột.
        Ràng buộc: columnlist chỉ chứa trường được công khai.
        Ngoại lệ: Lỗi cột trả mã C607; lỗi ORM được truyền lên.
        """
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("C607", error)

        records = self.model.search([], order=self.default_order)
        return self.serializer.success(self.serializer.read_records(records, fields_list))

    def get_by_page(self, init=1):
        """Mô tả: Lấy danh sách bản ghi có phân trang, tìm kiếm và sắp xếp.
        Input: trang mặc định và payload request.
        Output: JSON response chứa dữ liệu cùng metadata phân trang.
        Ràng buộc: page, size dương và các cột phải hợp lệ.
        Ngoại lệ: Lỗi tham số được trả bằng mã nghiệp vụ tương ứng.
        """
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
        """Mô tả: Kiểm tra payload và tạo một bản ghi mới.
        Input: Payload request chứa các trường được phép ghi.
        Output: JSON response chứa bản ghi vừa tạo hoặc lỗi.
        Ràng buộc: Tuân theo MODEL_RULES và constraint của model.
        Ngoại lệ: ValidationError/ORM được chuyển thành phản hồi lỗi API.
        """
        payload = self.normalizer.payload()
        field_errors = self._field_errors(payload)
        if field_errors:
            return self.serializer.error(
                "E603",
                "Vui lòng kiểm tra lại thông tin.",
                {"errors": field_errors},
            )

        try:
            model = self.model
            source = payload.get("kw") if isinstance(payload.get("kw"), dict) else payload
            if (payload.get("action") or source.get("action")) == "copy":
                model = model.with_context(allow_missing_email_for_copy=True)
            record = model.create(self.normalizer.writable_values(payload))
        except ValidationError as exc:
            message = self._user_error_message(exc)
            return self.serializer.error("E603", message, self._constraint_error_payload(exc) or self._error_payload(message))
        except Exception as exc:
            message = self._user_error_message(exc, action="create")
            return self.serializer.error("E600", message, self._constraint_error_payload(exc) or self._error_payload(message))
        return self.serializer.success({"id": record.id}, "Thêm mới thành công.")

    def get_by_id(self, record_id):
        """Mô tả: Lấy một bản ghi theo id.
        Input: record_id và columnlist tùy chọn từ request.
        Output: JSON response chứa bản ghi hoặc lỗi không tồn tại.
        Ràng buộc: id và danh sách cột phải hợp lệ.
        Ngoại lệ: Lỗi được trả bằng mã API, lỗi ORM khác được truyền lên.
        """
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("D607", error)

        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("D604", "Bản ghi không tồn tại.")
        return self.serializer.success(self.serializer.read_record(record, fields_list))

    def update(self, record_id, payload=None):
        """Mô tả: Cập nhật một bản ghi tồn tại.
        Input: record_id và payload tùy chọn; mặc định đọc từ request.
        Output: JSON response chứa bản ghi sau cập nhật.
        Ràng buộc: Chỉ writable_fields được ghi và record phải tồn tại.
        Ngoại lệ: ValidationError/ORM được chuyển thành phản hồi lỗi API.
        """
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
        """Mô tả: Xóa một bản ghi theo id.
        Input: record_id.
        Output: JSON response chứa id đã xóa hoặc lỗi.
        Ràng buộc: Record phải tồn tại và không bị quan hệ khác ngăn xóa.
        Ngoại lệ: Ngoại lệ unlink được chuyển thành lỗi G600.
        """
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
        """Mô tả: Chọn cập nhật hoặc sao chép dựa trên payload.
        Input: record_id, action và các trường ghi trong request.
        Output: JSON response từ update hoặc copy.
        Ràng buộc: action copy hoặc không có giá trị ghi sẽ thực hiện copy.
        Ngoại lệ: Ngoại lệ từ nhánh xử lý được chuyển thành phản hồi API.
        """
        payload = self.normalizer.payload()
        if payload.get("action") != "copy" and self.normalizer.writable_values(payload):
            return self.update(record_id, payload)
        return self.copy(record_id)

    def copy(self, record_id):
        """Mô tả: Sao chép một bản ghi với các trường duy nhất mới.
        Input: record_id và columnlist tùy chọn.
        Output: JSON response chứa bản sao.
        Ràng buộc: Record nguồn phải tồn tại và giá trị unique không trùng.
        Ngoại lệ: ValidationError/ORM được chuyển thành mã H603/H600.
        """
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("H604", "Id không tồn tại.")

        fields_list, error = self.normalizer.resolve_fields(self.normalizer.payload().get("columnlist"))
        if error:
            return self.serializer.error("H603", error)

        try:
            copied = record.with_context(allow_missing_email_for_copy=True).copy(self.normalizer.copy_values(record))
        except ValidationError as exc:
            return self.serializer.error("H603", self._user_error_message(exc))
        except Exception as exc:
            return self.serializer.error("H600", self._user_error_message(exc, action="copy"))
        return self.serializer.success(
            self.serializer.read_record(copied, fields_list),
            "Sao chép thành công.",
        )

    def mass_copy(self):
        """Mô tả: Sao chép đồng thời các bản ghi trong danh sách id.
        Input: Payload chứa idlist/ids và columnlist tùy chọn.
        Output: JSON response chứa danh sách bản sao.
        Ràng buộc: Tất cả id phải tồn tại.
        Ngoại lệ: ValidationError/ORM được chuyển thành mã H603/H600.
        """
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
                copied_records |= record.with_context(allow_missing_email_for_copy=True).copy(self.normalizer.copy_values(record))
        except ValidationError as exc:
            return self.serializer.error("H603", self._user_error_message(exc))
        except Exception as exc:
            return self.serializer.error("H600", self._user_error_message(exc, action="copy"))
        return self.serializer.success(
            self.serializer.read_records(copied_records, fields_list),
            "Sao chép thành công.",
        )

    def mass_delete(self):
        """Mô tả: Xóa đồng thời các bản ghi trong danh sách id.
        Input: Payload chứa idlist hoặc ids.
        Output: JSON response chứa danh sách id đã xóa.
        Ràng buộc: Tất cả id phải tồn tại và có thể xóa.
        Ngoại lệ: Ngoại lệ unlink được chuyển thành mã I600.
        """
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
        """Mô tả: Import nhiều bản ghi từ tệp được gửi trong request.
        Input: Payload chứa attachment và loại tệp.
        Output: JSON response chứa các bản ghi đã tạo.
        Ràng buộc: Định dạng và từng dòng phải hợp lệ với model.
        Ngoại lệ: Lỗi tệp, ValidationError và ORM được chuyển thành lỗi API.
        """
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
        """Mô tả: Xuất một bản ghi theo định dạng yêu cầu.
        Input: record_id, columnlist và type từ request.
        Output: JSON response chứa dữ liệu JSON hoặc tệp base64.
        Ràng buộc: Record, cột và định dạng phải hợp lệ.
        Ngoại lệ: Lỗi xuất được chuyển thành mã K601/K600.
        """
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
        """Mô tả: Xuất toàn bộ hoặc một nhóm bản ghi.
        Input: Payload chứa ids, columnlist và type tùy chọn.
        Output: JSON response chứa dữ liệu JSON hoặc tệp base64.
        Ràng buộc: Nếu truyền ids thì tất cả id phải tồn tại.
        Ngoại lệ: Lỗi xuất được chuyển thành mã L601 hoặc mã liên quan.
        """
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
        """Mô tả: Thu thập lỗi theo trường cho payload.
        Input: Dictionary payload.
        Output: Dictionary lỗi từ ApiValidator.
        Ràng buộc: Dùng cấu hình model hiện tại.
        Ngoại lệ: Ngoại lệ validator/ORM được truyền lên.
        """
        return self.validator.field_errors(self.model_name, self.model, payload, self.normalizer)

    def _constraint_error_payload(self, exc):
        """Mô tả: Chuyển ngoại lệ constraint thành payload lỗi theo trường.
        Input: Đối tượng ngoại lệ.
        Output: Dictionary errors hoặc None.
        Ràng buộc: Chỉ constraint nhận diện được mới có payload.
        Ngoại lệ: Không phát sinh trực tiếp.
        """
        field_error = self._constraint_field_error(str(exc))
        if not field_error:
            return None

        field_name, error_message = field_error
        return {"errors": {field_name: error_message}}

    def _constraint_field_error(self, message):
        """Mô tả: Nhận diện tên trường và thông báo từ lỗi constraint.
        Input: Chuỗi thông báo lỗi.
        Output: Tuple (field_name, message) hoặc None.
        Ràng buộc: Dựa trên mapping và model hiện tại.
        Ngoại lệ: Không phát sinh với đầu vào chuỗi hoặc rỗng.
        """
        lower_message = (message or "").lower()

        for marker, field_error in self.CONSTRAINT_FIELD_ERRORS.items():
            if marker in message:
                return field_error

        if "duplicate key value" not in lower_message and "unique constraint" not in lower_message:
            return None

        if self.model_name == "tra_student":
            if "email" in lower_message:
                return "email", "Email đã tồn tại. Vui lòng nhập email khác."
            if "username" in lower_message:
                return "username", "Tài khoản đã tồn tại. Vui lòng nhập tài khoản khác."
            if "code" in lower_message:
                return "code", "Mã học sinh đã tồn tại. Vui lòng nhập mã khác."

        if self.model_name == "tra_class" and "code" in lower_message:
            return "code", "Mã lớp đã tồn tại. Vui lòng nhập mã khác."

        return None

    def _error_payload(self, message):
        """Mô tả: Tạo payload lỗi theo trường từ thông báo nghiệp vụ.
        Input: Chuỗi thông báo.
        Output: Dictionary errors hoặc None.
        Ràng buộc: Thông báo phải ánh xạ được sang một trường.
        Ngoại lệ: Không phát sinh trực tiếp.
        """
        field_name = self._field_name_from_message(message)
        if not field_name:
            return None
        return {"errors": {field_name: message}}

    def _field_name_from_message(self, message):
        """Mô tả: Suy ra tên trường từ nội dung thông báo lỗi.
        Input: Chuỗi thông báo lỗi.
        Output: Tên trường hoặc None.
        Ràng buộc: Chỉ nhận diện các từ khóa đã khai báo.
        Ngoại lệ: Không phát sinh với đầu vào chuỗi hoặc rỗng.
        """
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
        """Mô tả: Chuyển lỗi kỹ thuật thành thông báo phù hợp người dùng.
        Input: Ngoại lệ và tên hành động tùy chọn.
        Output: Chuỗi thông báo nghiệp vụ.
        Ràng buộc: Ưu tiên constraint, required rồi loại lỗi cơ sở dữ liệu.
        Ngoại lệ: Không truyền ngoại lệ gốc; trả chuỗi gốc nếu không nhận diện.
        """
        message = str(exc)
        lower_message = message.lower()

        constraint_field_error = self._constraint_field_error(message)
        if constraint_field_error:
            return constraint_field_error[1]

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
        """Mô tả: Lấy thông báo nghiệp vụ cho lỗi thiếu trường bắt buộc.
        Input: Chuỗi thông báo lỗi gốc.
        Output: Thông báo cấu hình hoặc None.
        Ràng buộc: Dùng rule của model hiện tại.
        Ngoại lệ: Ngoại lệ validator được truyền lên.
        """
        return self.validator.required_field_message(self.model_name, message)
