from odoo import http

from .api_utils import RestApiMixin


class ClassController(http.Controller, RestApiMixin):
    MODEL = "tra_class"
    FIELDS = ["id", "code", "name", "description", "student_count"]
    WRITABLE_FIELDS = ["code", "name", "description"]
    ALIASES = {
        "id": "id",
        "co": "code",
        "code": "code",
        "na": "name",
        "name": "name",
        "des": "description",
        "description": "description",
        "student_count": "student_count",
        "studentCount": "student_count",
        "sc": "student_count",
    }
    SEARCH_FIELDS = ["code", "name", "description"]
    UNIQUE_COPY_FIELDS = ["code"]
    DEFAULT_ORDER = "code"

    @http.route("/edmanage-class", type="http", auth="user", methods=["GET"], csrf=False)
    def get_all_route(self, **kw):
        return self.get_all()

    @http.route("/edmanage-class", type="http", auth="user", methods=["POST"], csrf=False)
    def store_route(self, **kw):
        return self.store()

    @http.route(
        ["/edmanage-class/page/<int:init>", "/edmanage-class/page/<int:init>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def get_by_page_route(self, init=1, **kw):
        return self.get_by_page(init)

    @http.route("/edmanage-class/copy", type="http", auth="user", methods=["POST"], csrf=False)
    def mass_copy_route(self, **kw):
        return self.mass_copy()

    @http.route("/edmanage-class/delete", type="http", auth="user", methods=["DELETE"], csrf=False)
    def mass_delete_route(self, **kw):
        service = self._service()
        payload = service.normalizer.payload()
        ids = service.normalizer.ids(payload)
        records = service.validator.records_by_ids(service.model, ids)
        if not ids or records is None:
            return service.serializer.error("I604", "Id lớp không tồn tại.")
        return self._delete_classes(records, many=True)

    @http.route("/edmanage-class/import", type="http", auth="user", methods=["POST"], csrf=False)
    def import_route(self, **kw):
        return self.import_data()

    @http.route("/edmanage-class/export", type="http", auth="user", methods=["GET"], csrf=False)
    def export_route(self, **kw):
        return self.export_data()

    @http.route(
        ["/edmanage-class/export/<int:record_id>", "/edmanage-class/export/<int:record_id>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def export_by_id_route(self, record_id, **kw):
        return self.export_by_id(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["GET"], csrf=False)
    def get_by_id_route(self, record_id, **kw):
        return self.get_by_id(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["PUT"], csrf=False)
    def update_route(self, record_id, **kw):
        return self.update(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["POST"], csrf=False)
    def copy_or_update_route(self, record_id, **kw):
        return self.copy_or_update(record_id)
    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["DELETE"], csrf=False)
    def destroy_route(self, record_id, **kw):
        service = self._service()
        record = service.validator.existing_record(service.model, record_id)
        if not record:
            return service.serializer.error("G604", "Bản ghi không tồn tại.")
        return self._delete_classes(record, many=False)

    def _classes_with_students(self, records):
        classes = []
        total_students = 0
        for record in records:
            student_count = len(record.student_ids)
            if student_count:
                total_students += student_count
                classes.append(
                    {
                        "id": record.id,
                        "code": record.code,
                        "name": record.name,
                        "student_count": student_count,
                    }
                )
        return classes, total_students

    def _delete_classes(self, records, many=False):
        service = self._service()
        classes, total_students = self._classes_with_students(records)
        if classes:
            return service.serializer.error(
                "I409" if many else "G409",
                "Lớp học đang có học sinh nên không thể xóa. Vui lòng chuyển hoặc xóa học sinh trước.",
                {
                    "student_count": total_students,
                    "classes": classes,
                },
            )

        deleted_ids = records.ids
        try:
            records.unlink()
        except Exception as exc:
            return service.serializer.error(
                "I600" if many else "G600",
                service._user_error_message(exc, action="delete"),
            )

        return service.serializer.success(
            {"ids": deleted_ids},
            "Xóa thành công.",
        )
