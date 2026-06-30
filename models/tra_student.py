from odoo import models, fields, api
from odoo.exceptions import ValidationError
import re

class EdManageStudent(models.Model):
    _name        = 'tra.student'         # ← đổi thành tra_student trong DB
    _description = 'Học sinh'

    code        = fields.Char(string='Mã học sinh', required=True, size=50)
    fullname    = fields.Char(string='Họ và tên',   required=True, size=30)
    dob         = fields.Date(string='Ngày sinh',   required=True)
    sex         = fields.Boolean(string='Giới tính')
    homecity    = fields.Char(string='Quê quán',    size=100)
    address     = fields.Char(string='Địa chỉ',     size=100)
    hobbies     = fields.Many2one('tra.hobby',      string='Sở thích')
    hair_color  = fields.Char(string='Màu tóc',     size=7)
    email       = fields.Char(string='Email',       required=True, size=256)
    facebook    = fields.Char(string='Facebook',    size=256)
    class_id    = fields.Many2one('tra.class',      string='Lớp học',
                                  required=True)
    username    = fields.Char(string='Tài khoản',   required=True, size=50)
    password    = fields.Char(string='Mật khẩu',    required=True, size=256)
    description = fields.Text(string='Mô tả')
    attachment  = fields.Binary(string='Ảnh thẻ')
    active      = fields.Boolean(default=True)

    _sql_constraints = [
        ('code_unique',     'UNIQUE(code)',     'Mã học sinh đã tồn tại!'),
        ('username_unique', 'UNIQUE(username)', 'Tài khoản đã tồn tại!'),
        ('email_unique',    'UNIQUE(email)',    'Email đã tồn tại!'),
    ]

    @api.constrains('email')
    def _check_email(self):
        pattern = r'^[0-9a-zA-Z\.\-_]+@[0-9a-zA-Z\.\-_]+$'
        for r in self:
            if r.email and not re.match(pattern, r.email):
                raise ValidationError('Email không hợp lệ!')

    @api.constrains('facebook')
    def _check_facebook(self):
        pattern = r'^http[s]{0,1}://[0-9a-zA-Z\.\-_]+$'
        for r in self:
            if r.facebook and not re.match(pattern, r.facebook):
                raise ValidationError('Facebook URL không hợp lệ!')

    @api.constrains('password')
    def _check_password(self):
        pattern = (
            r'^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])'
            r'(?=.*[^A-Za-z0-9\s]).{8,}$'
        )
        for r in self:
            if r.password and not re.match(pattern, r.password):
                raise ValidationError(
                    'Mật khẩu phải có ít nhất 8 ký tự, '
                    'chữ hoa, chữ thường, số và ký tự đặc biệt!'
                )


class EdManageHobby(models.Model):
    _name        = 'tra.hobby'
    _description = 'Sở thích'

    name        = fields.Char(string='Tên sở thích', required=True)
    description = fields.Text(string='Mô tả')