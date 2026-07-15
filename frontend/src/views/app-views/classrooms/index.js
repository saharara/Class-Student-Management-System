import React, { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Input, message, Table, Tooltip } from 'antd';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
  SlidersOutlined
} from '@ant-design/icons';
import { Resizable } from 'react-resizable';
import { useHistory } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import { unwrapRecords } from 'services/OdooApiService';

const initialColumns = [
  { title: 'STT', dataIndex: 'stt', key: 'stt', width: 150 },
  { title: 'Mã lớp học', dataIndex: 'code', key: 'code', width: 150 },
  { title: 'Tên lớp học', dataIndex: 'name', key: 'name', width: 150 },
  { title: 'Mô tả', dataIndex: 'description', key: 'description', width: 300, type: 'longText' },
];

const defaultVisibleColumnKeys = ['stt', 'code', 'name', 'description'];
const lockedVisibleColumnKeys = ['stt', 'code', 'name'];

const EMPTY_ADVANCED_SEARCH = {
  stt: '',
  code: '',
  name: '',
  description: '',
};

const mapClassroom = (record, index) => ({
  key: String(record.id),
  id: record.id,
  stt: String(record.id || index + 1).padStart(5, '0'),
  code: record.code || '',
  name: record.name || '',
  description: record.description || '',
  studentCount: Number(record.student_count || 0),
});

const ResizableTitle = props => {
  const { onResize, width, children, ...restProps } = props;

  if (!width) {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps}>{children}</th>
    </Resizable>
  );
};

const Classrooms = () => {
  const history = useHistory();
  const [classrooms, setClassrooms] = useState([]);
  const [columns, setColumns] = useState(initialColumns);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(defaultVisibleColumnKeys);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [expandedCells, setExpandedCells] = useState({});
  const [draggedColumnKey, setDraggedColumnKey] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState(EMPTY_ADVANCED_SEARCH);
  const [loading, setLoading] = useState(false);

  const loadClassrooms = async (search = quickSearch) => {
    setLoading(true);
    try {
      const response = await ClassroomService.getPage(1, {
        size: 100,
        search: search || undefined,
        columnlist: JSON.stringify(['id', 'code', 'name', 'description', 'student_count']),
      });
      setClassrooms(unwrapRecords(response).map(mapClassroom));
    } catch (error) {
      message.error(error.message || 'Không tải được dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAdvancedSearch = () => {
    setAdvancedSearch({ ...EMPTY_ADVANCED_SEARCH });
  };

  const toggleCell = (rowKey, dataIndex) => {
    const cellKey = `${rowKey}-${dataIndex}`;
    setExpandedCells(prev => ({ ...prev, [cellKey]: !prev[cellKey] }));
  };

  const moveColumn = targetKey => {
    if (!draggedColumnKey || draggedColumnKey === targetKey) {
      return;
    }

    setColumns(prev => {
      const nextColumns = [...prev];
      const dragIndex = nextColumns.findIndex(column => column.key === draggedColumnKey);
      const hoverIndex = nextColumns.findIndex(column => column.key === targetKey);

      if (dragIndex < 0 || hoverIndex < 0) {
        return prev;
      }

      const [dragColumn] = nextColumns.splice(dragIndex, 1);
      nextColumns.splice(hoverIndex, 0, dragColumn);
      return nextColumns;
    });
    setDraggedColumnKey(null);
  };

  const handleResize = columnKey => (e, { size }) => {
    setColumns(prev => prev.map(column => (
      column.key === columnKey ? { ...column, width: Math.max(size.width, 90) } : column
    )));
  };

  const toggleColumn = columnKey => {
    if (lockedVisibleColumnKeys.includes(columnKey)) {
      return;
    }

    setVisibleColumnKeys(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey);
      }
      return [...prev, columnKey];
    });
  };

  const selectedIds = () => selectedRowKeys.map(key => Number(key)).filter(Boolean);

  const studentCountOf = record => Number(record.studentCount || record.student_count || 0);

  const hasStudents = record => studentCountOf(record) > 0;

  const classroomSummary = records => records
    .map(record => `${record.code || record.name} (${studentCountOf(record)} học sinh)`)
    .join(', ');

  const warnCannotDeleteClassrooms = records => {
    message.warning(`Không thể xóa lớp đang có học sinh: ${classroomSummary(records)}`);
  };

  const runAction = async action => {
    setShowActionMenu(false);

    if (action === 'copy') {
      return;
    }

    if (action === 'delete' && !selectedRowKeys.length) {
      message.warning('Bạn chưa chọn dữ liệu');
      return;
    }

    if (action === 'delete') {
      const selectedRecords = classrooms.filter(classroom => selectedRowKeys.includes(classroom.key));
      const blockedRecords = selectedRecords.filter(hasStudents);
      if (blockedRecords.length) {
        warnCannotDeleteClassrooms(blockedRecords);
        return;
      }

      try {
        const response = await ClassroomService.massDelete(selectedIds());
        message.success(response.message || 'Đã xóa dữ liệu đã chọn');
        setSelectedRowKeys([]);
        loadClassrooms();
      } catch (error) {
        message.error(error.message || 'Thao tác thất bại');
      }
      return;
    }

    if (action === 'import') {
      message.info('Chức năng nhập file lớp học sẽ được nối ở bước import');
      return;
    }

    message.success('Đã xuất dữ liệu theo mẫu');
  };

  const handleDeleteOne = async record => {
    if (hasStudents(record)) {
      warnCannotDeleteClassrooms([record]);
      return;
    }

    try {
      const response = await ClassroomService.remove(record.id);
      message.success(response.message || 'Xóa thành công');
      setSelectedRowKeys(prev => prev.filter(key => key !== record.key));
      loadClassrooms();
    } catch (error) {
      message.error(error.message || 'Xóa thất bại');
    }
  };

  const handleCopyOne = () => {};

  const renderTextCell = (record, column, text) => {
    const cellKey = `${record.key}-${column.dataIndex}`;
    const expanded = expandedCells[cellKey];

    return (
      <Tooltip title={text} mouseEnterDelay={0.35}>
        <div
          className={`student-ellipsis-cell ${expanded ? 'expanded' : ''}`}
          onDoubleClick={() => toggleCell(record.key, column.dataIndex)}
        >
          {text}
        </div>
      </Tooltip>
    );
  };

  const handleAddNew = () => {
    history.push(`${APP_PREFIX_PATH}/classrooms/add`);
  };

  const ActionButtons = ({ record }) => {
    const deleteDisabled = hasStudents(record);

    return (
      <div className="student-table-actions classroom-table-actions">
        <Tooltip title={deleteDisabled ? 'Không thể xóa lớp đang có học sinh' : 'Xóa'}>
          <DeleteOutlined
            style={{
              color: deleteDisabled ? '#b8c0cc' : '#ff1f3d',
              cursor: deleteDisabled ? 'not-allowed' : 'pointer',
            }}
            onClick={deleteDisabled ? undefined : () => handleDeleteOne(record)}
          />
        </Tooltip>
        <Tooltip title="Sửa"><EditOutlined style={{ color: '#00c853' }} /></Tooltip>
        <Tooltip title="Nhân bản"><CopyOutlined style={{ color: '#5b6cff' }} onClick={() => handleCopyOne(record)} /></Tooltip>
        <Tooltip title="Tải xuống"><DownloadOutlined style={{ color: '#9aa4b2' }} /></Tooltip>
        <Tooltip title="Xem"><EyeOutlined style={{ color: '#0f2844' }} /></Tooltip>
      </div>
    );
  };

  const renderedColumns = (() => {
    const visibleColumns = columns.filter(column => visibleColumnKeys.includes(column.key));
    const contentColumns = visibleColumns.map(column => ({
      ...column,
      sorter: (a, b) => String(a[column.dataIndex] || '').localeCompare(String(b[column.dataIndex] || ''), 'vi'),
      render: (value, record) => renderTextCell(record, column, value),
      onHeaderCell: () => ({
        width: column.width,
        draggable: true,
        onResize: handleResize(column.key),
        onDragStart: () => setDraggedColumnKey(column.key),
        onDragOver: event => event.preventDefault(),
        onDrop: () => moveColumn(column.key),
      }),
    }));

    return [
      ...contentColumns,
      {
        title: 'Hành động',
        key: 'action',
        width: 128,
        fixed: 'right',
        align: 'center',
        render: (_, record) => <ActionButtons record={record} />
      }
    ];
  })();

  const filteredClassrooms = classrooms.filter(classroom => {
    const matchAdvanced =
      (!advancedSearch.stt || classroom.stt.toLowerCase().includes(advancedSearch.stt.toLowerCase())) &&
      (!advancedSearch.code || classroom.code.toLowerCase().includes(advancedSearch.code.toLowerCase())) &&
      (!advancedSearch.name || classroom.name.toLowerCase().includes(advancedSearch.name.toLowerCase())) &&
      (!advancedSearch.description || classroom.description.toLowerCase().includes(advancedSearch.description.toLowerCase()));

    return matchAdvanced;
  });

  const totalWidth = columns
    .filter(column => visibleColumnKeys.includes(column.key))
    .reduce((sum, column) => sum + column.width, 128);

  return (
    <Card className="management-content-card students-management-card classrooms-management-card" title={null}>
      <div className="student-toolbar">
        <div className="student-action-wrap">
          <Button className="student-action-trigger" onClick={() => setShowActionMenu(prev => !prev)}>
            Hành động
            <span className="student-action-caret">{showActionMenu ? <CaretUpOutlined /> : <CaretDownOutlined />}</span>
          </Button>
          {showActionMenu && (
            <div className="student-action-menu">
              <button type="button" onClick={() => runAction('import')}>Nhập dữ liệu từ file</button>
              <button type="button" onClick={() => runAction('export')}>Xuất dữ liệu đã chọn theo mẫu</button>
              <button type="button" onClick={() => runAction('copy')}>Sao chép dữ liệu đã chọn</button>
              <button type="button" className="danger" onClick={() => runAction('delete')}>Xóa dữ liệu đã chọn</button>
            </div>
          )}
        </div>

        <div className="student-toolbar-right">
          <div className="student-search-wrap">
            <span className="student-search-label">Tìm kiếm</span>
            <Input
              value={quickSearch}
              onChange={event => setQuickSearch(event.target.value)}
              onPressEnter={() => loadClassrooms(quickSearch)}
              prefix={<SearchOutlined onClick={() => loadClassrooms(quickSearch)} />}
              suffix={<SlidersOutlined onClick={() => setShowAdvancedSearch(prev => !prev)} />}
              placeholder="Tìm kiếm"
            />
            {showAdvancedSearch && (
              <div className="student-advanced-search classroom-advanced-search">
                <h4>Tìm kiếm nâng cao</h4>
                <label>STT:</label>
                <Input value={advancedSearch.stt} onChange={event => setAdvancedSearch(prev => ({ ...prev, stt: event.target.value }))} />
                <label>Mã lớp học:</label>
                <Input value={advancedSearch.code} onChange={event => setAdvancedSearch(prev => ({ ...prev, code: event.target.value }))} />
                <label>Tên lớp học:</label>
                <Input value={advancedSearch.name} onChange={event => setAdvancedSearch(prev => ({ ...prev, name: event.target.value }))} />
                <label>Mô tả:</label>
                <Input value={advancedSearch.description} onChange={event => setAdvancedSearch(prev => ({ ...prev, description: event.target.value }))} />
                <div className="student-advanced-actions">
                  <button type="button" className="student-advanced-reset" onClick={resetAdvancedSearch}>Đặt lại</button>
                  <button type="button" className="student-advanced-submit" onClick={() => setShowAdvancedSearch(false)}>
                    <SearchOutlined />
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button className="student-primary-btn" type="primary" onClick={handleAddNew}>THÊM MỚI</Button>
          <div className="student-column-filter-wrap">
            <Button className="student-filter-btn" type="primary" icon={<FilterOutlined />} onClick={() => setShowColumnFilter(prev => !prev)} />
            {showColumnFilter && (
              <div className="student-column-filter-panel">
                {columns.map(column => (
                  <label
                    key={column.key}
                    className={`student-column-filter-item ${lockedVisibleColumnKeys.includes(column.key) ? 'is-disabled' : ''}`}
                  >
                    <Checkbox
                      checked={visibleColumnKeys.includes(column.key)}
                      disabled={lockedVisibleColumnKeys.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                    />
                    <span>{column.title}</span>
                  </label>
                ))}
                <button type="button" className="student-column-apply" onClick={() => setShowColumnFilter(false)}>Áp dụng</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="student-table-wrap">
        <Table
          bordered
          loading={loading}
          className="students-data-table classrooms-data-table"
          components={{ header: { cell: ResizableTitle } }}
          columns={renderedColumns}
          dataSource={filteredClassrooms}
          rowSelection={{ fixed: true, selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            defaultPageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${String(total).padStart(2, '0')}`,
          }}
          scroll={{ x: totalWidth }}
          size="small"
        />
      </div>
    </Card>
  );
};

export default Classrooms;
