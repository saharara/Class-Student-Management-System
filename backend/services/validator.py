class ApiValidator:
    def page_params(self, init, payload):
        try:
            current = int(payload.get("page") or init or 1)
            if current < 1:
                raise ValueError
        except Exception:
            return None, None, ("C601", "Lỗi định dạng số trang.")

        try:
            size = int(payload.get("size") or 20)
            if size < 1:
                raise ValueError
        except Exception:
            return None, None, ("C602", "Lỗi định dạng cỡ trang.")

        return current, size, None

    def existing_record(self, model, record_id):
        return model.browse(record_id).exists()

    def records_by_ids(self, model, ids):
        records = model.browse(ids).exists()
        return records if len(records) == len(ids) else None
