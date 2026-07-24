import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Checkbox, message, Table, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
  DeleteOutlined,
  FilterOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import StudentService from 'services/StudentService';
import { downloadExportResponse } from 'utils/exportData';

import './exportData.css';

const EXPORT_TYPES = ['xlsx', 'csv', 'json', 'docx'];
const EXPORT_TYPE_LABELS = {
  xlsx: 'Xlsx',
  csv: 'CSV',
  json: 'Json',
  docx: 'Docx',
};

const RESOURCE_CONFIG = {
  classrooms: {
    title: 'lớp học',
    service: ClassroomService,
    returnPath: `${APP_PREFIX_PATH}/classrooms`,
    filename: 'classrooms_export',
    requiredColumns: ['code', 'name'],
    fields: ['id', 'code', 'name', 'description', 'student_count'],
    columns: [
      { title: 'Mã lớp', dataIndex: 'code', width: 150, exportField: 'code' },
      { title: 'Tên lớp', dataIndex: 'name', width: 190, exportField: 'name' },
      { title: 'Mô tả', dataIndex: 'description', width: 310, exportField: 'description', ellipsis: true },
    ],
  },
  students: {
    title: 'học sinh',
    service: StudentService,
    returnPath: `${APP_PREFIX_PATH}/students`,
    filename: 'students_export',
    requiredColumns: ['code', 'fullname'],
    fields: [
      'id', 'attachment', 'code', 'fullname', 'dob', 'sex', 'homecity', 'address',
      'hobbies', 'hair_color', 'email', 'facebook', 'class_id', 'username', 'description'
    ],
    columns: [
      { title: 'Ảnh', dataIndex: 'attachment', width: 72, type: 'avatar', exportField: 'attachment' },
      { title: 'ID', dataIndex: 'id', width: 70, exportField: 'id' },
      { title: 'Mã', dataIndex: 'code', width: 110, exportField: 'code' },
      { title: 'Họ tên', dataIndex: 'fullname', width: 170, exportField: 'fullname' },
      { title: 'Ngày sinh', dataIndex: 'dob', width: 120, exportField: 'dob' },
      { title: 'Giới tính', dataIndex: 'sex', width: 95, exportField: 'sex', type: 'gender' },
      { title: 'Quê quán', dataIndex: 'homecity', width: 130, exportField: 'homecity' },
      { title: 'Địa chỉ', dataIndex: 'address', width: 180, exportField: 'address', ellipsis: true },
      { title: 'Sở thích', dataIndex: 'hobbies', width: 130, exportField: 'hobbies' },
      { title: 'Màu tóc', dataIndex: 'hair_color', width: 105, exportField: 'hair_color' },
      { title: 'Email', dataIndex: 'email', width: 190, exportField: 'email', ellipsis: true },
      { title: 'Facebook', dataIndex: 'facebook', width: 150, exportField: 'facebook', ellipsis: true },
    ],
  },
};

const ExportData = ({ resource }) => {
  const history = useHistory();
  const location = useLocation();
  const config = RESOURCE_CONFIG[resource] || RESOURCE_CONFIG.classrooms;
  const ids = useMemo(() => {
    const rawIds = new URLSearchParams(location.search).get('ids') || '';
    return rawIds.split(',').map(Number).filter(id => Number.isInteger(id) && id > 0);
  }, [location.search]);
  const [rows, setRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingType, setDownloadingType] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => config.columns.map(column => column.dataIndex));
  const [pendingColumnKeys, setPendingColumnKeys] = useState(() => config.columns.map(column => column.dataIndex));

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      if (!ids.length) return;
      setLoading(true);
      try {
        const responses = await Promise.all(ids.map(id => config.service.getById(id, {
          columnlist: JSON.stringify(config.fields),
        })));
        if (!active) return;
        const records = responses.map(response => response?.data).filter(Boolean).map(record => ({
          ...record,
          key: String(record.id),
        }));
        setRows(records);
        setSelectedRowKeys(records.map(record => record.key));
      } catch (error) {
        message.error(error.message || `Không tải được dữ liệu ${config.title}`);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRows();
    return () => { active = false; };
  }, [config, ids]);

  const removeRows = keys => {
    const removed = new Set(keys.map(String));
    setRows(current => current.filter(row => !removed.has(row.key)));
    setSelectedRowKeys(current => current.filter(key => !removed.has(String(key))));
  };

  const removeSelected = () => {
    if (!selectedRowKeys.length) {
      message.warning('Bạn chưa chọn dữ liệu để bỏ');
      return;
    }
    removeRows(selectedRowKeys);
  };

  const handleDownload = async type => {
    const exportIds = selectedRowKeys.map(Number).filter(Boolean);
    if (!exportIds.length) {
      message.warning('Bạn chưa chọn dữ liệu để xuất');
      return;
    }
    setShowExportMenu(false);
    setDownloadingType(type);
    try {
      const fields = config.columns
        .filter(column => visibleColumnKeys.includes(column.dataIndex))
        .map(column => column.exportField)
        .filter(Boolean);
      const response = await config.service.exportData({
        idlist: JSON.stringify(exportIds),
        type,
        columnlist: JSON.stringify(fields),
      });
      downloadExportResponse(response, type, config.filename);
      message.success(`Đã tải dữ liệu ${type.toUpperCase()}`);
    } catch (error) {
      message.error(error.message || 'Xuất dữ liệu thất bại');
    } finally {
      setDownloadingType('');
    }
  };

  const columns = useMemo(() => [
    { title: 'STT', key: 'stt', width: 68, align: 'center', render: (_, __, index) => index + 1 },
    ...config.columns
      .filter(column => visibleColumnKeys.includes(column.dataIndex))
      .map(column => ({
        ...column,
        render: column.type === 'avatar'
          ? value => <Avatar size={36} src={value ? `data:image/png;base64,${value}` : undefined} />
          : column.type === 'gender'
            ? value => (value ? 'Nam' : 'Nữ')
            : value => <Tooltip title={String(value ?? '')}><span>{String(value ?? '')}</span></Tooltip>,
      })),
    {
      title: 'Hành động',
      key: 'actions',
      width: 105,
      align: 'center',
      fixed: 'right',
      render: (_, row) => <DeleteOutlined className="export-data-delete-one" onClick={() => removeRows([row.key])} />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [config, visibleColumnKeys]);

  const tableWidth = columns.reduce((total, column) => total + Number(column.width || 160), 0);

  return (
    <div className="export-data-page">
      <button type="button" className="export-data-back app-back-arrow-btn" onClick={() => history.push(config.returnPath)} aria-label="Quay lại">
        <ArrowLeftOutlined />
      </button>

      <h1>Xuất dữ liệu theo mẫu</h1>
      <p>Chọn mẫu phù hợp và bộ lọc phù hợp, hệ thống sẽ hiển thị bản xem trước</p>

      <div className="export-data-toolbar">
        <Button danger onClick={removeSelected}>Xóa dữ liệu đã chọn</Button>
        <div className="export-data-toolbar-actions">
          <Button className="export-data-print" icon={<PrinterOutlined />} onClick={() => window.print()} aria-label="In dữ liệu" />
          <div className="export-data-download-wrap">
            <Button className="export-data-download" loading={Boolean(downloadingType)} onClick={() => setShowExportMenu(current => !current)}>
              Xuất mẫu dữ liệu {showExportMenu ? <CaretUpOutlined /> : <CaretDownOutlined />}
            </Button>
            {showExportMenu && (
              <div className="export-data-download-menu">
                {EXPORT_TYPES.map(type => (
                  <button type="button" key={type} onClick={() => handleDownload(type)}>{EXPORT_TYPE_LABELS[type]}</button>
                ))}
              </div>
            )}
          </div>
          <div className="export-data-filter-wrap">
            <Button className="export-data-filter" icon={<FilterOutlined />} onClick={() => setShowFilter(current => !current)} />
            {showFilter && (
              <div className="export-data-filter-menu">
                {config.columns.map(column => {
                  const required = config.requiredColumns.includes(column.dataIndex);
                  return (
                    <label key={column.dataIndex} className={required ? 'is-required' : ''}>
                      <Checkbox
                        checked={pendingColumnKeys.includes(column.dataIndex)}
                        disabled={required}
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
                <button type="button" className="export-data-filter-apply" onClick={() => {
                  setVisibleColumnKeys(pendingColumnKeys);
                  setShowFilter(false);
                }}>Áp dụng</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="export-data-table-wrap">
        <Table
          bordered
          loading={loading}
          columns={columns}
          dataSource={rows}
          rowKey="key"
          rowSelection={{
            fixed: true,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys.map(String)),
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: tableWidth }}
          size="small"
        />
      </div>
    </div>
  );
};

export default ExportData;