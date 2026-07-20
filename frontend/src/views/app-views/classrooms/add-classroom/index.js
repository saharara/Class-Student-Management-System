import React, { useEffect, useState } from 'react';
import { Button, Input, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useHistory, useParams } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import { unwrapRecords } from 'services/OdooApiService';
import confirmDiscardChanges from 'utils/confirmDiscardChanges';
import { getNextCopyValue } from 'utils/copyFieldValue';

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

const ClassroomForm = ({ mode = 'add' }) => {
  const history = useHistory();
  const { id } = useParams();
  const isEditing = mode === 'edit';
  const isCopying = mode === 'copy';
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [existingClassCodes, setExistingClassCodes] = useState([]);
  const [sourceCode, setSourceCode] = useState('');

  const loadExistingClassCodes = async () => {
    try {
      const response = await ClassroomService.getAll({
        columnlist: JSON.stringify(['id', 'code']),
      });
      setExistingClassCodes(
        unwrapRecords(response)
          .filter(item => !isEditing || Number(item.id) !== Number(id))
          .map(item => String(item.code || '').trim().toLowerCase())
          .filter(Boolean)
      );
    } catch (error) {
      message.error(error.message || 'Không tải được dữ liệu kiểm tra trùng lớp học');
    }
  };

  useEffect(() => {
    loadExistingClassCodes();
    if (isEditing || isCopying) {
      ClassroomService.getById(id, {
        columnlist: JSON.stringify(['id', 'code', 'name', 'description']),
      }).then(response => {
        const classroom = response?.data || {};
        setSourceCode(classroom.code || '');
        setFormData({
          code: classroom.code || '',
          name: classroom.name || '',
          description: classroom.description || '',
        });
      }).catch(error => message.error(error.message || 'Không tải được thông tin lớp học'));
    }
  }, []);
  useEffect(() => {
    if (isCopying && sourceCode && existingClassCodes.length) {
      setFormData(prev => ({
        ...prev,
        code: getNextCopyValue(sourceCode, existingClassCodes, 50),
      }));
    }
  }, [existingClassCodes, isCopying, sourceCode]);
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

  const handleBack = () => {
    const goToClassrooms = () => history.push(`${APP_PREFIX_PATH}/classrooms`);
    if (isEditing || isCopying) {
      confirmDiscardChanges({
        onOk: goToClassrooms,
        ...(isCopying ? {
          title: 'Hủy sao chép?',
          content: 'Thông tin bản sao chưa lưu sẽ bị mất. Bạn có muốn hủy sao chép không?',
          okText: 'Hủy sao chép',
        } : {}),
      });
      return;
    }
    goToClassrooms();
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
      message.error(getErrorSummary(clientErrors) || (isCopying ? 'Sao chép lớp học thất bại' : 'Thêm mới lớp học thất bại'));
      return;
    }

    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
      };
      const response = isEditing
        ? await ClassroomService.update(id, payload)
        : await ClassroomService.create(payload);

      message.success(response.message || (isEditing
        ? 'Cập nhật lớp học thành công'
        : (isCopying ? 'Sao chép lớp học thành công' : 'Thêm mới lớp học thành công')));

      if (isEditing) {
        history.push(`${APP_PREFIX_PATH}/classrooms`);
        return;
      }

      if (stayOnPage) {
        setFormData(EMPTY_FORM);
        setErrors({});
        return;
      }

      history.push(`${APP_PREFIX_PATH}/classrooms`);
    } catch (error) {
      const errorMessage = error.message || (isEditing
        ? 'Cập nhật lớp học thất bại'
        : (isCopying ? 'Sao chép lớp học thất bại' : 'Thêm mới lớp học thất bại'));
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
        onClick={handleBack}
        aria-label="Quay lại"
      >
        <ArrowLeftOutlined />
      </button>

      <h1 className="add-classroom-title">
        {isEditing ? 'Sửa đổi thông tin lớp học' : (isCopying ? 'Sao chép thành công lớp học' : 'Thêm lớp học mới')}
      </h1>
      {isCopying && <p className="add-classroom-subtitle">Có thể hiệu chỉnh lại thông tin lớp học trước khi lưu</p>}

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
            {isEditing ? 'Lưu thay đổi' : 'Lưu'}
          </Button>

          {!isEditing && !isCopying && <Button
            className="add-classroom-save-continue-btn"
            onClick={() => submitForm({ stayOnPage: true })}
          >
            Lưu và tiếp tục
          </Button>}
        </div>
      </div>
    </div>
  );
};

export default ClassroomForm;
