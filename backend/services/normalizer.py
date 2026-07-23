import base64
import json
import os

from odoo.exceptions import ValidationError
from odoo.http import request


class ApiNormalizer:
    def __init__(self, service):
        """Mô tả: Khởi tạo bộ chuẩn hóa gắn với một RestApiService.
        Input: service - service cung cấp cấu hình model và trường.
        Output: Đối tượng ApiNormalizer đã lưu tham chiếu service.
        Ràng buộc: service phải cung cấp các thuộc tính cấu hình được sử dụng.
        Ngoại lệ: Không phát sinh trực tiếp.
        """
        self.service = service

    def payload(self):
        """Mô tả: Hợp nhất JSON, form, query string và tệp upload của request.
        Input: Request HTTP hiện tại của Odoo.
        Output: Dictionary payload đã chuẩn hóa; tệp được mã hóa base64.
        Ràng buộc: form và query string ghi đè khóa trùng từ JSON.
        Ngoại lệ: Ngoại lệ đọc request hoặc tệp được truyền lên.
        """
        http_request = request.httprequest
        payload = {}
        json_payload = http_request.get_json(silent=True)
        if isinstance(json_payload, dict):
            payload.update(json_payload)
        payload.update(http_request.form.to_dict(flat=True))
        payload.update(http_request.args.to_dict(flat=True))

        uploaded_file = http_request.files.get("attachment") or http_request.files.get("file")
        if uploaded_file:
            payload["attachment"] = base64.b64encode(uploaded_file.read()).decode()
            extension = os.path.splitext(uploaded_file.filename or "")[1].lstrip(".").lower()
            if extension and not payload.get("type") and not payload.get("file_type"):
                payload["type"] = extension
        return payload

    def resolve_fields(self, columnlist):
        """Mô tả: Chuyển danh sách cột API thành tên trường model.
        Input: columnlist dạng chuỗi, list hoặc giá trị rỗng.
        Output: Tuple (fields, error_message).
        Ràng buộc: Mọi trường phải thuộc service.fields hoặc có alias hợp lệ.
        Ngoại lệ: Lỗi cú pháp được chuyển thành thông báo, không truyền lên.
        """
        if not columnlist:
            return list(self.service.fields), None

        if isinstance(columnlist, str):
            try:
                parsed = json.loads(columnlist)
                columns = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                columns = [
                    item.strip()
                    for item in columnlist.strip("[]").replace("-", ",").split(",")
                    if item.strip()
                ]
        elif isinstance(columnlist, list):
            columns = columnlist
        else:
            return None, "Danh sách cột không hợp lệ."

        fields = []
        for column in columns:
            field_name = self.service.aliases.get(str(column), str(column))
            if field_name not in self.service.fields:
                return None, "Cột %s không hợp lệ." % column
            fields.append(field_name)
        return fields, None

    def search_domain(self, search):
        """Mô tả: Tạo domain tìm kiếm OR trên các trường cấu hình.
        Input: search - từ khóa tìm kiếm.
        Output: Domain Odoo hoặc danh sách rỗng khi không có từ khóa.
        Ràng buộc: Chỉ dùng các trường trong service.search_fields.
        Ngoại lệ: Không phát sinh trực tiếp.
        """
        if not search:
            return []

        domain = []
        for index, field_name in enumerate(self.service.search_fields):
            if index:
                domain.insert(0, "|")
            domain.append((field_name, "ilike", search))
        return domain

    def order(self, order):
        """Mô tả: Chuẩn hóa biểu thức sắp xếp từ cú pháp alias:direction.
        Input: order - chuỗi các tiêu chí phân cách bằng dấu gạch ngang.
        Output: Chuỗi order ORM hoặc thứ tự mặc định.
        Ràng buộc: Bỏ qua trường không hợp lệ; direction 1 là tăng dần.
        Ngoại lệ: Không phát sinh với đầu vào chuỗi hoặc rỗng.
        """
        if not order:
            return self.service.default_order

        items = []
        raw_items = order.strip().strip("[]").split("-")
        for item in raw_items:
            if not item or ":" not in item:
                continue
            alias, direction = item.split(":", 1)
            field_name = self.service.aliases.get(alias.strip(), alias.strip())
            if field_name not in self.service.fields:
                continue
            items.append("%s %s" % (field_name, "asc" if direction.strip() == "1" else "desc"))
        return ", ".join(items) or self.service.default_order

    def writable_values(self, payload):
        """Mô tả: Lọc và chuyển đổi các trường được phép ghi.
        Input: payload trực tiếp hoặc payload có dictionary kw.
        Output: Dictionary giá trị phù hợp để create hoặc write.
        Ràng buộc: Chỉ lấy trường trong service.writable_fields.
        Ngoại lệ: ValidationError từ convert_writable_value được truyền lên.
        """
        source = payload.get("kw") if isinstance(payload.get("kw"), dict) else payload
        return {
            field_name: self.convert_writable_value(field_name, source[field_name])
            for field_name in self.service.writable_fields
            if field_name in source
        }

    def convert_writable_value(self, field_name, value):
        """Mô tả: Chuyển một giá trị API theo kiểu trường Odoo.
        Input: field_name và giá trị thô.
        Output: Giá trị ORM; many2one trở thành id và integer thành số nguyên.
        Ràng buộc: field_name phải tồn tại; many2one phải trỏ đến record hợp lệ.
        Ngoại lệ: ValidationError khi quan hệ không tồn tại hoặc số nguyên sai.
        """
        field = self.service.model._fields[field_name]
        if value in ("", None):
            if field.type == "many2one":
                if field.required:
                    raise ValidationError("Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ.")
                return False
            if field.type == "integer":
                return 0
            return value

        if field.type == "many2one":
            related_model = request.env[field.comodel_name]
            if isinstance(value, dict):
                value = value.get("id") or value.get("value") or value.get("code") or value.get("name")

            if isinstance(value, str):
                value = value.strip()

            if isinstance(value, str) and value.isdigit():
                record = related_model.browse(int(value)).exists()
                if record:
                    return record.id
                record = related_model.search([("code", "=", value)], limit=1)
                if record:
                    return record.id
                raise ValidationError("Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ.")

            if isinstance(value, int):
                record = related_model.browse(value).exists()
                if record:
                    return record.id
                raise ValidationError("Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ.")

            record = related_model.search(["|", ("code", "=", value), ("name", "=", value)], limit=1)
            if record:
                return record.id
            raise ValidationError("Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ.")

        if field.type == "integer":
            try:
                return int(value)
            except (TypeError, ValueError) as exc:
                raise ValidationError("%s phải là số nguyên." % field_name) from exc

        return value

    def ids(self, payload):
        """Mô tả: Chuẩn hóa idlist hoặc ids thành danh sách số nguyên.
        Input: payload có idlist/ids dạng JSON string, CSV string, int hoặc list.
        Output: Danh sách id số nguyên hợp lệ.
        Ràng buộc: Phần tử không chỉ gồm chữ số sẽ bị bỏ qua.
        Ngoại lệ: Lỗi phân tích JSON được xử lý bằng cách đọc chuỗi CSV.
        """
        idlist = payload.get("idlist") or payload.get("ids")
        if isinstance(idlist, str):
            try:
                parsed = json.loads(idlist)
                idlist = parsed
            except Exception:
                idlist = [item.strip() for item in idlist.split(",") if item.strip()]
        if isinstance(idlist, int):
            idlist = [idlist]
        if not isinstance(idlist, list):
            return []
        return [int(record_id) for record_id in idlist if str(record_id).isdigit()]

    def copy_values(self, record):
        """Mô tả: Sinh các giá trị duy nhất khi sao chép một record.
        Input: record Odoo nguồn.
        Output: Dictionary cho các trường unique_copy_fields.
        Ràng buộc: Mỗi giá trị sinh ra không được trùng trong model.
        Ngoại lệ: Ngoại lệ ORM được truyền lên.
        """
        values = self.service.copy_values
        for field_name in self.service.unique_copy_fields:
            original = record[field_name] or field_name
            values[field_name] = self.unique_copy_value(field_name, original, record.id)
        return values

    def unique_copy_value(self, field_name, original, record_id):
        """Mô tả: Tạo giá trị duy nhất cho một trường của bản sao.
        Input: tên trường, giá trị gốc và id record nguồn.
        Output: Chuỗi có hậu tố (n), giữ cấu trúc email nếu cần.
        Ràng buộc: Không vượt field.size khi trường có giới hạn.
        Ngoại lệ: Ngoại lệ ORM khi kiểm tra trùng được truyền lên.
        """
        field = self.service.model._fields[field_name]
        max_size = getattr(field, "size", None)
        original = str(original or field_name)

        if field_name == "email" and "@" in original:
            local_part, domain_part = original.split("@", 1)
            return self._unique_email_copy_value(field_name, local_part, domain_part, max_size)

        return self._unique_suffix_copy_value(field_name, original, max_size)

    def _unique_email_copy_value(self, field_name, local_part, domain_part, max_size):
        """Mô tả: Tạo địa chỉ email bản sao chưa tồn tại.
        Input: tên trường, phần local, domain và độ dài tối đa.
        Output: Email duy nhất với hậu tố số ở phần local.
        Ràng buộc: Giữ nguyên domain và không vượt max_size nếu được khai báo.
        Ngoại lệ: Ngoại lệ ORM khi kiểm tra trùng được truyền lên.
        """
        index = 1
        while True:
            suffix = "(%s)" % index
            domain = "@%s" % domain_part
            if max_size:
                max_local_size = max_size - len(domain) - len(suffix)
                trimmed_local = local_part[:max(max_local_size, 0)]
            else:
                trimmed_local = local_part
            candidate = "%s%s%s" % (trimmed_local, suffix, domain)
            if not self.service.model.search_count([(field_name, "=", candidate)]):
                return candidate
            index += 1

    def _unique_suffix_copy_value(self, field_name, original, max_size):
        """Mô tả: Tạo chuỗi bản sao duy nhất bằng hậu tố tăng dần.
        Input: tên trường, chuỗi gốc và độ dài tối đa.
        Output: Chuỗi duy nhất dạng original(n).
        Ràng buộc: Cắt phần gốc để không vượt max_size nếu được khai báo.
        Ngoại lệ: Ngoại lệ ORM khi kiểm tra trùng được truyền lên.
        """
        index = 1
        while True:
            suffix = "(%s)" % index
            if max_size:
                candidate = "%s%s" % (original[: max(max_size - len(suffix), 0)], suffix)
            else:
                candidate = "%s%s" % (original, suffix)
            if not self.service.model.search_count([(field_name, "=", candidate)]):
                return candidate
            index += 1
