from odoo.exceptions import ValidationError

from .validation_rules import MODEL_RULES


class ApiValidator:
    def page_params(self, init, payload):
        """Mô tả: Kiểm tra và chuẩn hóa tham số phân trang.
        Input: init - trang mặc định; payload - dữ liệu có page và size.
        Output: Tuple (page, size, error); error là None khi hợp lệ.
        Ràng buộc: page và size phải là số nguyên lớn hơn hoặc bằng 1.
        Ngoại lệ: Không phát sinh; lỗi định dạng được trả bằng mã C601/C602.
        """
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
        """Mô tả: Tìm một bản ghi còn tồn tại theo id.
        Input: model Odoo và record_id.
        Output: Recordset tồn tại hoặc recordset rỗng.
        Ràng buộc: model phải hỗ trợ browse và exists.
        Ngoại lệ: Ngoại lệ ORM được truyền lên.
        """
        return model.browse(record_id).exists()

    def records_by_ids(self, model, ids):
        """Mô tả: Tìm đủ các bản ghi tương ứng với danh sách id.
        Input: model Odoo và danh sách ids.
        Output: Recordset nếu đủ số lượng, ngược lại trả None.
        Ràng buộc: Mỗi id đầu vào phải trỏ đến một bản ghi tồn tại.
        Ngoại lệ: Ngoại lệ ORM được truyền lên.
        """
        records = model.browse(ids).exists()
        return records if len(records) == len(ids) else None

    def field_errors(self, model_name, model, payload, normalizer):
        """Mô tả: Kiểm tra required, chuyển đổi và duy nhất theo MODEL_RULES.
        Input: tên model, model Odoo, payload và ApiNormalizer.
        Output: Dictionary ánh xạ tên trường sang thông báo lỗi.
        Ràng buộc: Chỉ các trường được khai báo trong MODEL_RULES được kiểm tra.
        Ngoại lệ: ValidationError khi chuyển đổi được thu thành lỗi trường.
        """
        rule = MODEL_RULES.get(model_name)
        if not rule:
            return {}

        source = payload.get("kw") if isinstance(payload.get("kw"), dict) else payload
        is_copy = (payload.get("action") or source.get("action")) == "copy"
        errors = {}

        for field_name, field_rule in rule["rules"].items():
            value = source.get(field_name)
            messages = rule["message"].get(field_name, {})

            required = field_rule.get("required")
            if is_copy and field_rule.get("required_on_copy") is False:
                required = False
            if required and value in (None, ""):
                errors[field_name] = messages.get("required")
                continue

            if field_rule.get("convert") and value not in (None, ""):
                try:
                    normalizer.convert_writable_value(field_name, value)
                except ValidationError:
                    errors[field_name] = messages.get("convert")
                    continue

            if field_rule.get("unique") and value not in (None, ""):
                normalized_value = value.strip() if isinstance(value, str) else value
                if model.with_context(active_test=False).search([(field_name, "=", normalized_value)], limit=1):
                    errors[field_name] = messages.get("unique")

        return errors

    def required_field_message(self, model_name, message):
        """Mô tả: Ánh xạ lỗi trường bắt buộc của ORM sang thông báo nghiệp vụ.
        Input: tên model và chuỗi thông báo lỗi gốc.
        Output: Thông báo đã cấu hình hoặc None nếu không nhận diện được.
        Ràng buộc: Model và trường phải có quy tắc required trong MODEL_RULES.
        Ngoại lệ: Không phát sinh với đầu vào chuỗi hợp lệ.
        """
        rule = MODEL_RULES.get(model_name)
        if not rule:
            return None

        lower_message = message.lower()
        for field_name, field_rule in rule["rules"].items():
            if not field_rule.get("required"):
                continue

            if '"%s"' % field_name in message or "'%s'" % field_name in message:
                if "null value in column" in lower_message or "required" in lower_message:
                    return rule["message"].get(field_name, {}).get("required")

        return None
