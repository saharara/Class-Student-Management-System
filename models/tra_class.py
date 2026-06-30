# Khai báo thông tin của lớp 

from odoo import models, fields, api

class EdManageClass(models.Model):
    _name        = 'tra.class'           # ← đổi thành tra_class trong DB
    _description = 'Lớp học'

    code        = fields.Char(string='Mã lớp', required=True, size=50)
    name        = fields.Char(string='Tên lớp', required=True, size=100)
    description = fields.Text(string='Mô tả')
    active      = fields.Boolean(default=True)

    student_ids = fields.One2many(
        'tra.student', 'class_id', string='Danh sách học sinh'
    )
    student_count = fields.Integer(
        string='Số học sinh',
        compute='_compute_student_count',
        store=True
    )

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Mã lớp đã tồn tại!')
    ]

    @api.depends('student_ids')
    def _compute_student_count(self):
        for rec in self:
            rec.student_count = len(rec.student_ids)