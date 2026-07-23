from .rest_api_service import RestApiService


class ClassApiService(RestApiService):
    """Class-specific operations that do not belong in the HTTP router."""

    def destroy(self, record_id):
        record = self.validator.existing_record(self.model, record_id)
        if not record:
            return self.serializer.error("G604", "Bản ghi không tồn tại.")
        return self._delete_classes(record, many=False)

    def mass_delete(self):
        payload = self.normalizer.payload()
        ids = self.normalizer.ids(payload)
        records = self.validator.records_by_ids(self.model, ids)
        if not ids or records is None:
            return self.serializer.error("I604", "Id lớp không tồn tại.")
        return self._delete_classes(records, many=True)

    @staticmethod
    def _classes_with_students(records):
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
        classes, total_students = self._classes_with_students(records)
        if classes:
            return self.serializer.error(
                "I409" if many else "G409",
                (
                    "Lớp học đang có học sinh nên không thể xóa. "
                    "Vui lòng chuyển hoặc xóa học sinh trước."
                ),
                {
                    "student_count": total_students,
                    "classes": classes,
                },
            )

        deleted_ids = records.ids
        try:
            records.unlink()
        except Exception as exc:
            return self.serializer.error(
                "I600" if many else "G600",
                self._user_error_message(exc, action="delete"),
            )

        return self.serializer.success({"ids": deleted_ids}, "Xóa thành công.")
