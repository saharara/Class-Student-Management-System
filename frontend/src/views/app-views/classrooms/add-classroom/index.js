import React, { useEffect, useState } from 'react';
import { Button, Input, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import { unwrapRecords } from 'services/OdooApiService';

import './addClassroom.css';

const { TextArea } = Input;


const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
};

const getFieldError = (field, data, existingClassCodes = []) => {
  const value = data[field].trim();

  switch (field) {
    case 'code':
      if (!value) return 'Mã lớp học là bắt buộc';
      if (value.length > 50) return 'Mã lớp học tối đa 50 ký tự';
      if (existingClassCodes.includes(value.toLowerCase())) return 'Mã lớp học đã tồn tại';
      return undefined;
    case 'name':
      if (!value) return 'Tên lớp học là bắt buộc';
      if (value.length > 100) return 'Tên lớp học tối đa 100 ký tự';
      return undefined;
    default:
      return undefined;
  }
};

const VALIDATED_FIELDS = ['code', 'name'];

const mapServerErrors = serverErrors => {
  if (!serverErrors || typeof serverErrors !== 'object') {
    return {};
  }

  return Object.keys(serverErrors).reduce((mapped, field) => {
    mapped[field] = serverErrors[field];
    return mapped;
  }, {});
};

const getErrorSummary = fieldErrors => Object.values(fieldErrors)
  .filter(Boolean)
  .join(' | ');

const AddClassroom = () => {
  const history = useHistory();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [existingClassCodes, setExistingClassCodes] = useState([]);

  const loadExistingClassCodes = async () => {
    try {
      const response = await ClassroomService.getAll({
        columnlist: JSON.stringify(['id', 'code']),
      });
      setExistingClassCodes(
        unwrapRecords(response)
          .map(item => String(item.code || '').trim().toLowerCase())
          .filter(Boolean)
      );
    } catch (error) {
      message.error(error.message || 'Không tải được dữ liệu kiểm tra trùng lớp học');
    }
  };

  useEffect(() => {
    loadExistingClassCodes();
  }, []);
  useEffect(() => {
    if (!existingClassCodes.length || !formData.code) {
      return;
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      code: getFieldError('code', formData, existingClassCodes),
    }));
  }, [existingClassCodes, formData]);
  const updateField = (field, value) => {
    setFormData(prev => {
      const nextData = { ...prev, [field]: value };
      setErrors(prevErrors => ({
        ...prevErrors,
        [field]: getFieldError(field, nextData, existingClassCodes),
      }));
      return nextData;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    VALIDATED_FIELDS.forEach(field => {
      const fieldError = getFieldError(field, formData, existingClassCodes);
      if (fieldError) {
        nextErrors[field] = fieldError;
      }
    });

    setErrors(nextErrors);
    return nextErrors;
  };

  const submitForm = async ({ stayOnPage = false } = {}) => {
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length) {
      message.error(getErrorSummary(clientErrors) || 'Thêm mới lớp học thất bại');
      return;
    }

    try {
      const response = await ClassroomService.create({
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      message.success(response.message || 'Thêm mới lớp học thành công');

      if (stayOnPage) {
        setFormData(EMPTY_FORM);
        setErrors({});
        return;
      }

      history.push(`${APP_PREFIX_PATH}/classrooms`);
    } catch (error) {
      const errorMessage = error.message || 'Thêm mới lớp học thất bại';
      const serverErrors = mapServerErrors(error.payload?.data?.errors || error.payload?.errors);

      if (Object.keys(serverErrors).length) {
        setErrors(prev => ({ ...prev, ...serverErrors }));
        message.error(getErrorSummary(serverErrors) || errorMessage);
        return;
      }

      if (errorMessage.toLowerCase().includes('mã lớp')) {
        setErrors(prev => ({ ...prev, code: errorMessage }));
      }
      message.error(errorMessage);
    }
  };

  return (
    <div className="add-classroom-page">
      <button
        type="button"
        className="add-classroom-back-btn app-back-arrow-btn"
        onClick={() => history.push(`${APP_PREFIX_PATH}/classrooms`)}
        aria-label="Quay lại"
      >
        <ArrowLeftOutlined />
      </button>

      <h1 className="add-classroom-title">Thêm lớp học mới</h1>

      <div className="add-classroom-form">
        <div className="add-classroom-field-row">
          <label className={`add-classroom-field ${errors.code ? 'has-error' : ''}`}>
            <span>
              Mã lớp học<em className="req-star"> *</em>
            </span>
            <Input
              value={formData.code}
              placeholder="Mã lớp học *"
              onChange={event => updateField('code', event.target.value)}
            />
            {errors.code && <div className="add-classroom-error">{errors.code}</div>}
          </label>

          <label className={`add-classroom-field ${errors.name ? 'has-error' : ''}`}>
            <span>
              Tên lớp học<em className="req-star"> *</em>
            </span>
            <Input
              value={formData.name}
              placeholder="Tên lớp học *"
              onChange={event => updateField('name', event.target.value)}
            />
            {errors.name && <div className="add-classroom-error">{errors.name}</div>}
          </label>
        </div>

        <label className="add-classroom-field add-classroom-description">
          <span>Mô tả</span>
          <TextArea
            value={formData.description}
            placeholder="Mô tả lớp học"
            onChange={event => updateField('description', event.target.value)}
            rows={8}
          />
        </label>

        <div className="add-classroom-actions">
          <Button
            type="primary"
            className="add-classroom-save-btn"
            onClick={() => submitForm()}
          >
            Lưu
          </Button>

          <Button
            className="add-classroom-save-continue-btn"
            onClick={() => submitForm({ stayOnPage: true })}
          >
            Lưu và tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddClassroom;
