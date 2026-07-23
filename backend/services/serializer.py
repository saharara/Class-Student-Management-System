from odoo.http import request


class ApiSerializer:
    def json_response(self, code=200, status="success", message="Thành công", data=None):
        """Mô tả: Tạo HTTP JSON response theo cấu trúc thống nhất của API.
        Input: code, status, message và dữ liệu phản hồi tùy chọn.
        Output: Đối tượng Response chứa code, status, message và data.
        Ràng buộc: Chỉ sử dụng được trong ngữ cảnh request của Odoo.
        Ngoại lệ: Ngoại lệ từ request.make_json_response được truyền lên.
        """
        return request.make_json_response(
            {
                "code": code,
                "status": status,
                "message": message,
                "data": data,
            }
        )

    def success(self, data=None, message="Thành công"):
        """Mô tả: Tạo phản hồi API thành công với mã 200.
        Input: data và thông báo thành công tùy chọn.
        Output: HTTP JSON response có status success.
        Ràng buộc: Mã phản hồi cố định là 200.
        Ngoại lệ: Ngoại lệ từ json_response được truyền lên.
        """
        return self.json_response(200, "success", message, data)

    def error(self, code, message, data=None):
        """Mô tả: Tạo phản hồi lỗi theo cấu trúc thống nhất của API.
        Input: code lỗi, thông báo và dữ liệu chi tiết tùy chọn.
        Output: HTTP JSON response có status error.
        Ràng buộc: code và message phải do bên gọi cung cấp.
        Ngoại lệ: Ngoại lệ từ json_response được truyền lên.
        """
        return self.json_response(code, "error", message, data)

    def read_record(self, record, fields_list):
        """Mô tả: Đọc một record và chuẩn hóa dữ liệu để tuần tự hóa JSON.
        Input: record Odoo đơn và danh sách tên trường cần đọc.
        Output: Dictionary dữ liệu; many2one lấy id và bytes được giải mã.
        Ràng buộc: record phải tồn tại và fields_list phải là các trường hợp lệ.
        Ngoại lệ: Ngoại lệ ORM hoặc UnicodeDecodeError được truyền lên.
        """
        values = record.read(fields_list)[0]
        for key, value in list(values.items()):
            if isinstance(value, tuple):
                values[key] = value[0]
            elif isinstance(value, bytes):
                values[key] = value.decode()
        return values

    def read_records(self, records, fields_list):
        """Mô tả: Đọc và chuẩn hóa nhiều record Odoo.
        Input: recordset Odoo và danh sách tên trường.
        Output: Danh sách dictionary theo thứ tự recordset.
        Ràng buộc: Mỗi record phải đáp ứng yêu cầu của read_record.
        Ngoại lệ: Ngoại lệ từ read_record được truyền lên.
        """
        return [self.read_record(record, fields_list) for record in records]
