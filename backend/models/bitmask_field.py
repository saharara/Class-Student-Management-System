from odoo import fields
from odoo.exceptions import ValidationError


UINT32_MAX = 0xFFFFFFFF


class UnsignedInteger32(fields.Integer):
    _column_type = ("int8", "int8")

    def _to_uint32(self, value):
        """Mô tả: Chuẩn hóa giá trị trường thành số nguyên không dấu 32 bit.
        Input: value - số, chuỗi số, mapping có khóa id hoặc giá trị rỗng.
        Output: Số nguyên trong miền uint32.
        Ràng buộc: Giá trị phải nằm trong khoảng 0 đến UINT32_MAX.
        Ngoại lệ: ValidationError khi giá trị không phải số nguyên hoặc vượt miền.
        """
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
        """Mô tả: Chuyển bitmask trước khi ghi xuống cơ sở dữ liệu.
        Input: value, record, values và validate theo giao diện field Odoo.
        Output: Số nguyên uint32 đã chuẩn hóa.
        Ràng buộc: Tuân theo miền giá trị của _to_uint32.
        Ngoại lệ: ValidationError khi value không hợp lệ.
        """
        return self._to_uint32(value)

    def convert_to_cache(self, value, record, validate=True):
        """Mô tả: Chuyển bitmask trước khi lưu vào cache Odoo.
        Input: value, record và validate theo giao diện field Odoo.
        Output: Số nguyên uint32 đã chuẩn hóa.
        Ràng buộc: Tuân theo miền giá trị của _to_uint32.
        Ngoại lệ: ValidationError khi value không hợp lệ.
        """
        return self._to_uint32(value)

    def convert_to_record(self, value, record):
        """Mô tả: Chuyển bitmask từ cache sang record Odoo.
        Input: value và record theo giao diện field Odoo.
        Output: Số nguyên uint32 đã chuẩn hóa.
        Ràng buộc: Tuân theo miền giá trị của _to_uint32.
        Ngoại lệ: ValidationError khi value không hợp lệ.
        """
        return self._to_uint32(value)

    def convert_to_read(self, value, record, use_display_name=True):
        """Mô tả: Chuẩn hóa bitmask dùng cho kết quả đọc.
        Input: value, record và use_display_name theo giao diện field Odoo.
        Output: Số nguyên uint32 đã chuẩn hóa.
        Ràng buộc: Tuân theo miền giá trị của _to_uint32.
        Ngoại lệ: ValidationError khi value không hợp lệ.
        """
        return self._to_uint32(value)

    def convert_to_export(self, value, record):
        """Mô tả: Chuẩn hóa bitmask dùng cho dữ liệu xuất.
        Input: value và record theo giao diện field Odoo.
        Output: Số nguyên uint32 đã chuẩn hóa.
        Ràng buộc: Tuân theo miền giá trị của _to_uint32.
        Ngoại lệ: ValidationError khi value không hợp lệ.
        """
        return self._to_uint32(value)
