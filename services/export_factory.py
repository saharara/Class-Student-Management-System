import base64
import csv
import html
import io
import zipfile
import xml.etree.ElementTree as ET

try:
    import xlsxwriter
except ImportError:
    xlsxwriter = None

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
except ImportError:
    colors = None
    A4 = None
    landscape = None
    SimpleDocTemplate = None
    Table = None
    TableStyle = None


class ExportFactory:
    def export(self, model_name, fields_list, data, export_type):
        export_type = (export_type or "json").lower()
        if export_type == "json":
            return {"type": "json", "data": data}
        if export_type == "csv":
            filename, mimetype, content = self._records_to_csv(model_name, fields_list, data)
        elif export_type == "xml":
            filename, mimetype, content = self._records_to_xml(model_name, data)
        elif export_type in ("xlsx", "excel"):
            if xlsxwriter is None:
                return {"error": ("L601", "Thu vien xuat xlsx chua san sang.")}
            filename, mimetype, content = self._records_to_xlsx(model_name, fields_list, data)
        elif export_type == "pdf":
            if SimpleDocTemplate is None:
                return {"error": ("L601", "Thu vien xuat pdf chua san sang.")}
            filename, mimetype, content = self._records_to_pdf(model_name, fields_list, data)
        elif export_type in ("docx", "word"):
            filename, mimetype, content = self._records_to_docx(model_name, fields_list, data)
        else:
            return {"error": ("L601", "Dinh dang tep khong duoc ho tro.")}

        return {
            "type": "file",
            "data": {
                "filename": filename,
                "mimetype": mimetype,
                "buffer": base64.b64encode(content).decode(),
            },
        }

    def _records_to_csv(self, model_name, fields_list, data):
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields_list)
        writer.writeheader()
        writer.writerows(data)
        return "%s_export.csv" % model_name, "text/csv", output.getvalue().encode("utf-8-sig")

    def _records_to_xml(self, model_name, data):
        root = ET.Element("records")
        for row in data:
            record_node = ET.SubElement(root, "record")
            for key, value in row.items():
                child = ET.SubElement(record_node, key)
                child.text = "" if value is None else str(value)
        return (
            "%s_export.xml" % model_name,
            "application/xml",
            ET.tostring(root, encoding="utf-8", xml_declaration=True),
        )

    def _records_to_xlsx(self, model_name, fields_list, data):
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet("Data")
        header_format = workbook.add_format({"bold": True})
        for column, field_name in enumerate(fields_list):
            worksheet.write(0, column, field_name, header_format)
        for row_index, row in enumerate(data, start=1):
            for column, field_name in enumerate(fields_list):
                worksheet.write(row_index, column, row.get(field_name))
        workbook.close()
        return (
            "%s_export.xlsx" % model_name,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            output.getvalue(),
        )

    def _records_to_pdf(self, model_name, fields_list, data):
        output = io.BytesIO()
        document = SimpleDocTemplate(
            output,
            pagesize=landscape(A4),
            rightMargin=18,
            leftMargin=18,
            topMargin=18,
            bottomMargin=18,
        )
        table_data = [fields_list]
        for row in data:
            table_data.append(["" if row.get(field) is None else str(row.get(field)) for field in fields_list])
        table = Table(table_data, repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                ]
            )
        )
        document.build([table])
        return "%s_export.pdf" % model_name, "application/pdf", output.getvalue()

    def _records_to_docx(self, model_name, fields_list, data):
        rows = ["<w:tr>%s</w:tr>" % "".join(self._docx_cell(field) for field in fields_list)]
        for row in data:
            rows.append(
                "<w:tr>%s</w:tr>"
                % "".join(self._docx_cell("" if row.get(field) is None else row.get(field)) for field in fields_list)
            )
        document_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>%s</w:tbl>
    <w:sectPr/>
  </w:body>
</w:document>""" % "".join(rows)
        content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""
        relationships = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""
        output = io.BytesIO()
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("[Content_Types].xml", content_types)
            archive.writestr("_rels/.rels", relationships)
            archive.writestr("word/document.xml", document_xml)
        return (
            "%s_export.docx" % model_name,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            output.getvalue(),
        )

    def _docx_cell(self, value):
        return "<w:tc><w:p><w:r><w:t>%s</w:t></w:r></w:p></w:tc>" % html.escape(str(value))
