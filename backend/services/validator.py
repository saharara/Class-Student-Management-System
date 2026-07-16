from odoo.exceptions import ValidationError

from .validation_rules import MODEL_RULES


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

    def field_errors(self, model_name, model, payload, normalizer):
        rule = MODEL_RULES.get(model_name)
        if not rule:
            return {}

        source = payload.get("kw") if isinstance(payload.get("kw"), dict) else payload
        errors = {}

        for field_name, field_rule in rule["rules"].items():
            value = source.get(field_name)
            messages = rule["message"].get(field_name, {})

            if field_rule.get("required") and value in (None, ""):
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
