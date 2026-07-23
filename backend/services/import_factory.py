import base64
import csv
import io
import json
import xml.etree.ElementTree as ET

try:
    import openpyxl
except ImportError:
    openpyxl = None


class ImportFactory:
    def rows(self, payload):
        """Mô tả: Giải mã tệp import và chuyển thành các dòng dữ liệu.
        Input: payload chứa attachment base64 và type hoặc file_type.
        Output: Tuple (rows, error_code, error_message).
        Ràng buộc: Hỗ trợ JSON, CSV, XML và XLSX; tệp phải có dữ liệu.
        Ngoại lệ: Không truyền lỗi phân tích lên; trả mã J601, J604 hoặc J605.
        """
        attachment = payload.get("attachment")
        if not attachment:
            return None, "J604", "Tệp dữ liệu chưa được tải lên."

        import_type = (payload.get("type") or payload.get("file_type") or "json").lower()
        try:
            raw_content = base64.b64decode(attachment)
        except Exception:
            return None, "J601", "Định dạng tệp không hợp lệ."

        try:
            if import_type == "json":
                rows = self._json_to_rows(raw_content)
            elif import_type == "csv":
                rows = self._csv_to_rows(raw_content)
            elif import_type == "xml":
                rows = self._xml_to_rows(raw_content)
            elif import_type in ("xlsx", "excel"):
                if openpyxl is None:
                    return None, "J601", "Chưa cài thư viện đọc tệp XLSX."
                rows = self._xlsx_to_rows(raw_content)
            else:
                return None, "J601", "Định dạng tệp không được hỗ trợ."
        except Exception:
            return None, "J601", "Định dạng tệp không hợp lệ."

        if not rows:
            return None, "J605", "Không có dữ liệu mới để thêm từ tệp."
        return rows, None, None

    def _json_to_rows(self, raw_content):
        """Mô tả: Chuyển nội dung JSON thô thành danh sách dòng.
        Input: raw_content - bytes JSON mã hóa UTF-8.
        Output: Giá trị data của object hoặc dữ liệu JSON gốc.
        Ràng buộc: Nội dung phải là JSON hợp lệ.
        Ngoại lệ: UnicodeDecodeError hoặc JSONDecodeError được truyền lên.
        """
        content = raw_content.decode("utf-8-sig")
        data = json.loads(content)
        return data.get("data", data) if isinstance(data, dict) else data

    def _csv_to_rows(self, raw_content):
        """Mô tả: Chuyển nội dung CSV thành danh sách dictionary.
        Input: raw_content - bytes CSV mã hóa UTF-8.
        Output: Danh sách dòng với khóa lấy từ header.
        Ràng buộc: Dòng đầu tiên được dùng làm tên cột.
        Ngoại lệ: UnicodeDecodeError hoặc lỗi csv được truyền lên.
        """
        content = raw_content.decode("utf-8-sig")
        return list(csv.DictReader(io.StringIO(content)))

    def _xml_to_rows(self, raw_content):
        """Mô tả: Chuyển các node record hoặc row trong XML thành dữ liệu.
        Input: raw_content - bytes XML.
        Output: Danh sách dictionary của các phần tử con.
        Ràng buộc: Ưu tiên node record, chỉ đọc node row khi không có record.
        Ngoại lệ: ParseError khi XML không hợp lệ.
        """
        root = ET.fromstring(raw_content)
        rows = []
        for record_node in root.findall(".//record"):
            rows.append({child.tag: child.text or "" for child in record_node})
        if not rows:
            for record_node in root.findall(".//row"):
                rows.append({child.tag: child.text or "" for child in record_node})
        return rows

    def _xlsx_to_rows(self, raw_content):
        """Mô tả: Đọc worksheet đầu tiên của tệp XLSX thành các dòng dữ liệu.
        Input: raw_content - bytes của workbook XLSX.
        Output: Danh sách dictionary, bỏ qua dòng hoàn toàn rỗng.
        Ràng buộc: Dòng đầu là header và thư viện openpyxl phải sẵn sàng.
        Ngoại lệ: Ngoại lệ đọc workbook của openpyxl được truyền lên.
        """
        workbook = openpyxl.load_workbook(io.BytesIO(raw_content), read_only=True, data_only=True)
        worksheet = workbook.active
        rows = list(worksheet.iter_rows(values_only=True))
        if not rows:
            return []

        headers = [str(value).strip() if value is not None else "" for value in rows[0]]
        data_rows = []
        for row in rows[1:]:
            values = {}
            for index, header in enumerate(headers):
                if header:
                    values[header] = row[index] if index < len(row) else None
            if any(value not in (None, "") for value in values.values()):
                data_rows.append(values)
        return data_rows
