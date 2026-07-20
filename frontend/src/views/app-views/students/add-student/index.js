import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, message, Popover, Select } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useHistory, useParams } from 'react-router-dom';
import { ChromePicker } from 'react-color';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import StudentService from 'services/StudentService';
import { unwrapRecords } from 'services/OdooApiService';
import { getHobbyMask, normalizeHobbyOptions } from 'constants/HobbyOptions';
import confirmDiscardChanges from 'utils/confirmDiscardChanges';
import { getNextCopyEmail, getNextCopyValue } from 'utils/copyFieldValue';
import {
  getFieldError,
  getPasswordChecks,
  getPhotoError,
  VALIDATED_FIELDS,
} from './validationRules';

import './addStudent.css';

const { TextArea } = Input;
const { Option } = Select;


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

const DEFAULT_HAIR_COLOR = { value: 'black', label: 'Đen', color: '#111111' };

const HAIR_COLOR_OPTIONS = [
  DEFAULT_HAIR_COLOR,
  { value: 'dark-brown', label: 'Nâu đen', color: '#3b2a23' },
  { value: 'brown', label: 'Nâu', color: '#7a4a24' },
  { value: 'chestnut', label: 'Hạt dẻ', color: '#8b5a2b' },
  { value: 'yellow', label: 'Vàng', color: '#f2c94c' },
  { value: 'red', label: 'Đỏ', color: '#d93025' },
  { value: 'gray', label: 'Xám', color: '#8c8c8c' },
  { value: 'white', label: 'Trắng', color: '#f5f5f5' },
];

const SERVER_FIELD_MAP = {
  code: 'code',
  fullname: 'fullname',
  dob: 'dob',
  class_id: 'classId',
  classId: 'classId',
  email: 'email',
  facebook: 'facebook',
  username: 'username',
  password: 'password',
  homecity: 'hometown',
  address: 'address',
  hair_color: 'hairColor',
};

const mapServerErrors = serverErrors => {
  if (!serverErrors || typeof serverErrors !== 'object') {
    return {};
  }

  return Object.keys(serverErrors).reduce((mapped, field) => {
    const localField = SERVER_FIELD_MAP[field] || field;
    mapped[localField] = serverErrors[field];
    return mapped;
  }, {});
};

const getErrorSummary = fieldErrors => Object.values(fieldErrors)
  .filter(Boolean)
  .join(' | ');
const StudentForm = ({ mode = 'add' }) => {
  const history = useHistory();
  const { id } = useParams();
  const isEditing = mode === 'edit';
  const isCopying = mode === 'copy';
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [hairColor, setHairColor] = useState(DEFAULT_HAIR_COLOR);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [showHairPicker, setShowHairPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [hobbyOptions, setHobbyOptions] = useState([]);
  const [hobbyLoading, setHobbyLoading] = useState(false);
  const [existingStudents, setExistingStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const currentHairColor = hairColor?.color || '#111111';
  const passwordChecks = getPasswordChecks(formData.password);

  const loadClasses = async () => {
    setClassLoading(true);
    try {
      const response = await ClassroomService.getAll({
        columnlist: JSON.stringify(['id', 'code', 'name']),
      });
      setClasses(
        unwrapRecords(response)
          .map(item => ({ ...item, id: Number(item.id) }))
          .filter(item => Number.isInteger(item.id) && item.id > 0)
      );
    } catch (error) {
      message.error(error.message || 'Không tải được danh sách lớp học');
    } finally {
      setClassLoading(false);
    }
  };

  const loadHobbies = async () => {
    setHobbyLoading(true);
    try {
      const response = await StudentService.getHobbies();
      setHobbyOptions(normalizeHobbyOptions(unwrapRecords(response)));
    } catch (error) {
      message.error(error.message || 'Không tải được danh sách sở thích');
    } finally {
      setHobbyLoading(false);
    }
  };

  const loadExistingStudents = async () => {
    try {
      const response = await StudentService.getAll({
        columnlist: JSON.stringify(['id', 'code', 'email', 'username']),
      });
      setExistingStudents(
        unwrapRecords(response).filter(item => !isEditing || Number(item.id) !== Number(id))
      );
    } catch (error) {
      message.error(error.message || 'Không tải được dữ liệu kiểm tra trùng học sinh');
    }
  };

  useEffect(() => {
    loadClasses();
    loadHobbies();
    loadExistingStudents();
    if (isEditing || isCopying) {
      Promise.all([
        StudentService.getById(id, {
          columnlist: JSON.stringify([
            'id', 'code', 'fullname', 'dob', 'sex', 'class_id', 'email', 'facebook',
            'username', 'password', 'homecity', 'address', 'hobbies', 'hair_color',
            'description', 'attachment',
          ]),
        }),
        StudentService.getHobbies().catch(() => null),
        StudentService.getAll({
          columnlist: JSON.stringify(['id', 'code', 'email', 'username']),
        }),
      ]).then(([studentResponse, hobbyResponse, existingResponse]) => {
        const student = studentResponse?.data || {};
        const options = hobbyResponse ? normalizeHobbyOptions(unwrapRecords(hobbyResponse)) : [];
        const copyRecords = unwrapRecords(existingResponse);
        const classValue = Array.isArray(student.class_id)
          ? student.class_id[0]
          : (student.class_id?.id || student.class_id || '');
        const color = student.hair_color || DEFAULT_HAIR_COLOR.color;
        const matchingColor = HAIR_COLOR_OPTIONS.find(item => item.color.toLowerCase() === String(color).toLowerCase());

        setFormData({
          code: isCopying
            ? getNextCopyValue(student.code || '', copyRecords.map(item => item.code), 50)
            : (student.code || ''),
          fullname: student.fullname || '',
          dob: student.dob || '',
          gender: student.sex ? 'male' : 'female',
          classId: Number(classValue) || '',
          email: isCopying
            ? getNextCopyEmail(student.email || '', copyRecords.map(item => item.email), 256)
            : (student.email || ''),
          facebook: student.facebook || '',
          username: isCopying
            ? getNextCopyValue(student.username || '', copyRecords.map(item => item.username), 50)
            : (student.username || ''),
          password: student.password || '',
          hometown: student.homecity || '',
          address: student.address || '',
          hobbies: options.filter(item => Math.floor(Number(student.hobbies || 0) / item.mask) % 2 === 1).map(item => item.code),
          description: student.description || '',
        });
        setHairColor(matchingColor || { value: 'custom', label: 'Tùy chọn', color });
        setPhotoPreview(student.attachment ? `data:image/png;base64,${student.attachment}` : '');
        setPhotoBase64(isCopying ? (student.attachment || '') : '');
        setPhotoFileName(isCopying && student.attachment ? 'student-copy.png' : '');
      }).catch(error => message.error(error.message || 'Không tải được thông tin học sinh'));
    }
  }, []);

  useEffect(() => {
    if (!existingStudents.length) {
      return;
    }

    setErrors(prevErrors => {
      const nextErrors = { ...prevErrors };
      ['code', 'email', 'username'].forEach(field => {
        if (formData[field]) {
          nextErrors[field] = getFieldError(field, formData, hairColor, existingStudents);
        }
      });
      return nextErrors;
    });
  }, [existingStudents, formData, hairColor]);
  const updateField = (field, value) => {
    setFormData(prev => {
      const nextData = { ...prev, [field]: value };
      setErrors(prevErrors => ({
        ...prevErrors,
        [field]: getFieldError(field, nextData, hairColor, existingStudents),
      }));
      return nextData;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    VALIDATED_FIELDS.forEach(field => {
      const fieldError = getFieldError(field, formData, hairColor, existingStudents);
      if (fieldError) {
        nextErrors[field] = fieldError;
      }
    });

    setErrors(nextErrors);
    return nextErrors;
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setHairColor(DEFAULT_HAIR_COLOR);
    setPhotoPreview('');
    setPhotoBase64('');
    setPhotoFileName('');
    setPhotoRemoved(false);
  };

  const buildPayload = selectedClass => {
    const payload = {
      code: formData.code.trim(),
      fullname: formData.fullname.trim(),
      dob: formData.dob,
      sex: formData.gender === 'male',
      class_id: selectedClass?.code || Number(formData.classId),
      email: formData.email.trim(),
      facebook: formData.facebook.trim(),
      username: formData.username.trim(),
      password: formData.password,
      homecity: formData.hometown.trim(),
      address: formData.address.trim(),
      hobbies: getHobbyMask(formData.hobbies, hobbyOptions),
      hair_color: hairColor?.color || DEFAULT_HAIR_COLOR.color,
      description: formData.description.trim(),
    };

    if (photoBase64) {
      payload.attachment = photoBase64;
      payload.attachment_filename = photoFileName;
    } else if (isEditing && photoRemoved) {
      payload.attachment = false;
      payload.attachment_filename = false;
    }

    return payload;
  };

  const submitForm = async ({ stayOnPage = false } = {}) => {
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length) {
      message.error(getErrorSummary(clientErrors) || (isCopying ? 'Sao chép học sinh thất bại' : 'Thêm mới học sinh thất bại'));
      return;
    }

    const selectedClass = classes.find(item => item.id === Number(formData.classId));
    if (!selectedClass) {
      const errorMessage = 'Lớp học không tồn tại. Vui lòng tải lại danh sách lớp và chọn lại.';
      setErrors(prev => ({ ...prev, classId: errorMessage }));
      message.error(errorMessage);
      return;
    }
    setSubmitting(true);
    try {
      const response = isEditing
        ? await StudentService.update(id, buildPayload(selectedClass))
        : await StudentService.create(buildPayload(selectedClass));
      message.success(response.message || (isEditing
        ? 'Cập nhật học sinh thành công'
        : (isCopying ? 'Sao chép học sinh thành công' : 'Thêm mới thành công')));

      if (isCopying) {
        history.push(`${APP_PREFIX_PATH}/students`);
        return;
      }

      if (isEditing) {
        history.push(`${APP_PREFIX_PATH}/students`);
        return;
      }

      setExistingStudents(prev => ([
        ...prev,
        {
          code: formData.code.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
        },
      ]));

      if (stayOnPage) {
        resetForm();
        return;
      }

      history.push(`${APP_PREFIX_PATH}/students`);
    } catch (error) {
      const errorMessage = error.message || (isEditing
        ? 'Cập nhật học sinh thất bại'
        : (isCopying ? 'Sao chép học sinh thất bại' : 'Thêm mới học sinh thất bại'));
      const lowerMessage = errorMessage.toLowerCase();

      const serverErrors = mapServerErrors(error.payload?.data?.errors || error.payload?.errors);
      if (Object.keys(serverErrors).length) {
        setErrors(prev => ({ ...prev, ...serverErrors }));
        message.error(getErrorSummary(serverErrors) || errorMessage);
      } else {
        const nextErrors = {};
        if (lowerMessage.includes('mã học sinh')) {
          nextErrors.code = errorMessage;
        } else if (lowerMessage.includes('email')) {
          nextErrors.email = errorMessage;
        } else if (lowerMessage.includes('tài khoản')) {
          nextErrors.username = errorMessage;
        } else if (lowerMessage.includes('lớp')) {
          nextErrors.classId = errorMessage;
        }

        if (Object.keys(nextErrors).length) {
          setErrors(prev => ({ ...prev, ...nextErrors }));
        }
        message.error(errorMessage);
      }
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
    const photoError = getPhotoError(file);
    if (photoError) {
      message.error(photoError);
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setPhotoFileName(file.name);
    setPhotoRemoved(false);

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setPhotoBase64(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setPhotoBase64('');
    setPhotoFileName('');
    setPhotoRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBack = () => {
    const goToStudents = () => history.push(`${APP_PREFIX_PATH}/students`);
    if (isEditing || isCopying) {
      confirmDiscardChanges({
        onOk: goToStudents,
        ...(isCopying ? {
          title: 'Hủy sao chép?',
          content: 'Thông tin bản sao chưa lưu sẽ bị mất. Bạn có muốn hủy sao chép không?',
          okText: 'Hủy sao chép',
        } : {}),
      });
      return;
    }
    goToStudents();
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
    <div className={`add-student-page ${isEditing ? 'is-editing' : ''} ${isCopying ? 'is-copying' : ''}`}>
      <button
        type="button"
        className="add-student-back-btn app-back-arrow-btn"
        onClick={handleBack}
        aria-label="Quay lại"
      >
        <ArrowLeftOutlined />
      </button>
      <h1 className="add-student-title">
        {isEditing ? 'Cập nhật học sinh' : (isCopying ? 'Sao chép thành công học sinh' : 'Thêm học sinh mới')}
      </h1>
      {isCopying && <p className="add-student-subtitle">Có thể hiệu chỉnh thông tin học sinh trước khi lưu</p>}
      <div className="add-student-frame">
        <div className="add-student-top">
          <div className="add-student-photo">
            <div
              className="add-student-photo-box"
              style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}
            />
            {photoPreview && (
              <button type="button" className="add-student-remove-photo" onClick={removePhoto} aria-label="Xóa ảnh">
                <DeleteOutlined />
              </button>
            )}

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
                  onChange={value => updateField('classId', Number(value))}
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
              <span>
                Email<em className="req-star"> *</em>
              </span>
              <Input
                value={formData.email}
                placeholder="Email học sinh *"
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
              <span>
                Tài khoản<em className="req-star"> *</em>
              </span>
              <Input
                value={formData.username}
                placeholder="Tài khoản *"
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
                loading={hobbyLoading}
                onChange={value => updateField('hobbies', value)}
              >
                {hobbyOptions.map(item => (
                  <Option key={item.code} value={item.code}>
                    {item.label}
                  </Option>
                ))}
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
              {isEditing ? 'Lưu thay đổi' : 'Lưu'}
            </Button>

            {!isEditing && !isCopying && <Button
              className="add-student-save-continue-btn"
              loading={submitting}
              onClick={() => submitForm({ stayOnPage: true })}
            >
              Lưu và tiếp tục
            </Button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
