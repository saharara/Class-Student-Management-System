import base64
import re

from odoo import api, fields, models
from odoo.exceptions import ValidationError

from .bitmask_field import UINT32_MAX, UnsignedInteger32


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

    code = fields.Char(string="Mã học sinh", required=True, size=50)
    fullname = fields.Char(string="Họ và tên", required=True, size=30)
    dob = fields.Date(string="Ngày sinh", required=True, default="2000-02-04")
    sex = fields.Boolean(string="Giới tính")
    homecity = fields.Char(string="Quê quán", size=100)
    address = fields.Char(string="Địa chỉ", size=100)
    hobbies = UnsignedInteger32(
        string="Sở thích",
        default=0,
        help="32-bit bitmask. Bit 0 maps to hobby code 1; bit 31 maps to hobby code 32.",
    )
    hair_color = fields.Char(string="Màu tóc", size=7)
    email = fields.Char(string="Email", size=256)
    facebook = fields.Char(string="Facebook", size=256)
    class_id = fields.Many2one(
        "tra_class",
        string="Lớp học",
        required=True,
        ondelete="restrict",
    )
    username = fields.Char(string="Tài khoản", required=True, size=50)
    password = fields.Char(string="Mật khẩu", required=True, size=256)
    description = fields.Text(string="Mô tả")
    attachment = fields.Binary(string="Ảnh thẻ", attachment=True)
    attachment_filename = fields.Char(string="Tên tệp ảnh")
    active = fields.Boolean(default=True)

    _sql_constraints = [
        ("tra_student_code_unique", "unique(code)", "Mã học sinh phải là duy nhất."),
        ("tra_student_email_unique", "unique(email)", "Email phải là duy nhất."),
        ("tra_student_username_unique", "unique(username)", "Tài khoản phải là duy nhất."),
    ]

    @api.model_create_multi
    def create(self, vals_list):
        if not self.env.context.get("allow_missing_email_for_copy"):
            for values in vals_list:
                if not values.get("email"):
                    raise ValidationError("Email là trường bắt buộc.")
        return super().create(vals_list)

    def write(self, values):
        if "email" in values and not values.get("email") and not self.env.context.get("allow_missing_email_for_copy"):
            if any(record.email for record in self):
                raise ValidationError("Email là trường bắt buộc.")
        return super().write(values)

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
        """Mô tả: Kiểm tra độ dài và định dạng dữ liệu sinh viên.
        Input: self - recordset sinh viên cần kiểm tra.
        Output: Không trả dữ liệu khi tất cả trường hợp lệ.
        Ràng buộc: Tuân theo giới hạn trường, mẫu email, Facebook và mật khẩu.
        Ngoại lệ: ValidationError tại điều kiện không hợp lệ đầu tiên.
        """
        for record in self:
            record._check_length("code", 50, "Mã học sinh")
            record._check_length("fullname", 30, "Họ và tên")
            record._check_length("homecity", 100, "Quê quán")
            record._check_length("address", 100, "Địa chỉ")
            record._check_length("hair_color", 7, "Màu tóc")
            record._check_length("email", 256, "Email")
            record._check_length("facebook", 256, "Facebook")
            record._check_length("username", 50, "Tài khoản")
            record._check_length("password", 256, "Mật khẩu")

            if record.email and not EMAIL_PATTERN.match(record.email):
                raise ValidationError("Email không đúng định dạng.")
            if record.facebook and not FACEBOOK_PATTERN.match(record.facebook):
                raise ValidationError("Đường dẫn Facebook không đúng định dạng.")
            if record.password:
                if len(record.password) < 8:
                    raise ValidationError("Mật khẩu phải có tối thiểu 8 ký tự.")
                if not PASSWORD_PATTERN.match(record.password):
                    raise ValidationError(
                        "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt."
                    )

    @api.constrains("attachment", "attachment_filename")
    def _check_attachment(self):
        """Mô tả: Kiểm tra định dạng và dung lượng ảnh thẻ.
        Input: self - recordset sinh viên có attachment.
        Output: Không trả dữ liệu khi tệp hợp lệ hoặc không có tệp.
        Ràng buộc: Chỉ jpg/jpeg/png, base64 hợp lệ và tối đa 5 MB.
        Ngoại lệ: ValidationError khi sai phần mở rộng, base64 hoặc dung lượng.
        """
        for record in self:
            if not record.attachment:
                continue
            if record.attachment_filename:
                extension = record.attachment_filename.rsplit(".", 1)[-1].lower()
                if extension not in ALLOWED_ATTACHMENT_EXTENSIONS:
                    raise ValidationError("Ảnh thẻ chỉ chấp nhận tệp jpg, jpeg hoặc png.")
            try:
                attachment_size = len(base64.b64decode(record.attachment))
            except Exception as exc:
                raise ValidationError("Ảnh thẻ không đúng định dạng base64.") from exc
            if attachment_size > MAX_ATTACHMENT_SIZE:
                raise ValidationError("Ảnh thẻ không được vượt quá 5MB.")

    def _check_length(self, field_name, max_length, label):
        """Mô tả: Kiểm tra độ dài một trường văn bản của sinh viên.
        Input: tên trường, độ dài tối đa và nhãn hiển thị.
        Output: Không trả dữ liệu khi giá trị nằm trong giới hạn.
        Ràng buộc: field_name phải truy cập được trên record hiện tại.
        Ngoại lệ: ValidationError khi giá trị dài hơn max_length.
        """
        value = self[field_name]
        if value and len(value) > max_length:
            raise ValidationError("%s không được vượt quá %s ký tự." % (label, max_length))

    @api.constrains("hobbies")
    def _check_hobbies_bitmask(self):
        """Mô tả: Kiểm tra miền giá trị bitmask sở thích.
        Input: self - recordset sinh viên cần kiểm tra.
        Output: Không trả dữ liệu khi bitmask hợp lệ.
        Ràng buộc: hobbies phải nằm từ 0 đến UINT32_MAX.
        Ngoại lệ: ValidationError khi bitmask nằm ngoài miền.
        """
        for record in self:
            if record.hobbies < 0 or record.hobbies > UINT32_MAX:
                raise ValidationError("Sở thích dạng bitmask phải nằm trong khoảng từ 0 đến %s." % UINT32_MAX)
