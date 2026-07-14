import React, { useEffect, useState } from 'react';
import { Avatar, Button, Card, Checkbox, Input, message, Table, Tooltip } from 'antd';
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
import StudentService from 'services/StudentService';
import { unwrapRecords } from 'services/OdooApiService';

const HOBBY_OPTIONS = [
  { bit: 1, label: 'Chơi thể thao' },
  { bit: 2, label: 'Đọc sách' },
  { bit: 4, label: 'Âm nhạc' },
  { bit: 8, label: 'Vẽ tranh' },
  { bit: 16, label: 'Du lịch' },
  { bit: 32, label: 'Lập trình' },
];

const getHobbyLabels = mask => HOBBY_OPTIONS
  .filter(item => (mask & item.bit) === item.bit)
  .map(item => item.label);

const initialColumns = [
  { title: 'Mã học sinh', shortTitle: 'Mã', dataIndex: 'code', key: 'code', width: 120 },
  { title: 'Họ và tên', shortTitle: 'Họ tên', dataIndex: 'name', key: 'name', width: 165 },
  { title: 'Ảnh', dataIndex: 'avatar', key: 'avatar', width: 76, type: 'avatar' },
  { title: 'STT', dataIndex: 'stt', key: 'stt', width: 58, type: 'index' },
  { title: 'Ngày sinh', dataIndex: 'birthday', key: 'birthday', width: 132 },
  { title: 'Giới tính', dataIndex: 'gender', key: 'gender', width: 96 },
  { title: 'Quê quán', dataIndex: 'hometown', key: 'hometown', width: 120 },
  { title: 'Địa chỉ', dataIndex: 'address', key: 'address', width: 170 },
  { title: 'Sở thích', dataIndex: 'hobbyMask', key: 'hobbyMask', width: 150, type: 'hobbies' },
  { title: 'Màu tóc', dataIndex: 'hairColor', key: 'hairColor', width: 116, type: 'color' },
  { title: 'Email', dataIndex: 'email', key: 'email', width: 165 },
  { title: 'Facebook', dataIndex: 'facebook', key: 'facebook', width: 160 },
  { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone', width: 130 },
  { title: 'Tài khoản', dataIndex: 'username', key: 'username', width: 128 },
  { title: 'Mật khẩu', dataIndex: 'password', key: 'password', width: 120 },
  { title: 'Mô tả', dataIndex: 'description', key: 'description', width: 180 },
];

const defaultVisibleColumnKeys = [
  'code',
  'name',
  'avatar',
  'stt',
  'birthday',
  'gender',
  'hometown',
  'address',
  'hobbyMask',
  'hairColor',
  'email',
];

const mapStudent = (record, index) => {
  const attachment = record.attachment ? 'data:image/png;base64,' + record.attachment : '';
  const hairColor = record.hair_color || '';

  return {
    key: String(record.id),
    id: record.id,
    code: record.code || '',
    classCode: record.class_id ? String(record.class_id) : '',
    name: record.fullname || '',
    avatar: attachment,
    stt: String(record.id || index + 1).padStart(5, '0'),
    birthday: record.dob || '',
    gender: record.sex ? 'Nam' : 'Nữ',
    hometown: record.homecity || '',
    address: record.address || '',
    hobbyMask: Number(record.hobbies || 0),
    hairColor: { name: hairColor, value: hairColor || 'transparent' },
    email: record.email || '',
    facebook: record.facebook || '',
    phone: '',
    username: record.username || '',
    password: record.password ? '******' : '',
    description: record.description || '',
  };
};

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

const getColumnSortValue = (record, column) => {
  if (column.type === 'index') {
    return Number(record.key);
  }

  if (column.type === 'hobbies') {
    return getHobbyLabels(record[column.dataIndex]).join(', ');
  }

  if (column.type === 'color') {
    return record[column.dataIndex]?.name || '';
  }

  return record[column.dataIndex] || '';
};

const EMPTY_ADVANCED_SEARCH = {
  code: '',
  name: '',
  birthday: '',
  gender: '',
  classCode: '',
  email: '',
  facebook: '',
  hometown: '',
  address: '',
  hobby: '',
  hairColor: '',
  description: '',
};

const Students = () => {
  const history = useHistory();
  const [students, setStudents] = useState([]);
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

  const loadStudents = async (search = quickSearch) => {
    setLoading(true);
    try {
      const response = await StudentService.getPage(1, {
        size: 100,
        search: search || undefined,
        columnlist: JSON.stringify([
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
        ]),
      });
      setStudents(unwrapRecords(response).map(mapStudent));
    } catch (error) {
      message.error(error.message || 'Không tải được dữ liệu học sinh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents('');
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
      column.key === columnKey ? { ...column, width: Math.max(size.width, 72) } : column
    )));
  };

  const toggleColumn = columnKey => {
    setVisibleColumnKeys(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey);
      }
      return [...prev, columnKey];
    });
  };

  const selectedIds = () => selectedRowKeys.map(key => Number(key)).filter(Boolean);

  const runAction = async action => {
    setShowActionMenu(false);

    if (action === 'delete') {
      if (!selectedRowKeys.length) {
        message.warning('Bạn chưa chọn dữ liệu để xóa');
        return;
      }
      try {
        const response = await StudentService.massDelete(selectedIds());
        setSelectedRowKeys([]);
        message.success(response.message || 'Đã xóa dữ liệu đã chọn');
        loadStudents();
      } catch (error) {
        message.error(error.message || 'Xóa dữ liệu thất bại');
      }
      return;
    }

    if (action === 'copy') {
      return;
    }

    if (action === 'import') {
      message.info('Chức năng nhập file học sinh sẽ được nối ở bước import');
      return;
    }

    message.success('Đã xuất dữ liệu theo mẫu');
  };

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

  const handleDeleteOne = async record => {
    try {
      const response = await StudentService.remove(record.id);
      message.success(response.message || 'Xóa thành công');
      setSelectedRowKeys(prev => prev.filter(key => key !== record.key));
      loadStudents();
    } catch (error) {
      message.error(error.message || 'Xóa thất bại');
    }
  };

  const handleCopyOne = () => {};

  const ActionButtons = ({ record }) => (
    <div className="student-table-actions">
      <Tooltip title="Xóa"><DeleteOutlined style={{ color: '#ff1f3d' }} onClick={() => handleDeleteOne(record)} /></Tooltip>
      <Tooltip title="Sửa"><EditOutlined style={{ color: '#00c853' }} /></Tooltip>
      <Tooltip title="Nhân bản"><CopyOutlined style={{ color: '#5b6cff' }} onClick={() => handleCopyOne(record)} /></Tooltip>
      <Tooltip title="Tải xuống"><DownloadOutlined style={{ color: '#9aa4b2' }} /></Tooltip>
      <Tooltip title="Xem"><EyeOutlined style={{ color: '#0f2844' }} /></Tooltip>
    </div>
  );

  const renderedColumns = (() => {
    const visibleColumns = columns.filter(column => visibleColumnKeys.includes(column.key));
    const contentColumns = visibleColumns.map(column => ({
      ...column,
      title: column.shortTitle || column.title,
      sorter: (a, b) => String(getColumnSortValue(a, column)).localeCompare(String(getColumnSortValue(b, column)), 'vi'),
      render: (value, record, index) => {
        if (column.type === 'index') {
          return <span className="student-index-cell">{index + 1}</span>;
        }

        if (column.type === 'avatar') {
          return <Avatar size={34} src={value} />;
        }

        if (column.type === 'hobbies') {
          return renderTextCell(record, column, getHobbyLabels(value).join(', '));
        }

        if (column.type === 'color') {
          return (
            <Tooltip title={value?.name}>
              <div className="student-color-cell" onDoubleClick={() => toggleCell(record.key, column.dataIndex)}>
                <span className="student-color-swatch" style={{ backgroundColor: value?.value }} />
                <span>{value?.name}</span>
              </div>
            </Tooltip>
          );
        }

        return renderTextCell(record, column, value);
      },
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
        width: 154,
        fixed: 'right',
        align: 'center',
        render: (_, record) => <ActionButtons record={record} />
      }
    ];
  })();

  const filteredStudents = students.filter(student => {
    const keyword = quickSearch.trim().toLowerCase();
    const hobbies = getHobbyLabels(student.hobbyMask).join(', ').toLowerCase();
    const allText = [
      student.code,
      student.name,
      student.birthday,
      student.gender,
      student.hometown,
      student.address,
      hobbies,
      student.hairColor.name,
      student.email,
      student.facebook,
      student.phone,
      student.username,
      student.description,
    ].join(' ').toLowerCase();

    const matchQuick = !keyword || allText.includes(keyword);
    const matchAdvanced =
      (!advancedSearch.code || student.code.toLowerCase().includes(advancedSearch.code.toLowerCase())) &&
      (!advancedSearch.name || student.name.toLowerCase().includes(advancedSearch.name.toLowerCase())) &&
      (!advancedSearch.birthday || student.birthday.includes(advancedSearch.birthday)) &&
      (!advancedSearch.gender || student.gender === advancedSearch.gender) &&
      (!advancedSearch.classCode || student.classCode.toLowerCase().includes(advancedSearch.classCode.toLowerCase())) &&
      (!advancedSearch.email || student.email.toLowerCase().includes(advancedSearch.email.toLowerCase())) &&
      (!advancedSearch.facebook || student.facebook.toLowerCase().includes(advancedSearch.facebook.toLowerCase())) &&
      (!advancedSearch.hometown || student.hometown.toLowerCase().includes(advancedSearch.hometown.toLowerCase())) &&
      (!advancedSearch.address || student.address.toLowerCase().includes(advancedSearch.address.toLowerCase())) &&
      (!advancedSearch.hobby || hobbies.includes(advancedSearch.hobby.toLowerCase())) &&
      (!advancedSearch.hairColor || student.hairColor.name.toLowerCase().includes(advancedSearch.hairColor.toLowerCase())) &&
      (!advancedSearch.description || student.description.toLowerCase().includes(advancedSearch.description.toLowerCase()));

    return matchQuick && matchAdvanced;
  });

  const totalWidth = columns
    .filter(column => visibleColumnKeys.includes(column.key))
    .reduce((sum, column) => sum + column.width, 154);

  return (
    <Card className="management-content-card students-management-card" title={null}>
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
              onPressEnter={() => loadStudents()}
              prefix={<SearchOutlined />}
              suffix={<SlidersOutlined onClick={() => setShowAdvancedSearch(prev => !prev)} />}
              placeholder="Tìm kiếm"
            />
            {showAdvancedSearch && (
              <div className="student-advanced-search">
                <h4>Tìm kiếm nâng cao</h4>
                <label>Mã học sinh:</label>
                <Input value={advancedSearch.code} onChange={event => setAdvancedSearch(prev => ({ ...prev, code: event.target.value }))} />
                <label>Họ và tên:</label>
                <Input value={advancedSearch.name} onChange={event => setAdvancedSearch(prev => ({ ...prev, name: event.target.value }))} />
                <label>Ngày sinh:</label>
                <Input type="date" value={advancedSearch.birthday} onChange={event => setAdvancedSearch(prev => ({ ...prev, birthday: event.target.value }))} />
                <label>Giới tính:</label>
                <div className="student-advanced-radio-row">
                  <label><input type="radio" name="student-gender" checked={advancedSearch.gender === 'Nam'} onChange={() => setAdvancedSearch(prev => ({ ...prev, gender: 'Nam' }))} /> Nam</label>
                  <label><input type="radio" name="student-gender" checked={advancedSearch.gender === 'Nữ'} onChange={() => setAdvancedSearch(prev => ({ ...prev, gender: 'Nữ' }))} /> Nữ</label>
                </div>
                <label>Mã lớp học:</label>
                <Input value={advancedSearch.classCode} onChange={event => setAdvancedSearch(prev => ({ ...prev, classCode: event.target.value }))} />
                <label>Email:</label>
                <Input value={advancedSearch.email} onChange={event => setAdvancedSearch(prev => ({ ...prev, email: event.target.value }))} />
                <label>Facebook:</label>
                <Input value={advancedSearch.facebook} onChange={event => setAdvancedSearch(prev => ({ ...prev, facebook: event.target.value }))} />
                <label>Quê quán:</label>
                <Input value={advancedSearch.hometown} onChange={event => setAdvancedSearch(prev => ({ ...prev, hometown: event.target.value }))} />
                <label>Địa chỉ:</label>
                <Input value={advancedSearch.address} onChange={event => setAdvancedSearch(prev => ({ ...prev, address: event.target.value }))} />
                <label>Sở thích:</label>
                <Input value={advancedSearch.hobby} onChange={event => setAdvancedSearch(prev => ({ ...prev, hobby: event.target.value }))} />
                <label>Màu tóc:</label>
                <Input value={advancedSearch.hairColor} onChange={event => setAdvancedSearch(prev => ({ ...prev, hairColor: event.target.value }))} />
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
          <Button className="student-primary-btn" type="primary" onClick={() => history.push(`${APP_PREFIX_PATH}/students/add`)}>THÊM MỚI</Button>
          <div className="student-column-filter-wrap">
            <Button className="student-filter-btn" type="primary" icon={<FilterOutlined />} onClick={() => setShowColumnFilter(prev => !prev)} />
            {showColumnFilter && (
              <div className="student-column-filter-panel">
                {columns.map(column => (
                  <label key={column.key} className="student-column-filter-item">
                    <Checkbox checked={visibleColumnKeys.includes(column.key)} onChange={() => toggleColumn(column.key)} />
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
          className="students-data-table"
          components={{ header: { cell: ResizableTitle } }}
          columns={renderedColumns}
          dataSource={filteredStudents}
          loading={loading}
          rowSelection={{ fixed: true, selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${String(total).padStart(2, '0')}`,
          }}
          scroll={{ x: totalWidth }}
          size="small"
        />
      </div>
    </Card>
  )
}

export default Students;
