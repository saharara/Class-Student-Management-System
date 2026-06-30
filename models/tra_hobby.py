from odoo import api, fields, models
from odoo.exceptions import ValidationError


class TraHobby(models.Model):
    _name = "tra_hobby"
    _description = "Hobby"
    _rec_name = "name"
    _order = "sequence, id"

    sequence = fields.Integer(string="Thứ tự", default=10)
    code = fields.Char(string="Mã sở thích", required=True, size=20)
    name = fields.Char(string="Tên sở thích", required=True, size=100)

    _sql_constraints = [
        ("tra_hobby_code_unique", "unique(code)", "Mã sở thích phải là duy nhất."),
        ("tra_hobby_name_unique", "unique(name)", "Tên sở thích phải là duy nhất."),
    ]

    @api.constrains("code", "name")
    def _check_lengths(self):
        for record in self:
            if record.code and len(record.code) > 20:
                raise ValidationError("Mã sở thích không được vượt quá 20 ký tự.")
            if record.name and len(record.name) > 100:
                raise ValidationError("Tên sở thích không được vượt quá 100 ký tự.")
