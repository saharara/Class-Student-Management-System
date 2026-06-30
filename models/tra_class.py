from odoo import api, fields, models
from odoo.exceptions import ValidationError


class TraClass(models.Model):
    _name = "tra_class"
    _description = "Class"
    _rec_name = "name"
    _order = "code"

    code = fields.Char(string="Ma lop", required=True, size=50)
    name = fields.Char(string="Ten lop", required=True, size=100)
    description = fields.Text(string="Mo ta", required=True)
    student_ids = fields.One2many("tra_student", "class_id", string="Hoc sinh")
    student_count = fields.Integer(
        string="So hoc sinh", compute="_compute_student_count", store=False
    )

    _sql_constraints = [
        ("tra_class_code_unique", "unique(code)", "Ma lop phai la duy nhat."),
    ]

    @api.depends("student_ids")
    def _compute_student_count(self):
        for record in self:
            record.student_count = len(record.student_ids)

    @api.constrains("code", "name")
    def _check_lengths(self):
        for record in self:
            if record.code and len(record.code) > 50:
                raise ValidationError("Ma lop khong duoc vuot qua 50 ky tu.")
            if record.name and len(record.name) > 100:
                raise ValidationError("Ten lop khong duoc vuot qua 100 ky tu.")
