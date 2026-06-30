import base64
import re

from odoo import api, fields, models
from odoo.exceptions import ValidationError


EMAIL_PATTERN = re.compile(r"^[0-9a-zA-Z.\-_]+@[0-9a-zA-Z.\-_]+$")
FACEBOOK_PATTERN = re.compile(r"^https?://[0-9a-zA-Z.\-_]+$")
PASSWORD_PATTERN = re.compile(r"^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9\s]).{8,}$")
ALLOWED_ATTACHMENT_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024


class TraStudent(models.Model):
    _name = "tra_student"
    _description = "Student"
    _rec_name = "fullname"
    _order = "code"

    code = fields.Char(string="Ma hoc sinh", required=True, size=50)
    fullname = fields.Char(string="Ho va ten", required=True, size=30)
    dob = fields.Date(string="Ngay sinh", required=True, default="2000-02-04")
    sex = fields.Boolean(string="Gioi tinh")
    homecity = fields.Char(string="Que quan", size=100)
    address = fields.Char(string="Dia chi", size=100)
    hobbies = fields.Many2one("tra_hobby", string="So thich", ondelete="set null")
    hair_color = fields.Char(string="Mau toc", size=7)
    email = fields.Char(string="Hom thu", required=True, size=256)
    facebook = fields.Char(string="Facebook", size=256)
    class_id = fields.Many2one(
        "tra_class",
        string="Lop quan ly",
        required=True,
        ondelete="cascade",
    )
    username = fields.Char(string="Tai khoan", required=True, size=50)
    password = fields.Char(string="Mat khau", required=True, size=256)
    description = fields.Text(string="Mo ta")
    attachment = fields.Binary(string="Anh the", attachment=True)
    attachment_filename = fields.Char(string="Ten tep anh")

    _sql_constraints = [
        ("tra_student_code_unique", "unique(code)", "Ma hoc sinh phai la duy nhat."),
        ("tra_student_email_unique", "unique(email)", "Email phai la duy nhat."),
        ("tra_student_username_unique", "unique(username)", "Tai khoan phai la duy nhat."),
    ]

    @api.constrains(
        "code",
        "fullname",
        "homecity",
        "address",
        "hair_color",
        "email",
        "facebook",
        "username",
        "password",
    )
    def _check_constraints(self):
        for record in self:
            record._check_length("code", 50, "Ma hoc sinh")
            record._check_length("fullname", 30, "Ho va ten")
            record._check_length("homecity", 100, "Que quan")
            record._check_length("address", 100, "Dia chi")
            record._check_length("hair_color", 7, "Mau toc")
            record._check_length("email", 256, "Email")
            record._check_length("facebook", 256, "Facebook")
            record._check_length("username", 50, "Tai khoan")
            record._check_length("password", 256, "Mat khau")

            if record.email and not EMAIL_PATTERN.match(record.email):
                raise ValidationError("Email khong dung dinh dang.")
            if record.facebook and not FACEBOOK_PATTERN.match(record.facebook):
                raise ValidationError("Facebook khong dung dinh dang.")
            if record.password:
                if len(record.password) < 8:
                    raise ValidationError("Mat khau phai co toi thieu 8 ky tu.")
                if not PASSWORD_PATTERN.match(record.password):
                    raise ValidationError(
                        "Mat khau phai co chu hoa, chu thuong, so va ky tu dac biet."
                    )

    @api.constrains("attachment", "attachment_filename")
    def _check_attachment(self):
        for record in self:
            if not record.attachment:
                continue
            if record.attachment_filename:
                extension = record.attachment_filename.rsplit(".", 1)[-1].lower()
                if extension not in ALLOWED_ATTACHMENT_EXTENSIONS:
                    raise ValidationError("Anh the chi chap nhan tep jpg, jpeg hoac png.")
            try:
                attachment_size = len(base64.b64decode(record.attachment))
            except Exception as exc:
                raise ValidationError("Anh the khong dung dinh dang base64.") from exc
            if attachment_size > MAX_ATTACHMENT_SIZE:
                raise ValidationError("Anh the khong duoc vuot qua 5MB.")

    def _check_length(self, field_name, max_length, label):
        value = self[field_name]
        if value and len(value) > max_length:
            raise ValidationError("%s khong duoc vuot qua %s ky tu." % (label, max_length))
