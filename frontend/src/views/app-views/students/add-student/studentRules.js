const EMAIL_PATTERN = /^[0-9a-zA-Z.\-_]+@[0-9a-zA-Z.\-_]+$/;
const FACEBOOK_PATTERN = /^https?:\/\/[0-9a-zA-Z.\-_]+$/;
const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export const STUDENT_RULE = {
  rules: {
    code: {
      required: true,
      maxLength: 50,
      uniqueField: 'code',
    },
    fullname: {
      required: true,
      maxLength: 30,
    },
    dob: {
      required: true,
      beforeNow: true,
    },
    classId: {
      required: true,
    },
    email: {
      required: true,
      maxLength: 256,
      pattern: EMAIL_PATTERN,
      uniqueField: 'email',
    },
    facebook: {
      maxLength: 256,
      pattern: FACEBOOK_PATTERN,
    },
    username: {
      required: true,
      maxLength: 50,
      uniqueField: 'username',
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 256,
      pattern: PASSWORD_PATTERN,
    },
    hometown: {
      maxLength: 100,
    },
    address: {
      maxLength: 100,
    },
    hairColor: {
      pattern: HEX_COLOR_PATTERN,
    },
    photo: {
      allowedTypes: ['jpg', 'jpeg', 'png'],
      maxSize: 5 * 1024 * 1024,
    },
  },
  message: {
    code: {
      required: 'Mã học sinh là bắt buộc',
      maxLength: 'Mã học sinh tối đa 50 ký tự',
      unique: 'Mã học sinh đã tồn tại',
    },
    fullname: {
      required: 'Họ và tên học sinh là bắt buộc',
      maxLength: 'Họ và tên học sinh tối đa 30 ký tự',
    },
    dob: {
      required: 'Ngày sinh là bắt buộc',
      beforeNow: 'Ngày sinh phải trước thời điểm hiện tại',
    },
    classId: {
      required: 'Lớp học là bắt buộc',
    },
    email: {
      required: 'Email học sinh là bắt buộc',
      maxLength: 'Email học sinh tối đa 256 ký tự',
      pattern: 'Sai định dạng email',
      unique: 'Địa chỉ email đã tồn tại',
    },
    facebook: {
      maxLength: 'Facebook học sinh tối đa 256 ký tự',
      pattern: 'Facebook học sinh không đúng định dạng',
    },
    username: {
      required: 'Tài khoản học sinh là bắt buộc',
      maxLength: 'Tài khoản tối đa 50 ký tự',
      unique: 'Địa chỉ tài khoản đã tồn tại',
    },
    password: {
      required: 'Mật khẩu là bắt buộc',
      minLength: 'Mật khẩu tối thiểu 8 ký tự',
      maxLength: 'Mật khẩu tối đa 256 ký tự',
      pattern: 'Mật khẩu không đúng định dạng',
    },
    hometown: {
      maxLength: 'Địa chỉ không vượt quá 100 ký tự',
    },
    address: {
      maxLength: 'Địa chỉ không vượt quá 100 ký tự',
    },
    hairColor: {
      pattern: 'Mã màu không hợp lệ',
    },
    photo: {
      allowedTypes: 'Không đúng định dạng ảnh jpg, jpeg, png',
      maxSize: 'File ảnh không được lớn hơn 5MB',
    },
  },
};
