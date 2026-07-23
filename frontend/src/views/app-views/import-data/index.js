import React, { useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Input, message, Select, Table, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CaretDownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import StudentService from 'services/StudentService';

import './importData.css';

const { TextArea } = Input;
const { Option } = Select;
const FILE_TYPES = ['xlsx', 'csv', 'json', 'xml'];

const RESOURCE_CONFIG = {
  classrooms: {
    title: 'lớp học',
    service: ClassroomService,
    returnPath: `${APP_PREFIX_PATH}/classrooms`,
    uniqueFields: ['code'],
    fields: [
      { key: 'code', label: 'Mã lớp', required: true },
      { key: 'name', label: 'Tên lớp', required: true },
      { key: 'description', label: 'Mô tả', textarea: true },
    ],
    columns: [
      { title: 'Mã lớp', dataIndex: 'code', width: 140 },
      { title: 'Tên lớp', dataIndex: 'name', width: 190 },
      { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
    ],
  },
  students: {
    title: 'học sinh',
    service: StudentService,
    returnPath: `${APP_PREFIX_PATH}/students`,
    uniqueFields: ['code', 'email', 'username'],
    fields: [
      { key: 'code', label: 'Mã học sinh', required: true },
      { key: 'fullname', label: 'Họ và tên', required: true },
      { key: 'dob', label: 'Ngày sinh', required: true, type: 'date' },
      { key: 'email', label: 'Email', required: true },
      { key: 'class_id', label: 'Lớp học', required: true },
      { key: 'username', label: 'Tài khoản', required: true },
      { key: 'password', label: 'Mật khẩu', required: true, type: 'password' },
      { key: 'homecity', label: 'Quê quán' },
      { key: 'address', label: 'Địa chỉ' },
      { key: 'facebook', label: 'Facebook' },
      { key: 'description', label: 'Mô tả', textarea: true },
    ],
    columns: [
      { title: 'Mã học sinh', dataIndex: 'code', width: 140 },
      { title: 'Họ tên', dataIndex: 'fullname', width: 190 },
      { title: 'Ngày sinh', dataIndex: 'dob', width: 130 },
      { title: 'Email', dataIndex: 'email', width: 200, ellipsis: true },
      { title: 'Tài khoản', dataIndex: 'username', width: 150 },
    ],
  },
};

const fileToBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const ImportData = ({ resource }) => {
  const history = useHistory();
  const fileInputRef = useRef(null);
  const config = RESOURCE_CONFIG[resource] || RESOURCE_CONFIG.classrooms;
  const [rows, setRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => config.columns.map(column => column.dataIndex));
  const [pendingColumnKeys, setPendingColumnKeys] = useState(() => config.columns.map(column => column.dataIndex));

  const requiredColumnKeys = config.fields
    .filter(field => field.required)
    .map(field => field.key);

  const getRowValidationErrors = row => {
    const errors = config.fields
      .filter(field => field.required && !String(row[field.key] || '').trim())
      .map(field => `Thiếu ${field.label}`);

    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email))) {
      errors.push('Email không hợp lệ');
    }

    config.uniqueFields.forEach(fieldKey => {
      const value = String(row[fieldKey] || '').trim().toLowerCase();
      if (!value) return;
      const duplicateCount = rows.filter(item => (
        String(item[fieldKey] || '').trim().toLowerCase() === value
      )).length;
      if (duplicateCount > 1) {
        const field = config.fields.find(item => item.key === fieldKey);
        errors.push(`Trùng ${field?.label || fieldKey}`);
      }
    });

    return errors;
  };
  const editingRow = rows.find(row => String(row.id) === editingKey);
  const samplePrefix = resource === 'students' ? 'students' : 'classes';
  const sampleUrl = type => `${process.env.PUBLIC_URL || ''}/import-samples/${resource}/${samplePrefix}_import_sample.${type}`;

  const openEditor = row => {
    setEditingKey(String(row.id));
    setEditingValues(config.fields.reduce((values, field) => ({
      ...values,
      [field.key]: Array.isArray(row[field.key]) ? row[field.key][0] : (row[field.key] || ''),
    }), {}));
  };

  const removeRows = async records => {
    try {
      await Promise.all(records.map(record => config.service.remove(record.id)));
      const removedIds = new Set(records.map(record => String(record.id)));
      setRows(current => current.filter(row => !removedIds.has(String(row.id))));
      setSelectedRowKeys(current => current.filter(key => !removedIds.has(String(key))));
      if (editingKey && removedIds.has(editingKey)) setEditingKey(null);
      message.success(`Đã xóa ${records.length} ${config.title}`);
    } catch (error) {
      message.error(error.message || 'Xóa dữ liệu import thất bại');
    }
  };

  const removeSelected = () => {
    const selected = rows.filter(row => selectedRowKeys.includes(String(row.id)));
    if (!selected.length) {
      message.warning('Bạn chưa chọn dữ liệu để xóa');
      return;
    }
    removeRows(selected);
  };

  const handleFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    const normalizedType = extension === 'excel' ? 'xlsx' : extension;
    if (!FILE_TYPES.includes(normalizedType)) {
      message.error('Chỉ hỗ trợ tệp XLSX, CSV, JSON hoặc XML');
      return;
    }
    setFileName(file.name);
    setImporting(true);
    try {
      const attachment = await fileToBase64(file);
      const response = await config.service.importData({ attachment, type: normalizedType });
      const imported = Array.isArray(response?.data) ? response.data : [];
      setRows(imported.map(item => ({ ...item, id: Number(item.id) })));
      setSelectedRowKeys(imported.map(item => String(item.id)));
      setEditingKey(null);
      message.success(response.message || `Import thành công ${imported.length} ${config.title}`);
    } catch (error) {
      message.error(error.message || 'Import dữ liệu thất bại');
    } finally {
      setImporting(false);
    }
  };

  const saveEdit = async () => {
    const missing = config.fields.find(field => field.required && !String(editingValues[field.key] || '').trim());
    if (missing) {
      message.error(`${missing.label} là trường bắt buộc`);
      return;
    }
    setSaving(true);
    try {
      await config.service.update(editingRow.id, editingValues);
      setRows(current => current.map(row => (
        row.id === editingRow.id ? { ...row, ...editingValues } : row
      )));
      setEditingKey(null);
      message.success(`Cập nhật ${config.title} thành công`);
    } catch (error) {
      message.error(error.message || 'Cập nhật dữ liệu import thất bại');
    } finally {
      setSaving(false);
    }
  };

  const saveImport = () => {
    if (!rows.length) {
      message.warning('Chưa có dữ liệu import để lưu');
      return;
    }
    if (editingKey) {
      message.warning('Vui lòng hoàn tất chỉnh sửa trước khi lưu');
      return;
    }
    const invalidRows = rows.filter(row => getRowValidationErrors(row).length);
    if (invalidRows.length) {
      message.error(`Còn ${invalidRows.length} dòng dữ liệu chưa hợp lệ`);
      return;
    }
    message.success(`Đã lưu ${rows.length} ${config.title}`);
    history.push(config.returnPath);
  };
  const columns = useMemo(() => [
    { title: 'STT', width: 70, align: 'center', render: (_, __, index) => index + 1 },
    ...config.columns.filter(column => visibleColumnKeys.includes(column.dataIndex)),
    {
      key: 'validation',
      title: 'Kiểm tra',
      width: 240,
      align: 'center',
      fixed: 'right',
      render: (_, row) => {
        const errors = getRowValidationErrors(row);
        return errors.length ? (
          <div className="import-data-status-block">
            <span className="import-data-status is-error"><CloseCircleOutlined /> Có lỗi</span>
            <div className="import-data-status-errors">
              {errors.map(error => <div key={error}>• {error}</div>)}
            </div>
          </div>
        ) : (
          <span className="import-data-status is-ok"><CheckCircleOutlined /> OK</span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Hành động',
      width: 110,
      align: 'center',
      fixed: 'right',
      render: (_, row) => (
        <div className="import-data-row-actions">
          <Tooltip title="Xóa"><DeleteOutlined onClick={() => removeRows([row])} /></Tooltip>
          <Tooltip title="Sửa"><EditOutlined onClick={() => openEditor(row)} /></Tooltip>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [config, rows, visibleColumnKeys]);

  return (
    <div className="import-data-page">
      <button type="button" className="import-data-back app-back-arrow-btn" onClick={() => history.push(config.returnPath)} aria-label="Quay lại">
        <ArrowLeftOutlined />
      </button>

      <h1>Import dữ liệu theo mẫu</h1>
      <p className="import-data-subtitle">Chọn định dạng và tải file để import danh mục {config.title}, sau đó có thể hiệu chỉnh thông tin</p>

      <div className="import-data-toolbar">
        <Button danger onClick={removeSelected}>Xóa dữ liệu đã chọn</Button>
        <div className="import-data-toolbar-right">
          <Button type="primary" className="import-data-upload-button" icon={<UploadOutlined />} loading={importing} onClick={() => fileInputRef.current?.click()}>
            Import dữ liệu <CaretDownOutlined />
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.json,.xml" onChange={handleFile} />
          <fieldset className="import-data-sample-box">
            <legend>Xuất mẫu dữ liệu</legend>
            <div className="import-data-sample-options">
              {FILE_TYPES.map(type => (
                <a key={type} href={sampleUrl(type)} download>
                  {type.toUpperCase()}
                </a>
              ))}
            </div>
          </fieldset>
          <div className="import-data-filter-wrap">
            <Button className="import-data-filter" icon={<FilterOutlined />} onClick={() => setShowColumnFilter(current => !current)} />
            {showColumnFilter && (
              <div className="import-data-filter-menu">
                {config.columns.map(column => {
                  const isRequired = requiredColumnKeys.includes(column.dataIndex);
                  return (
                    <label key={column.dataIndex} className={isRequired ? 'is-required' : ''}>
                      <Checkbox
                        checked={pendingColumnKeys.includes(column.dataIndex)}
                        disabled={isRequired}
                        onChange={event => setPendingColumnKeys(keys => (
                          event.target.checked
                            ? [...keys, column.dataIndex]
                            : keys.filter(key => key !== column.dataIndex)
                        ))}
                      />
                      <span>{column.title}</span>
                    </label>
                  );
                })}
                <button
                  type="button"
                  className="import-data-filter-apply"
                  onClick={() => {
                    setVisibleColumnKeys(pendingColumnKeys);
                    setShowColumnFilter(false);
                  }}
                >
                  Áp dụng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {resource === 'students' && (
        <div className="import-data-note">Lưu ý: class_id trong file học sinh phải là ID, mã hoặc tên lớp đã tồn tại.</div>
      )}
      {fileName && <div className="import-data-file-name">Tệp: {fileName}</div>}
      <h2>Import thành công <strong>{String(rows.length).padStart(2, '0')}</strong> {config.title}</h2>

      <div className={`import-data-content ${editingRow ? 'has-editor' : ''}`}>
        <Table
          bordered
          columns={columns}
          dataSource={rows}
          rowKey={row => String(row.id)}
          rowSelection={{ fixed: true, selectedRowKeys, onChange: keys => setSelectedRowKeys(keys.map(String)) }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: resource === 'students' ? 1450 : 1050 }}
          size="small"
        />

        {editingRow && (
          <div className="import-data-editor">
            <h3>Chỉnh sửa {config.title}</h3>
            <div className="import-data-editor-fields">
              {config.fields.map(field => (
                <label key={field.key} className={field.textarea ? 'is-wide' : ''}>
                  <span>{field.label}{field.required && <em> *</em>}</span>
                  {field.textarea ? (
                    <TextArea rows={7} value={editingValues[field.key]} onChange={event => setEditingValues(values => ({ ...values, [field.key]: event.target.value }))} />
                  ) : field.key === 'class_id' ? (
                    <Select value={editingValues[field.key] || undefined} onChange={value => setEditingValues(values => ({ ...values, [field.key]: value }))}>
                      <Option value={editingValues[field.key]}>{editingValues[field.key]}</Option>
                    </Select>
                  ) : (
                    <Input type={field.type || 'text'} value={editingValues[field.key]} onChange={event => setEditingValues(values => ({ ...values, [field.key]: event.target.value }))} />
                  )}
                </label>
              ))}
            </div>
            <Button type="primary" loading={saving} onClick={saveEdit}>Sửa</Button>
          </div>
        )}
      </div>
      <Button
        type="primary"
        className="import-data-save-button"
        disabled={!rows.length}
        onClick={saveImport}
      >
        Lưu
      </Button>
    </div>
  );
};

export default ImportData;
