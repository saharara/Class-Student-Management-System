import json

from odoo.http import request


class ApiNormalizer:
    def __init__(self, service):
        self.service = service

    def payload(self):
        http_request = request.httprequest
        payload = {}
        json_payload = http_request.get_json(silent=True)
        if isinstance(json_payload, dict):
            payload.update(json_payload)
        payload.update(http_request.form.to_dict(flat=True))
        payload.update(http_request.args.to_dict(flat=True))
        return payload

    def resolve_fields(self, columnlist):
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
            return None, "Danh sach columnList khong hop le."

        fields = []
        for column in columns:
            field_name = self.service.aliases.get(str(column), str(column))
            if field_name not in self.service.fields:
                return None, "Cot %s khong hop le." % column
            fields.append(field_name)
        return fields, None

    def search_domain(self, search):
        if not search:
            return []

        domain = []
        for index, field_name in enumerate(self.service.search_fields):
            if index:
                domain.insert(0, "|")
            domain.append((field_name, "ilike", search))
        return domain

    def order(self, order):
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
        source = payload.get("kw") if isinstance(payload.get("kw"), dict) else payload
        return {
            field_name: self.convert_writable_value(field_name, source[field_name])
            for field_name in self.service.writable_fields
            if field_name in source
        }

    def convert_writable_value(self, field_name, value):
        field = self.service.model._fields[field_name]
        if value in ("", None):
            return False if field.type == "many2one" else value

        if field.type == "many2one":
            related_model = request.env[field.comodel_name]
            if isinstance(value, str) and value.isdigit():
                record = related_model.search([("code", "=", value)], limit=1)
                return record.id if record else int(value)
            if isinstance(value, int):
                return int(value)
            record = related_model.search(["|", ("code", "=", value), ("name", "=", value)], limit=1)
            return record.id if record else value

        return value

    def ids(self, payload):
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
        values = {}
        for field_name in self.service.unique_copy_fields:
            original = record[field_name] or field_name
            values[field_name] = self.unique_copy_value(field_name, original, record.id)
        return values

    def unique_copy_value(self, field_name, original, record_id):
        field = self.service.model._fields[field_name]
        max_size = getattr(field, "size", None)
        if field_name == "email" and "@" in original:
            local_part, domain_part = original.split("@", 1)
            base = "%s.copy%s@%s" % (local_part, record_id, domain_part)
        else:
            base = "%s-copy%s" % (original, record_id)

        if max_size:
            base = base[:max_size]

        candidate = base
        index = 2
        while self.service.model.search_count([(field_name, "=", candidate)]):
            suffix = "-%s" % index
            candidate = (base[: max_size - len(suffix)] + suffix) if max_size else base + suffix
            index += 1
        return candidate
