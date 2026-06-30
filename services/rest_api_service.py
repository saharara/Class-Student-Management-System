import math

from odoo.exceptions import ValidationError
from odoo.http import request

from .export_factory import ExportFactory
from .import_factory import ImportFactory
from .normalizer import ApiNormalizer
from .serializer import ApiSerializer
from .validator import ApiValidator


class RestApiService:
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
        try:
            record = self.model.create(self.normalizer.writable_values(self.normalizer.payload()))
        except ValidationError as exc:
            return self.serializer.error("E603", str(exc))
        except Exception as exc:
            return self.serializer.error("E600", str(exc))
        return self.serializer.success({"id": record.id}, "Them moi thanh cong.")

    def get_by_id(self, record_id):
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("D607", error)

        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("D604", "Ban ghi khong ton tai.")
        return self.serializer.success(self.serializer.read_record(record, fields_list))

    def update(self, record_id, payload=None):
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("D604", "Ban ghi khong ton tai.")

        try:
            record.write(self.normalizer.writable_values(payload or self.normalizer.payload()))
        except ValidationError as exc:
            return self.serializer.error("F603", str(exc))
        except Exception as exc:
            return self.serializer.error("F600", str(exc))
        return self.serializer.success({"id": record.id}, "Cap nhat thanh cong.")

    def destroy(self, record_id):
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("G604", "Ban ghi khong ton tai.")

        try:
            deleted_id = record.id
            record.unlink()
        except Exception as exc:
            return self.serializer.error("G600", str(exc))
        return self.serializer.success({"id": deleted_id}, "Xoa thanh cong.")

    def copy_or_update(self, record_id):
        payload = self.normalizer.payload()
        if payload.get("action") != "copy" and self.normalizer.writable_values(payload):
            return self.update(record_id, payload)
        return self.copy(record_id)

    def copy(self, record_id):
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("H604", "Id khong ton tai.")

        fields_list, error = self.normalizer.resolve_fields(self.normalizer.payload().get("columnlist"))
        if error:
            return self.serializer.error("H603", error)

        try:
            copied = record.copy(self.normalizer.copy_values(record))
        except ValidationError as exc:
            return self.serializer.error("H603", str(exc))
        except Exception as exc:
            return self.serializer.error("H600", str(exc))
        return self.serializer.success(
            self.serializer.read_record(copied, fields_list),
            "Sao chep thanh cong.",
        )

    def mass_copy(self):
        payload = self.normalizer.payload()
        ids = self.normalizer.ids(payload)
        records = self.validator.records_by_ids(self.model, ids)
        if not ids or records is None:
            return self.serializer.error("H604", "Id khong ton tai.")

        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("H603", error)

        try:
            copied_records = self.model
            for record in records:
                copied_records |= record.copy(self.normalizer.copy_values(record))
        except ValidationError as exc:
            return self.serializer.error("H603", str(exc))
        except Exception as exc:
            return self.serializer.error("H600", str(exc))
        return self.serializer.success(
            self.serializer.read_records(copied_records, fields_list),
            "Sao chep thanh cong.",
        )

    def mass_delete(self):
        payload = self.normalizer.payload()
        ids = self.normalizer.ids(payload)
        records = self.validator.records_by_ids(self.model, ids)
        if not ids or records is None:
            return self.serializer.error("I604", "Cac ban ghi khong xoa duoc.")

        try:
            records.unlink()
        except Exception as exc:
            return self.serializer.error("I600", str(exc))
        return self.serializer.success({"ids": ids}, "Xoa thanh cong.")

    def import_data(self):
        rows, error_code, error = self.import_factory.rows(self.normalizer.payload())
        if error:
            return self.serializer.error(error_code, error)

        try:
            records = self.model.create([self.normalizer.writable_values(row) for row in rows])
        except ValidationError as exc:
            return self.serializer.error("E603", str(exc))
        except Exception as exc:
            return self.serializer.error("E600", str(exc))
        return self.serializer.success(
            self.serializer.read_records(records, self.fields),
            "Import thanh cong.",
        )

    def export_data(self):
        payload = self.normalizer.payload()
        fields_list, error = self.normalizer.resolve_fields(payload.get("columnlist"))
        if error:
            return self.serializer.error("L607", error)

        ids = self.normalizer.ids(payload)
        domain = [("id", "in", ids)] if ids else []
        records = self.model.search(domain, order=self.default_order)
        if ids and len(records) != len(ids):
            return self.serializer.error("L602", "Danh sach ban ghi khong ton tai.")

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
