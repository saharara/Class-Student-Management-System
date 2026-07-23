import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Input, message, Radio, Select, Table, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import StudentService from 'services/StudentService';
import { unwrapRecords } from 'services/OdooApiService';
import { getHobbyLabels, getHobbyMask, normalizeHobbyOptions } from 'constants/HobbyOptions';
import confirmDiscardChanges from 'utils/confirmDiscardChanges';
import { getNextCopyValue } from 'utils/copyFieldValue';

import './copyStudents.css';

const { TextArea } = Input;
const { Option } = Select;

const getClassId = value => Array.isArray(value) ? Number(value[0]) : Number(value?.id || value || 0);

const EditorField = ({ label, required = false, className = '', children }) => (
  <label className={`copy-students-field ${className}`}>
    <span>{label}{required && <em> *</em>}</span>
    {children}
  </label>
);

const CopyStudents = () => {
  const history = useHistory();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [hobbyOptions, setHobbyOptions] = useState([]);
  const [existingUnique, setExistingUnique] = useState({ codes: [], emails: [], usernames: [] });
  const [editingKey, setEditingKey] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedIds = useMemo(() => new URLSearchParams(location.search).get('ids')
    ?.split(',').map(Number).filter(id => Number.isInteger(id) && id > 0) || [], [location.search]);

  useEffect(() => {
    if (!selectedIds.length) {
      message.warning('Bạn chưa chọn học sinh để sao chép');
      history.replace(`${APP_PREFIX_PATH}/students`);
      return;
    }
    Promise.all([
      StudentService.getAll({
        columnlist: JSON.stringify([
          'id', 'code', 'fullname', 'dob', 'sex', 'homecity', 'address', 'hobbies',
          'hair_color', 'email', 'facebook', 'class_id', 'username', 'password',
          'description', 'attachment',
        ]),
      }),
      ClassroomService.getAll({ columnlist: JSON.stringify(['id', 'code', 'name']) }),
      StudentService.getHobbies(),
    ]).then(([studentResponse, classResponse, hobbyResponse]) => {
      const students = unwrapRecords(studentResponse);
      const classRecords = unwrapRecords(classResponse).map(item => ({ ...item, id: Number(item.id) }));
      const hobbies = normalizeHobbyOptions(unwrapRecords(hobbyResponse));
      const byId = students.reduce((result, item) => ({ ...result, [Number(item.id)]: item }), {});
      const usedCodes = students.map(item => String(item.code || '').toLowerCase());
      const usedUsernames = students.map(item => String(item.username || '').toLowerCase());
      const copies = selectedIds.map(id => byId[id]).filter(Boolean).map(source => {
        const code = getNextCopyValue(source.code || '', usedCodes, 50);
        const username = getNextCopyValue(source.username || '', usedUsernames, 50);
        usedCodes.push(code.toLowerCase());
        usedUsernames.push(username.toLowerCase());
        return {
          key: String(source.id),
          code,
          fullname: source.fullname || '',
          dob: source.dob || '',
          sex: Boolean(source.sex),
          homecity: source.homecity || '',
          address: source.address || '',
          hobbies: hobbies.filter(item => Math.floor(Number(source.hobbies || 0) / item.mask) % 2 === 1).map(item => item.code),
          hairColor: source.hair_color || '#111111',
          email: '',
          facebook: source.facebook || '',
          classId: getClassId(source.class_id),
          username,
          password: source.password || '',
          description: source.description || '',
          photoBase64: source.attachment || '',
          photoPreview: source.attachment ? `data:image/png;base64,${source.attachment}` : '',
        };
      });
      setExistingUnique({
        codes: students.map(item => String(item.code || '').toLowerCase()),
        emails: students.map(item => String(item.email || '').toLowerCase()).filter(Boolean),
        usernames: students.map(item => String(item.username || '').toLowerCase()),
      });
      setClasses(classRecords);
      setHobbyOptions(hobbies);
      setRows(copies);
    }).catch(error => message.error(error.message || 'Không tải được các học sinh đã chọn'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editingRow = rows.find(row => row.key === editingKey);
  const updateRow = (field, value) => setRows(current => current.map(row => (
    row.key === editingKey ? { ...row, [field]: value } : row
  )));

  const removeRows = keys => {
    const removed = new Set(keys);
    setRows(current => current.filter(row => !removed.has(row.key)));
    setSelectedRowKeys(current => current.filter(key => !removed.has(key)));
    if (removed.has(editingKey)) setEditingKey(null);
  };

  const removeSelected = () => {
    if (!selectedRowKeys.length) {
      message.warning('Bạn chưa chọn học sinh cần loại khỏi danh sách sao chép');
      return;
    }
    removeRows(selectedRowKeys);
  };

  const handleImageChange = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !/^image\/(png|jpeg)$/.test(file.type)) {
      if (file) message.error('Ảnh chỉ hỗ trợ định dạng JPG, JPEG hoặc PNG');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      updateRow('photoPreview', result);
      updateRow('photoBase64', result.split(',')[1] || '');
    };
    reader.readAsDataURL(file);
  };

  const removeEditingPhoto = () => {
    setRows(current => current.map(row => (
      row.key === editingKey ? { ...row, photoPreview: '', photoBase64: '' } : row
    )));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getRowErrors = (row, allRows = rows) => {
    const errors = [];
    const code = row.code.trim().toLowerCase();
    const username = row.username.trim().toLowerCase();

    if (!code) errors.push('Thiếu mã học sinh');
    if (!row.fullname.trim()) errors.push('Thiếu họ tên');
    if (!row.dob) errors.push('Thiếu ngày sinh');
    else if (new Date(row.dob) >= new Date()) errors.push('Ngày sinh phải trước hiện tại');
    if (!row.classId || !classes.some(item => item.id === Number(row.classId))) errors.push('Lớp học không hợp lệ');
    const email = row.email.trim().toLowerCase();
    if (!email) errors.push('Thiếu email');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email không đúng định dạng');
    else if (existingUnique.emails.includes(email)
      || allRows.filter(item => item.email.trim().toLowerCase() === email).length > 1) {
      errors.push('Email bị trùng');
    }
    if (!username) errors.push('Thiếu tài khoản');
    if (!row.password) errors.push('Thiếu mật khẩu');
    else if (!/^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9\s]).{8,}$/.test(row.password)) {
      errors.push('Mật khẩu chưa đủ mạnh');
    }
    if (row.facebook.trim() && !/^https?:\/\/[0-9a-zA-Z.\-_]+$/.test(row.facebook.trim())) {
      errors.push('Facebook không đúng định dạng');
    }
    if (code && (existingUnique.codes.includes(code)
      || allRows.filter(item => item.code.trim().toLowerCase() === code).length > 1)) {
      errors.push('Mã học sinh bị trùng');
    }
    if (username && (existingUnique.usernames.includes(username)
      || allRows.filter(item => item.username.trim().toLowerCase() === username).length > 1)) {
      errors.push('Tài khoản bị trùng');
    }
    return errors;
  };

  const validateRows = () => {
    if (!rows.length) return 'Không còn học sinh nào để sao chép';
    const invalidIndex = rows.findIndex(row => getRowErrors(row).length);
    if (invalidIndex < 0) return '';
    return `Dòng ${invalidIndex + 1}: ${getRowErrors(rows[invalidIndex]).join(', ')}`;
  };

  const saveCopies = async () => {
    const validationError = validateRows();
    if (validationError) {
      message.error(validationError);
      return;
    }
    setSaving(true);
    try {
      await Promise.all(rows.map(row => {
        const selectedClass = classes.find(item => item.id === Number(row.classId));
        const payload = {
          code: row.code.trim(), fullname: row.fullname.trim(), dob: row.dob,
          sex: row.sex, homecity: row.homecity.trim(), address: row.address.trim(),
          hobbies: getHobbyMask(row.hobbies, hobbyOptions), hair_color: row.hairColor,
          email: row.email.trim(), facebook: row.facebook.trim(),
          class_id: selectedClass?.code || Number(row.classId), username: row.username.trim(),
          password: row.password, description: row.description.trim(), action: 'copy',
        };
        if (row.photoBase64) {
          payload.attachment = row.photoBase64;
          payload.attachment_filename = 'student-copy.png';
        }
        return StudentService.create(payload);
      }));
      message.success(`Sao chép thành công ${rows.length} học sinh`);
      history.push(`${APP_PREFIX_PATH}/students`);
    } catch (error) {
      message.error(error.message || 'Sao chép các học sinh thất bại');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'Ảnh', width: 58, align: 'center', render: (_, row) => <Avatar size={32} src={row.photoPreview}>{row.fullname.slice(0, 1)}</Avatar> },
    { title: 'STT', width: 52, align: 'center', render: (_, __, index) => index + 1 },
    { title: 'Mã', dataIndex: 'code', width: 90 },
    { title: 'Họ tên', dataIndex: 'fullname', width: 130 },
    { title: 'Ngày sinh', dataIndex: 'dob', width: 100 },
    { title: 'Giới tính', width: 74, render: (_, row) => row.sex ? 'Nam' : 'Nữ' },
    { title: 'Quê quán', dataIndex: 'homecity', width: 100, ellipsis: true },
    { title: 'Địa chỉ', dataIndex: 'address', width: 130, ellipsis: true },
    { title: 'Sở thích', width: 110, ellipsis: true, render: (_, row) => getHobbyLabels(getHobbyMask(row.hobbies, hobbyOptions), hobbyOptions).join(', ') },
    { title: 'Màu tóc', dataIndex: 'hairColor', width: 84 },
    { title: 'Email', dataIndex: 'email', width: 170, ellipsis: true },
    { title: 'Facebook', dataIndex: 'facebook', width: 120, ellipsis: true },
    {
      title: 'Lớp học',
      width: 150,
      ellipsis: true,
      render: (_, row) => {
        const selectedClass = classes.find(item => item.id === Number(row.classId));
        return selectedClass ? `${selectedClass.code} - ${selectedClass.name}` : '';
      },
    },
    { title: 'Tài khoản', dataIndex: 'username', width: 130, ellipsis: true },
    { title: 'Mật khẩu', dataIndex: 'password', width: 130, ellipsis: true },
    { title: 'Mô tả', dataIndex: 'description', width: 160, ellipsis: true },
    {
      title: 'Kiểm tra',
      width: 260,
      align: 'center',
      fixed: 'right',
      render: (_, row) => {
        const rowErrors = getRowErrors(row);
        return rowErrors.length ? (
          <div className="copy-students-status-block">
            <span className="copy-students-status is-error"><CloseCircleOutlined /> Có lỗi</span>
            <div className="copy-students-status-errors">
              {rowErrors.map(error => <div key={error}>• {error}</div>)}
            </div>
          </div>
        ) : (
          <span className="copy-students-status is-ok"><CheckCircleOutlined /> OK</span>
        );
      },
    },
    {
      title: 'Hành động', width: 102, align: 'center', fixed: 'right', render: (_, row) => (
        <div className="copy-students-row-actions">
          <Tooltip title="Xóa"><DeleteOutlined onClick={() => removeRows([row.key])} /></Tooltip>
          <Tooltip title="Sửa"><EditOutlined className={editingKey === row.key ? 'is-active' : ''} onClick={() => setEditingKey(row.key)} /></Tooltip>
        </div>
      ),
    },
  ];

  const handleBack = () => confirmDiscardChanges({
    title: 'Hủy sao chép?', content: 'Thông tin các bản sao chưa lưu sẽ bị mất. Bạn có muốn hủy sao chép không?',
    okText: 'Hủy sao chép', onOk: () => history.push(`${APP_PREFIX_PATH}/students`),
  });

  return (
    <div className="copy-students-page">
      <button type="button" className="copy-students-back app-back-arrow-btn" onClick={handleBack} aria-label="Quay lại"><ArrowLeftOutlined /></button>
      <h1>Sao chép thành công <strong>{String(rows.length).padStart(2, '0')}</strong> học sinh</h1>
      <p className="copy-students-subtitle">Có thể hiệu chỉnh thông tin học sinh trước khi lưu</p>
      <div className="copy-students-content">
        <Button danger className="copy-students-remove-selected" onClick={removeSelected}>Xóa dữ liệu đã chọn</Button>
        <Table bordered loading={loading} columns={columns} dataSource={rows} pagination={false} size="small"
          rowSelection={{ fixed: true, selectedRowKeys, onChange: keys => setSelectedRowKeys(keys.map(String)) }} scroll={{ x: 2300 }} />

        {editingRow && (
          <div className="copy-students-editor">
            <h2>Chỉnh sửa học sinh đang sao chép</h2>
            <div className="copy-students-editor-card">
              <div className="copy-students-photo">
                <div className="copy-students-photo-box">{editingRow.photoPreview ? <img src={editingRow.photoPreview} alt="Ảnh học sinh" /> : <Avatar size={100}>{editingRow.fullname.slice(0, 1)}</Avatar>}</div>
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} />
                <Button type="primary" icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>Upload</Button>
                {editingRow.photoPreview && <Button danger className="copy-students-remove-photo" icon={<DeleteOutlined />} onClick={removeEditingPhoto}>Bỏ ảnh</Button>}
                <span>Ảnh</span>
              </div>
              <div className="copy-students-fields">
                <EditorField label="Mã học sinh" required><Input value={editingRow.code} placeholder="Mã học sinh" onChange={event => updateRow('code', event.target.value)} /></EditorField>
                <EditorField label="Họ và tên" required><Input value={editingRow.fullname} placeholder="Họ và tên" onChange={event => updateRow('fullname', event.target.value)} /></EditorField>
                <EditorField label="Ngày sinh" required><Input type="date" value={editingRow.dob} onChange={event => updateRow('dob', event.target.value)} /></EditorField>
                <EditorField label="Giới tính" required><Radio.Group value={editingRow.sex} onChange={event => updateRow('sex', event.target.value)}><Radio value>Nam</Radio><Radio value={false}>Nữ</Radio></Radio.Group></EditorField>
                <EditorField label="Lớp học" required><Select value={editingRow.classId || undefined} placeholder="Lớp học" onChange={value => updateRow('classId', Number(value))}>{classes.map(item => <Option key={item.id} value={item.id}>{item.code} - {item.name}</Option>)}</Select></EditorField>
                <EditorField label="Email" required><Input value={editingRow.email} placeholder="Nhập email cho bản sao" onChange={event => updateRow('email', event.target.value)} /></EditorField>
                <EditorField label="Facebook"><Input value={editingRow.facebook} placeholder="Facebook" onChange={event => updateRow('facebook', event.target.value)} /></EditorField>
                <EditorField label="Tài khoản" required><Input value={editingRow.username} placeholder="Tài khoản" onChange={event => updateRow('username', event.target.value)} /></EditorField>
                <EditorField label="Mật khẩu" required><Input.Password value={editingRow.password} placeholder="Mật khẩu" onChange={event => updateRow('password', event.target.value)} /></EditorField>
                <EditorField label="Quê quán"><Input value={editingRow.homecity} placeholder="Quê quán" onChange={event => updateRow('homecity', event.target.value)} /></EditorField>
                <EditorField label="Địa chỉ"><Input value={editingRow.address} placeholder="Địa chỉ" onChange={event => updateRow('address', event.target.value)} /></EditorField>
                <EditorField label="Sở thích"><Select mode="multiple" value={editingRow.hobbies} placeholder="Sở thích" onChange={value => updateRow('hobbies', value)}>{hobbyOptions.map(item => <Option key={item.code} value={item.code}>{item.label}</Option>)}</Select></EditorField>
                <EditorField label="Màu tóc"><Input value={editingRow.hairColor} placeholder="Màu tóc" onChange={event => updateRow('hairColor', event.target.value)} /></EditorField>
                <EditorField label="Mô tả" className="copy-students-description"><TextArea rows={3} value={editingRow.description} placeholder="Mô tả" onChange={event => updateRow('description', event.target.value)} /></EditorField>
                <Button className="copy-students-finish-edit" type="primary" onClick={() => setEditingKey(null)}>Sửa</Button>
              </div>
            </div>
          </div>
        )}
        {!editingRow && <Button className="copy-students-save" type="primary" loading={saving} onClick={saveCopies}>Lưu</Button>}
      </div>
    </div>
  );
};

export default CopyStudents;
