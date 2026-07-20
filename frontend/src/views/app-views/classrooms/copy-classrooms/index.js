import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, message, Table, Tooltip } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import { unwrapRecords } from 'services/OdooApiService';
import confirmDiscardChanges from 'utils/confirmDiscardChanges';
import { getNextCopyValue } from 'utils/copyFieldValue';

import './copyClassrooms.css';

const { TextArea } = Input;

const CopyClassrooms = () => {
  const history = useHistory();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [existingCodes, setExistingCodes] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedIds = useMemo(() => new URLSearchParams(location.search)
    .get('ids')
    ?.split(',')
    .map(Number)
    .filter(id => Number.isInteger(id) && id > 0) || [], [location.search]);

  useEffect(() => {
    if (!selectedIds.length) {
      message.warning('Bạn chưa chọn lớp học để sao chép');
      history.replace(`${APP_PREFIX_PATH}/classrooms`);
      return;
    }

    ClassroomService.getAll({
      columnlist: JSON.stringify(['id', 'code', 'name', 'description']),
    }).then(response => {
      const records = unwrapRecords(response);
      const recordsById = records.reduce((result, item) => {
        result[Number(item.id)] = item;
        return result;
      }, {});
      const usedCodes = records.map(item => String(item.code || '').trim().toLowerCase()).filter(Boolean);
      const copies = selectedIds.map(sourceId => recordsById[sourceId]).filter(Boolean).map(source => {
        const code = getNextCopyValue(source.code || '', usedCodes, 50);
        usedCodes.push(code.toLowerCase());
        return {
          key: String(source.id),
          sourceId: source.id,
          code,
          name: source.name || '',
          description: source.description || '',
        };
      });
      setExistingCodes(records.map(item => String(item.code || '').trim().toLowerCase()).filter(Boolean));
      setRows(copies);
    }).catch(error => {
      message.error(error.message || 'Không tải được các lớp học đã chọn');
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRow = (field, value) => {
    setRows(current => current.map(row => (
      row.key === editingKey ? { ...row, [field]: value } : row
    )));
  };

  const removeRow = key => {
    setRows(current => current.filter(row => row.key !== key));
    setSelectedRowKeys(current => current.filter(selectedKey => selectedKey !== key));
    if (editingKey === key) {
      setEditingKey(null);
    }
  };

  const removeSelectedRows = () => {
    if (!selectedRowKeys.length) {
      message.warning('Bạn chưa chọn lớp học cần loại khỏi danh sách sao chép');
      return;
    }
    const selectedKeys = new Set(selectedRowKeys);
    setRows(current => current.filter(row => !selectedKeys.has(row.key)));
    if (selectedKeys.has(editingKey)) {
      setEditingKey(null);
    }
    setSelectedRowKeys([]);
  };

  const handleBack = () => confirmDiscardChanges({
    title: 'Hủy sao chép?',
    content: 'Thông tin các bản sao chưa lưu sẽ bị mất. Bạn có muốn hủy sao chép không?',
    okText: 'Hủy sao chép',
    onOk: () => history.push(`${APP_PREFIX_PATH}/classrooms`),
  });

  const validateRows = () => {
    if (!rows.length) return 'Không còn lớp học nào để sao chép';
    const codes = rows.map(row => row.code.trim().toLowerCase());
    if (rows.some(row => !row.code.trim())) return 'Mã lớp học là bắt buộc';
    if (rows.some(row => !row.name.trim())) return 'Tên lớp học là bắt buộc';
    if (new Set(codes).size !== codes.length) return 'Mã lớp học trong danh sách sao chép không được trùng nhau';
    if (codes.some(code => existingCodes.includes(code))) return 'Mã lớp học đã tồn tại';
    return '';
  };

  const saveCopies = async () => {
    const validationError = validateRows();
    if (validationError) {
      message.error(validationError);
      return;
    }
    setSaving(true);
    try {
      await Promise.all(rows.map(row => ClassroomService.create({
        code: row.code.trim(),
        name: row.name.trim(),
        description: row.description.trim(),
      })));
      message.success(`Sao chép thành công ${rows.length} lớp học`);
      history.push(`${APP_PREFIX_PATH}/classrooms`);
    } catch (error) {
      message.error(error.message || 'Sao chép các lớp học thất bại');
    } finally {
      setSaving(false);
    }
  };

  const editingRow = rows.find(row => row.key === editingKey);
  const columns = [
    { title: 'STT', width: 70, align: 'center', render: (_, __, index) => index + 1 },
    { title: 'Mã lớp', dataIndex: 'code', width: 130 },
    { title: 'Tên lớp', dataIndex: 'name', width: 170 },
    { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
    {
      title: 'Hành động',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <div className="copy-classrooms-row-actions">
          <Tooltip title="Xóa"><DeleteOutlined onClick={() => removeRow(record.key)} /></Tooltip>
          <Tooltip title="Sửa">
            <EditOutlined
              className={editingKey === record.key ? 'is-active' : ''}
              onClick={() => setEditingKey(record.key)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="copy-classrooms-page">
      <button type="button" className="copy-classrooms-back app-back-arrow-btn" onClick={handleBack} aria-label="Quay lại">
        <ArrowLeftOutlined />
      </button>
      <h1>Sao chép thành công <strong>{String(rows.length).padStart(2, '0')}</strong> lớp học đã chọn</h1>
      <p className="copy-classrooms-subtitle">Có thể hiệu chỉnh lại thông tin lớp học trước khi lưu</p>

      <div className={`copy-classrooms-content ${editingRow ? 'has-editor' : ''}`}>
        <div className="copy-classrooms-table-area">
          <Button danger className="copy-classrooms-remove-selected" onClick={removeSelectedRows}>
            Xóa dữ liệu đã chọn
          </Button>
          <Table
            bordered
            loading={loading}
            columns={columns}
            dataSource={rows}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys.map(String)),
            }}
            pagination={false}
            size="small"
          />
        </div>

        {editingRow && (
          <div className="copy-classrooms-editor">
            <div className="copy-classrooms-editor-row">
              <Input value={editingRow.code} placeholder="Mã lớp học" onChange={event => updateRow('code', event.target.value)} />
              <Input value={editingRow.name} placeholder="Tên lớp học" onChange={event => updateRow('name', event.target.value)} />
            </div>
            <TextArea value={editingRow.description} rows={8} placeholder="Mô tả" onChange={event => updateRow('description', event.target.value)} />
            <Button type="primary" onClick={() => setEditingKey(null)}>Sửa</Button>
          </div>
        )}
      </div>

      {!editingRow && (
        <Button className="copy-classrooms-save" type="primary" loading={saving} onClick={saveCopies}>Lưu</Button>
      )}
    </div>
  );
};

export default CopyClassrooms;
