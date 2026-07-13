from odoo import fields
from odoo.exceptions import ValidationError


UINT32_MAX = 0xFFFFFFFF


class UnsignedInteger32(fields.Integer):
    _column_type = ("int8", "int8")

    def _to_uint32(self, value):
        if isinstance(value, dict):
            value = value.get("id", 0)
        try:
            mask = int(value or 0)
        except (TypeError, ValueError) as exc:
            raise ValidationError("Giá trị bitmask phải là số nguyên.") from exc
        if mask < 0 or mask > UINT32_MAX:
            raise ValidationError("Giá trị bitmask phải nằm trong khoảng từ 0 đến %s." % UINT32_MAX)
        return mask

    def convert_to_column(self, value, record, values=None, validate=True):
        return self._to_uint32(value)

    def convert_to_cache(self, value, record, validate=True):
        return self._to_uint32(value)

    def convert_to_record(self, value, record):
        return self._to_uint32(value)

    def convert_to_read(self, value, record, use_display_name=True):
        return self._to_uint32(value)

    def convert_to_export(self, value, record):
        return self._to_uint32(value)
