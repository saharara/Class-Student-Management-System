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
        attachment = payload.get("attachment")
        if not attachment:
            return None, "J604", "Tep du lieu chua duoc tai len."

        import_type = (payload.get("type") or payload.get("file_type") or "json").lower()
        try:
            raw_content = base64.b64decode(attachment)
        except Exception:
            return None, "J601", "Dinh dang tep khong hop le."

        try:
            if import_type == "json":
                rows = self._json_to_rows(raw_content)
            elif import_type == "csv":
                rows = self._csv_to_rows(raw_content)
            elif import_type == "xml":
                rows = self._xml_to_rows(raw_content)
            elif import_type in ("xlsx", "excel"):
                if openpyxl is None:
                    return None, "J601", "Thu vien doc xlsx chua san sang."
                rows = self._xlsx_to_rows(raw_content)
            else:
                return None, "J601", "Dinh dang tep khong duoc ho tro."
        except Exception:
            return None, "J601", "Dinh dang tep khong hop le."

        if not rows:
            return None, "J605", "Khong co du lieu them moi tu file."
        return rows, None, None

    def _json_to_rows(self, raw_content):
        content = raw_content.decode("utf-8-sig")
        data = json.loads(content)
        return data.get("data", data) if isinstance(data, dict) else data

    def _csv_to_rows(self, raw_content):
        content = raw_content.decode("utf-8-sig")
        return list(csv.DictReader(io.StringIO(content)))

    def _xml_to_rows(self, raw_content):
        root = ET.fromstring(raw_content)
        rows = []
        for record_node in root.findall(".//record"):
            rows.append({child.tag: child.text or "" for child in record_node})
        if not rows:
            for record_node in root.findall(".//row"):
                rows.append({child.tag: child.text or "" for child in record_node})
        return rows

    def _xlsx_to_rows(self, raw_content):
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
