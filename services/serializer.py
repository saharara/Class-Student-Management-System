from odoo.http import request


class ApiSerializer:
    def json_response(self, code=200, status="success", message="Thanh cong", data=None):
        return request.make_json_response(
            {
                "code": code,
                "status": status,
                "message": message,
                "data": data,
            }
        )

    def success(self, data=None, message="Thanh cong"):
        return self.json_response(200, "success", message, data)

    def error(self, code, message, data=None):
        return self.json_response(code, "error", message, data)

    def read_record(self, record, fields_list):
        values = record.read(fields_list)[0]
        for key, value in list(values.items()):
            if isinstance(value, tuple):
                values[key] = value[0]
            elif isinstance(value, bytes):
                values[key] = value.decode()
        return values

    def read_records(self, records, fields_list):
        return [self.read_record(record, fields_list) for record in records]
