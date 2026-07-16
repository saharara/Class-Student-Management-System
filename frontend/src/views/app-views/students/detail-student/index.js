import React, { useEffect, useState } from 'react';
import { Avatar, message, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useHistory, useParams } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import StudentService from 'services/StudentService';
import { unwrapRecords } from 'services/OdooApiService';
import { getHobbyLabels, normalizeHobbyOptions } from 'constants/HobbyOptions';
import confirmDelete from 'utils/confirmDelete';

import './detailStudent.css';

const STUDENT_COLUMNS = [
  'id',
  'code',
  'fullname',
  'dob',
  'sex',
  'homecity',
  'address',
  'hobbies',
  'hair_color',
  'email',
  'facebook',
  'class_id',
  'username',
  'password',
  'description',
  'attachment',
];

const getClassId = value => {
  if (Array.isArray(value)) {
    return Number(value[0] || 0);
  }

  if (value && typeof value === 'object') {
    return Number(value.id || 0);
  }

  return Number(value || 0);
};

const getClassLabel = classRecord => {
  if (!classRecord) {
    return '';
  }

  if (classRecord.code && classRecord.name) {
    return `${classRecord.code} - ${classRecord.name}`;
  }

  return classRecord.code || classRecord.name || '';
};

const formatDate = value => (value ? String(value).split('-').join(' - ') : '');

const ReadOnlyField = ({ label, value, className = '', multiline = false, selectLike = false, action = null }) => (
  <div className={`detail-student-field ${multiline ? 'is-multiline' : ''} ${selectLike ? 'is-select-like' : ''} ${action ? 'has-action' : ''} ${className}`}>
    <span className="detail-student-field-label">{label}</span>
    <div className="detail-student-field-value">{value || ''}</div>
    {selectLike && <span className="detail-student-select-caret" />}
    {action}
  </div>
);

const DetailStudent = () => {
  const history = useHistory();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [classLabel, setClassLabel] = useState('');
  const [hobbyText, setHobbyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const [studentResponse, classResponse, hobbyResponse] = await Promise.all([
        StudentService.getById(id, {
          columnlist: JSON.stringify(STUDENT_COLUMNS),
        }),
        ClassroomService.getAll({
          columnlist: JSON.stringify(['id', 'code', 'name']),
        }),
        StudentService.getHobbies(),
      ]);

      const nextStudent = studentResponse?.data || {};
      const classesById = unwrapRecords(classResponse).reduce((mapped, item) => {
        mapped[Number(item.id)] = item;
        return mapped;
      }, {});
      const hobbyOptions = normalizeHobbyOptions(unwrapRecords(hobbyResponse));

      setStudent(nextStudent);
      setClassLabel(getClassLabel(classesById[getClassId(nextStudent.class_id)]));
      setHobbyText(getHobbyLabels(nextStudent.hobbies, hobbyOptions).join(', '));
    } catch (error) {
      message.error(error.message || 'Không tải được chi tiết học sinh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const goBack = () => {
    if (history.length > 1) {
      history.goBack();
      return;
    }

    history.push(`${APP_PREFIX_PATH}/students`);
  };

  const handleDelete = () => {
    confirmDelete({
      content: `Bạn có chắc chắn muốn xóa học sinh ${student?.code || student?.fullname || ''} không?`,
      onOk: async () => {
        try {
          const response = await StudentService.remove(id);
          message.success(response.message || 'Xóa học sinh thành công');
          history.push(`${APP_PREFIX_PATH}/students`);
        } catch (error) {
          message.error(error.message || 'Xóa học sinh thất bại');
        }
      },
    });
  };

  const handleCopy = async () => {
    try {
      const response = await StudentService.copy(id);
      message.success(response.message || 'Sao chép học sinh thành công');
      history.push(`${APP_PREFIX_PATH}/students`);
    } catch (error) {
      message.error(error.message || 'Sao chép học sinh thất bại');
    }
  };

  const featurePending = label => {
    message.info(`${label} sẽ được nối ở bước tiếp theo`);
  };

  const avatar = student?.attachment ? `data:image/png;base64,${student.attachment}` : '';

  return (
    <div className="detail-student-page">
      <button
        type="button"
        className="detail-student-back-btn app-back-arrow-btn"
        onClick={goBack}
        aria-label="Quay lại"
      >
        <ArrowLeftOutlined />
      </button>

      <div className="detail-student-heading">
        <h1>Chi tiết học sinh</h1>
        <div className="detail-student-actions">
          <Tooltip title="Xóa học sinh">
            <DeleteOutlined className="danger" onClick={handleDelete} />
          </Tooltip>
          <Tooltip title="Sửa học sinh">
            <EditOutlined className="success" onClick={() => featurePending('Sửa học sinh')} />
          </Tooltip>
          <Tooltip title="Nhân bản học sinh">
            <CopyOutlined className="primary" onClick={handleCopy} />
          </Tooltip>
          <Tooltip title="In">
            <PrinterOutlined className="dark" onClick={() => window.print()} />
          </Tooltip>
          <Tooltip title="Tải xuống">
            <DownloadOutlined className="muted" onClick={() => featurePending('Tải xuống học sinh')} />
          </Tooltip>
        </div>
      </div>

      <div className={`detail-student-content ${loading ? 'is-loading' : ''}`}>
        <div className="detail-student-photo-area">
          <div className="detail-student-photo-box">
            {avatar ? <img src={avatar} alt={student?.fullname || 'Ảnh học sinh'} /> : <Avatar size={112}>{(student?.fullname || '?').slice(0, 1)}</Avatar>}
          </div>
          <div className="detail-student-photo-label">Ảnh</div>
        </div>

        <div className="detail-student-form-grid">
          <ReadOnlyField label="Mã học sinh" value={student?.code} className="code-field" />
          <ReadOnlyField label="Họ và tên" value={student?.fullname} className="name-field" />
          <ReadOnlyField label="Ngày sinh" value={formatDate(student?.dob)} className="birthday-field" />

          <div className="detail-student-field gender-field">
            <span className="detail-student-field-label">Giới tính*</span>
            <div className="detail-student-gender-row">
              <span className={!student?.sex ? 'is-muted' : 'is-active'}><i />Nam</span>
              <span className={student?.sex ? 'is-muted' : 'is-active'}><i />Nữ</span>
            </div>
          </div>

          <ReadOnlyField label="Lớp học*" value={classLabel} className="class-field" />
          <ReadOnlyField label="Email" value={student?.email} className="email-field" />
          <ReadOnlyField label="Facebook" value={student?.facebook} className="facebook-field" />
          <ReadOnlyField label="Tài khoản" value={student?.username} className="username-field" />
                    <ReadOnlyField
            label="Mật khẩu"
            value={showPassword ? student?.password : (student?.password ? '******' : '')}
            className="password-field"
            action={(
              <button
                type="button"
                className="detail-student-password-eye"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </button>
            )}
          />
          <ReadOnlyField label="Quê quán" value={student?.homecity} className="hometown-field" />
          <ReadOnlyField label="Địa chỉ" value={student?.address} className="address-field" />
          <ReadOnlyField label="Sở thích" value={hobbyText} className="hobby-field" selectLike />
          <ReadOnlyField label="Màu tóc" value={student?.hair_color} className="hair-field" />
          <ReadOnlyField label="Mô tả" value={student?.description} className="description-field" multiline />
        </div>
      </div>
    </div>
  );
};

export default DetailStudent;