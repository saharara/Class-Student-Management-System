import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, message, Popover, Select } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { ChromePicker } from 'react-color';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import StudentService from 'services/StudentService';
import { unwrapRecords } from 'services/OdooApiService';

import './addStudent.css';

const { TextArea } = Input;
const { Option } = Select;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png'];
const EMAIL_PATTERN = /^[0-9a-zA-Z.\-_]+@[0-9a-zA-Z.\-_]+$/;
const FACEBOOK_PATTERN = /^https?:\/\/[0-9a-zA-Z.\-_]+$/;
const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const EXISTING_STUDENTS = [];

const EMPTY_FORM = {
  code: '',
  fullname: '',
  dob: '2000-02-04',
  gender: 'female',
  classId: '',
  email: '',
  facebook: '',
  username: '',
  password: '',
  hometown: '',
  address: '',
  hobbies: [],
  description: '',
};

const HOBBY_BITS = {
  sport: 1,
  book: 2,
  music: 4,
  paint: 8,
  travel: 16,
  code: 32,
};

const HAIR_COLOR_OPTIONS = [
  { value: 'black', label: 'Đen', color: '#111111' },
  { value: 'dark-brown', label: 'Nâu đen', color: '#3b2a23' },
  { value: 'brown', label: 'Nâu', color: '#7a4a24' },
  { value: 'chestnut', label: 'Hạt dẻ', color: '#8b5a2b' },
  { value: 'yellow', label: 'Vàng', color: '#f2c94c' },
  { value: 'red', label: 'Đỏ', color: '#d93025' },
  { value: 'gray', label: 'Xám', color: '#8c8c8c' },
  { value: 'white', label: 'Trắng', color: '#f5f5f5' },
];

const hasDuplicate = (field, value) => {
  const normalizedValue = value.trim().toLowerCase();
  return EXISTING_STUDENTS.some(
    student => student[field].toLowerCase() === normalizedValue
  );
};

const getPasswordChecks = password => [
  { key: 'length', label: 'Tối thiểu 8 ký tự', passed: password.length >= 8 },
  { key: 'upper', label: 'Có chữ hoa', passed: /[A-Z]/.test(password) },
  { key: 'lower', label: 'Có chữ thường', passed: /[a-z]/.test(password) },
  { key: 'number', label: 'Có số', passed: /[0-9]/.test(password) },
  { key: 'special', label: 'Có ký tự đặc biệt', passed: /[^A-Za-z0-9\s]/.test(password) },
];

const getFieldError = (field, data, color) => {
  const value = typeof data[field] === 'string' ? data[field].trim() : data[field];

  switch (field) {
    case 'code':
      if (!value) return 'Mã học sinh là bắt buộc';
      if (value.length > 50) return 'Mã học sinh tối đa 50 ký tự';
      if (hasDuplicate('code', value)) return 'Mã học sinh đã tồn tại';
      return undefined;
    case 'fullname':
      if (!value) return 'Họ và tên học sinh là bắt buộc';
      if (value.length > 30) return 'Họ và tên học sinh tối đa 30 ký tự';
      return undefined;
    case 'dob':
      if (!value) return 'Ngày sinh là bắt buộc';
      if (new Date(value) >= new Date()) return 'Ngày sinh phải trước thời điểm hiện tại';
      return undefined;
    case 'classId':
      if (!value) return 'Lớp học là bắt buộc';
      return undefined;
    case 'email':
      if (!value) return 'Email học sinh là bắt buộc';
      if (value.length > 256) return 'Email học sinh tối đa 256 ký tự';
      if (!EMAIL_PATTERN.test(value)) return 'Sai định dạng email';
      if (hasDuplicate('email', value)) return 'Địa chỉ email đã tồn tại';
      return undefined;
    case 'facebook':
      if (value.length > 256) return 'Facebook học sinh tối đa 256 ký tự';
      if (value && !FACEBOOK_PATTERN.test(value)) return 'Facebook học sinh không đúng định dạng';
      return undefined;
    case 'username':
      if (!value) return 'Tài khoản học sinh là bắt buộc';
      if (value.length > 50) return 'Tài khoản tối đa 50 ký tự';
      if (hasDuplicate('username', value)) return 'Địa chỉ tài khoản đã tồn tại';
      return undefined;
    case 'password':
      if (!data.password) return 'Mật khẩu là bắt buộc';
      if (data.password.length < 8) return 'Mật khẩu tối thiểu 8 ký tự';
      if (data.password.length > 256) return 'Mật khẩu tối đa 256 ký tự';
      if (!PASSWORD_PATTERN.test(data.password)) return 'Mật khẩu không đúng định dạng';
      return undefined;
    case 'hometown':
      if (value.length > 100) return 'Địa chỉ không vượt quá 100 ký tự';
      return undefined;
    case 'address':
      if (value.length > 100) return 'Địa chỉ không vượt quá 100 ký tự';
      return undefined;
    case 'hairColor':
      if (color?.color && !HEX_COLOR_PATTERN.test(color.color)) return 'Mã màu không hợp lệ';
      return undefined;
    default:
      return undefined;
  }
};

const VALIDATED_FIELDS = [
  'code',
  'fullname',
  'dob',
  'classId',
  'email',
  'facebook',
  'username',
  'password',
  'hometown',
  'address',
  'hairColor',
];

const AddStudent = () => {
  const history = useHistory();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [hairColor, setHairColor] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [showHairPicker, setShowHairPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentHairColor = hairColor?.color || '#111111';
  const passwordChecks = getPasswordChecks(formData.password);

  const loadClasses = async () => {
    setClassLoading(true);
    try {
      const response = await ClassroomService.getAll({
        columnlist: JSON.stringify(['id', 'code', 'name']),
      });
      setClasses(unwrapRecords(response));
    } catch (error) {
      message.error(error.message || 'Không tải được danh sách lớp học');
    } finally {
      setClassLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => {
      const nextData = { ...prev, [field]: value };
      setErrors(prevErrors => ({
        ...prevErrors,
        [field]: getFieldError(field, nextData, hairColor),
      }));
      return nextData;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    VALIDATED_FIELDS.forEach(field => {
      const fieldError = getFieldError(field, formData, hairColor);
      if (fieldError) {
        nextErrors[field] = fieldError;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setHairColor(null);
    setPhotoPreview('');
    setPhotoBase64('');
    setPhotoFileName('');
  };

  const buildPayload = () => {
    const payload = {
      code: formData.code.trim(),
      fullname: formData.fullname.trim(),
      dob: formData.dob,
      sex: formData.gender === 'male',
      class_id: formData.classId,
      email: formData.email.trim(),
      facebook: formData.facebook.trim(),
      username: formData.username.trim(),
      password: formData.password,
      homecity: formData.hometown.trim(),
      address: formData.address.trim(),
      hobbies: formData.hobbies.reduce((total, hobby) => total + (HOBBY_BITS[hobby] || 0), 0),
      hair_color: hairColor?.color || '',
      description: formData.description.trim(),
    };

    if (photoBase64) {
      payload.attachment = photoBase64;
      payload.attachment_filename = photoFileName;
    }

    return payload;
  };

  const submitForm = async ({ stayOnPage = false } = {}) => {
    if (!validateForm()) {
      message.error('Thêm mới học sinh thất bại');
      return;
    }

    setSubmitting(true);
    try {
      const response = await StudentService.create(buildPayload());
      message.success(response.message || 'Thêm mới thành công');

      if (stayOnPage) {
        resetForm();
        return;
      }

      history.push(`${APP_PREFIX_PATH}/students`);
    } catch (error) {
      const errorMessage = error.message || 'Thêm mới học sinh thất bại';
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes('mã học sinh')) {
        setErrors(prev => ({ ...prev, code: errorMessage }));
      } else if (lowerMessage.includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (lowerMessage.includes('tài khoản')) {
        setErrors(prev => ({ ...prev, username: errorMessage }));
      } else if (lowerMessage.includes('lớp')) {
        setErrors(prev => ({ ...prev, classId: errorMessage }));
      }

      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = event => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(extension)) {
      message.error('Không đúng định dạng ảnh jpg, jpeg, png');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      message.error('File ảnh không được lớn hơn 5MB');
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setPhotoBase64(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(file);
  };

  const hairColorPicker = (
    <div className="add-student-color-popover-content">
      <ChromePicker
        color={currentHairColor}
        disableAlpha
        onChange={(color) => {
          setHairColor({
            value: 'custom',
            label: 'Tùy chọn',
            color: color.hex,
          });
          setErrors(prev => ({ ...prev, hairColor: undefined }));
        }}
        styles={{
          default: {
            picker: {
              width: 260,
              boxShadow: 'none',
              fontFamily: 'Arial, Roboto, Segoe UI, Tahoma, sans-serif',
            },
          },
        }}
      />

      <div className="hair-color-suggestion-title">Màu quen thuộc</div>

      <div className="hair-color-suggestions">
        {HAIR_COLOR_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            className="hair-color-suggestion"
            onClick={() => {
              setHairColor(item);
              setErrors(prev => ({ ...prev, hairColor: undefined }));
              setShowHairPicker(false);
            }}
          >
            <span
              className="hair-color-dot"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="add-student-page">
      <button
        type="button"
        className="add-student-back-btn"
        onClick={() => history.push(`${APP_PREFIX_PATH}/students`)}
        aria-label="Quay lại"
      >
        <ArrowLeftOutlined />
      </button>
      <h1 className="add-student-title">Thêm học sinh mới</h1>
      <div className="add-student-frame">
        <div className="add-student-top">
          <div className="add-student-photo">
            <div
              className="add-student-photo-box"
              style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}
            />

            <input
              ref={fileInputRef}
              className="add-student-file-input"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleImageChange}
            />

            <Button
              className="add-student-upload-btn"
              type="primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>

            <div className="add-student-photo-label">Ảnh</div>
          </div>

          <div className="add-student-top-fields">
            <label className={`add-student-field code-field ${errors.code ? 'has-error' : ''}`}>
              <span>
                Mã học sinh <em className="req-star">*</em>
              </span>
              <Input
                value={formData.code}
                placeholder="Mã học sinh*"
                onChange={event => updateField('code', event.target.value)}
              />
              {errors.code && <div className="add-student-error">{errors.code}</div>}
            </label>

            <label className={`add-student-field name-field ${errors.fullname ? 'has-error' : ''}`}>
              <span>
                Họ và tên <em className="req-star">*</em>
              </span>
              <Input
                value={formData.fullname}
                placeholder="Họ và tên học sinh*"
                onChange={event => updateField('fullname', event.target.value)}
              />
              {errors.fullname && <div className="add-student-error">{errors.fullname}</div>}
            </label>

            <label className={`add-student-field birthday-field ${errors.dob ? 'has-error' : ''}`}>
              <span>
                Ngày sinh <em className="req-star">*</em>
              </span>
              <Input
                type="date"
                value={formData.dob}
                max={new Date().toISOString().slice(0, 10)}
                placeholder="yyyy - mm - dd*"
                onChange={event => updateField('dob', event.target.value)}
              />
              {errors.dob && <div className="add-student-error">{errors.dob}</div>}
            </label>

            <div className="add-student-gender">
              <span>
                Giới tính <em className="req-star">*</em>
              </span>

              <div className="add-student-gender-box">
                <label>
                  <input
                    type="radio"
                    name="add-student-gender"
                    checked={formData.gender === 'male'}
                    onChange={() => updateField('gender', 'male')}
                  />
                  Nam
                </label>

                <label>
                  <input
                    type="radio"
                    name="add-student-gender"
                    checked={formData.gender === 'female'}
                    onChange={() => updateField('gender', 'female')}
                  />
                  Nữ
                </label>
              </div>
            </div>

            <div className="add-student-class-row">
              <div className={`add-student-class-field ${errors.classId ? 'has-error' : ''}`}>
                <span>
                  Lớp học <em className="req-star">*</em>
                </span>

                <Select
                  className="add-student-select"
                  placeholder="Lớp học*"
                  value={formData.classId || undefined}
                  loading={classLoading}
                  onChange={value => updateField('classId', value)}
                >
                  {classes.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.code ? item.code + ' - ' + item.name : item.name}
                    </Option>
                  ))}
                </Select>
                {errors.classId && <div className="add-student-error">{errors.classId}</div>}
              </div>

              <Button
                className="add-student-plus-btn"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => history.push(`${APP_PREFIX_PATH}/classrooms/add`)}
              />
            </div>

            <label className={`add-student-field email-field ${errors.email ? 'has-error' : ''}`}>
              <span>Email</span>
              <Input
                value={formData.email}
                placeholder="Email học sinh"
                onChange={event => updateField('email', event.target.value)}
              />
              {errors.email && <div className="add-student-error">{errors.email}</div>}
            </label>

            <label className={`add-student-field facebook-field ${errors.facebook ? 'has-error' : ''}`}>
              <span>Facebook</span>
              <Input
                value={formData.facebook}
                placeholder="Link Facebook học sinh"
                onChange={event => updateField('facebook', event.target.value)}
              />
              {errors.facebook && <div className="add-student-error">{errors.facebook}</div>}
            </label>

            <label className={`add-student-field account-field ${errors.username ? 'has-error' : ''}`}>
              <span>Tài khoản</span>
              <Input
                value={formData.username}
                placeholder="Tài khoản"
                onChange={event => updateField('username', event.target.value)}
              />
              {errors.username && <div className="add-student-error">{errors.username}</div>}
            </label>

            <label className={`add-student-field password-field ${errors.password ? 'has-error' : ''}`}>
              <span>
                Mật khẩu <em className="req-star">*</em>
              </span>

              <div className="add-student-password-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="add-student-password-input"
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={event => updateField('password', event.target.value)}
                />

                <button
                  type="button"
                  className="add-student-password-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Ẩn hiện mật khẩu"
                >
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
              {errors.password && <div className="add-student-error">{errors.password}</div>}
              {formData.password && (
                <div className="add-student-password-checks">
                  {passwordChecks.map(item => (
                    <span key={item.key} className={item.passed ? 'passed' : ''}>
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="add-student-wide-fields">
          <label className={`add-student-field full ${errors.hometown ? 'has-error' : ''}`}>
            <span>Quê quán</span>
            <Input
              value={formData.hometown}
              placeholder="Quê quán"
              onChange={event => updateField('hometown', event.target.value)}
            />
            {errors.hometown && <div className="add-student-error">{errors.hometown}</div>}
          </label>

          <label className={`add-student-field full ${errors.address ? 'has-error' : ''}`}>
            <span>Địa chỉ</span>
            <Input
              value={formData.address}
              placeholder="Địa chỉ"
              onChange={event => updateField('address', event.target.value)}
            />
            {errors.address && <div className="add-student-error">{errors.address}</div>}
          </label>

          <div className="add-student-lower-grid">
            <label className="add-student-field hobby-field">
              <span>Sở thích</span>

              <Select
                className="add-student-select"
                placeholder="Sở thích"
                mode="multiple"
                value={formData.hobbies}
                onChange={value => updateField('hobbies', value)}
              >
                <Option value="sport">Chơi thể thao</Option>
                <Option value="book">Đọc sách</Option>
                <Option value="music">Âm nhạc</Option>
                <Option value="paint">Vẽ tranh</Option>
                <Option value="travel">Du lịch</Option>
                <Option value="code">Lập trình</Option>
              </Select>
            </label>

            <div className={`add-student-field hair-field ${errors.hairColor ? 'has-error' : ''}`}>
              <span>Màu tóc</span>

              <Popover
                overlayClassName="add-student-color-popover"
                content={hairColorPicker}
                trigger="click"
                visible={showHairPicker}
                onVisibleChange={setShowHairPicker}
                placement="bottomLeft"
              >
                <button
                  type="button"
                  className="add-student-color-picker-trigger"
                >
                  {hairColor ? (
                    <span className="hair-color-option">
                      <span
                        className="hair-color-dot"
                        style={{ backgroundColor: hairColor.color }}
                      />
                      <span>{hairColor.label}</span>
                      <span className="hair-color-hex">
                        {hairColor.color}
                      </span>
                    </span>
                  ) : (
                    <span className="add-student-color-placeholder">
                      Màu tóc
                    </span>
                  )}
                </button>
              </Popover>
              {errors.hairColor && <div className="add-student-error">{errors.hairColor}</div>}
            </div>
          </div>

          <label className="add-student-field full add-student-description">
            <span>Mô tả</span>
            <TextArea
              value={formData.description}
              placeholder="Mô tả học sinh"
              rows={4}
              onChange={event => updateField('description', event.target.value)}
            />
          </label>

          <div className="add-student-actions">
            <Button
              type="primary"
              className="add-student-save-btn"
              loading={submitting}
              onClick={() => submitForm()}
            >
              Lưu
            </Button>

            <Button
              className="add-student-save-continue-btn"
              loading={submitting}
              onClick={() => submitForm({ stayOnPage: true })}
            >
              Lưu và tiếp tục
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
