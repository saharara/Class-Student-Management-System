from odoo import api, fields, models
from odoo.exceptions import ValidationError


class TraClass(models.Model):
    _name = "tra_class"
    _description = "Class"
    _rec_name = "name"
    _order = "code"

    code = fields.Char(string="Mã lớp", required=True, size=50)
    name = fields.Char(string="Tên lớp", required=True, size=100)
    description = fields.Text(string="Mô tả")
    active = fields.Boolean(default=True)
    student_ids = fields.One2many("tra_student", "class_id", string="Học sinh")
    student_count = fields.Integer(
        string="Số học sinh",
        compute="_compute_student_count",
        store=True,
    )

    _sql_constraints = [
        ("tra_class_code_unique", "unique(code)", "Mã lớp phải là duy nhất."),
    ]

    @api.depends("student_ids")
    def _compute_student_count(self):
        for record in self:
            record.student_count = len(record.student_ids)

    @api.constrains("code", "name")
    def _check_lengths(self):
        for record in self:
            if record.code and len(record.code) > 50:
                raise ValidationError("Mã lớp không được vượt quá 50 ký tự.")
            if record.name and len(record.name) > 100:
                raise ValidationError("Tên lớp không được vượt quá 100 ký tự.")
