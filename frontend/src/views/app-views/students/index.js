import React, { useState } from 'react';
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

const initialStudents = [
  {
    key: '1',
    code: 'SV001',
    classCode: '10A1',
    name: 'Phạm Ngọc Huyền',
    avatar: '/img/avatars/thumb-1.jpg',
    birthday: '2005-12-22',
    gender: 'Nữ',
    hometown: 'Hà Nội',
    address: 'Tổ 38A, Phường Thanh Xuân Trung, Thanh Xuân, Hà Nội',
    hobbyMask: 1 | 2 | 4,
    hairColor: { name: 'Đen', value: '#111111' },
    email: 'huyenpham21205@gmail.com',
    facebook: 'fb.com/huyen.pham',
    phone: '0912345678',
    username: 'huyenpn',
    password: '******',
    description: 'Lớp trưởng, học lực tốt, tham gia tích cực các hoạt động ngoại khóa.'
  },
  {
    key: '2',
    code: 'SV002',
    classCode: '10A1',
    name: 'Nguyễn Minh Anh',
    avatar: '/img/avatars/thumb-2.jpg',
    birthday: '2005-04-18',
    gender: 'Nữ',
    hometown: 'Hải Phòng',
    address: 'Số 21, đường Lạch Tray, Ngô Quyền, Hải Phòng',
    hobbyMask: 2 | 8 | 16,
    hairColor: { name: 'Nâu', value: '#7a4a24' },
    email: 'minhanh@example.com',
    facebook: 'fb.com/minh.anh',
    phone: '0988123456',
    username: 'minhanh',
    password: '******',
    description: 'Yêu thích vẽ tranh và đọc sách, thường phụ trách trang trí lớp.'
  },
  {
    key: '3',
    code: 'SV003',
    classCode: '10A1',
    name: 'Trần Đức Nam',
    avatar: '/img/avatars/thumb-3.jpg',
    birthday: '2004-09-02',
    gender: 'Nam',
    hometown: 'Đà Nẵng',
    address: 'Khu đô thị Hòa Xuân, Cẩm Lệ, Đà Nẵng',
    hobbyMask: 1 | 32,
    hairColor: { name: 'Đen', value: '#151515' },
    email: 'ducnam@example.com',
    facebook: 'fb.com/ducnam.tran',
    phone: '0909123123',
    username: 'ducnam',
    password: '******',
    description: 'Có nền tảng lập trình tốt, tham gia câu lạc bộ tin học.'
  },
  {
    key: '4',
    code: 'SV004',
    classCode: '10A1',
    name: 'Lê Thu Hà',
    avatar: '/img/avatars/thumb-4.jpg',
    birthday: '2005-07-11',
    gender: 'Nữ',
    hometown: 'Hà Nam',
    address: 'Phủ Lý, Hà Nam',
    hobbyMask: 4 | 8,
    hairColor: { name: 'Nâu sáng', value: '#b8743b' },
    email: 'thuha@example.com',
    facebook: 'fb.com/thuha.le',
    phone: '0977001122',
    username: 'thuha',
    password: '******',
    description: 'Thích âm nhạc và vẽ, có khả năng thuyết trình tốt.'
  },
  {
    key: '5',
    code: 'SV005',
    classCode: '10A1',
    name: 'Đỗ Gia Bảo',
    avatar: '/img/avatars/thumb-5.jpg',
    birthday: '2004-01-30',
    gender: 'Nam',
    hometown: 'Nam Định',
    address: 'Mỹ Lộc, Nam Định',
    hobbyMask: 1 | 32,
    hairColor: { name: 'Đen', value: '#000000' },
    email: 'giabao@example.com',
    facebook: 'fb.com/giabao.do',
    phone: '0966332211',
    username: 'giabao',
    password: '******',
    description: 'Năng động, thích cầu lông và các hoạt động thi đấu nhóm.'
  },
  {
    key: '6',
    code: 'SV006',
    classCode: '10A1',
    name: 'Vũ Khánh Linh',
    avatar: '/img/avatars/thumb-6.jpg',
    birthday: '2005-03-08',
    gender: 'Nữ',
    hometown: 'Bắc Ninh',
    address: 'Từ Sơn, Bắc Ninh',
    hobbyMask: 4 | 16,
    hairColor: { name: 'Nâu đen', value: '#3b2a23' },
    email: 'khanhlinh@example.com',
    facebook: 'fb.com/khanhlinh.vu',
    phone: '0944556677',
    username: 'khanhlinh',
    password: '******',
    description: 'Yêu thích du lịch, hay hỗ trợ lớp trong các buổi sinh hoạt tập thể.'
  },
  {
    key: '7',
    code: 'SV007',
    classCode: '10A1',
    name: 'Hoàng Việt Anh',
    avatar: '/img/avatars/thumb-7.jpg',
    birthday: '2004-10-19',
    gender: 'Nam',
    hometown: 'Nghệ An',
    address: 'Thành phố Vinh, Nghệ An',
    hobbyMask: 1 | 16,
    hairColor: { name: 'Đen', value: '#171717' },
    email: 'vietanh@example.com',
    facebook: 'fb.com/vietanh.hoang',
    phone: '0933445566',
    username: 'vietanh',
    password: '******',
    description: 'Thích chạy bộ và các hoạt động thể thao ngoài trời.'
  },
  {
    key: '8',
    code: 'SV008',
    classCode: '10A1',
    name: 'Bùi Phương Thảo',
    avatar: '/img/avatars/thumb-8.jpg',
    birthday: '2005-06-25',
    gender: 'Nữ',
    hometown: 'Thái Bình',
    address: 'Quỳnh Phụ, Thái Bình',
    hobbyMask: 2 | 4 | 16,
    hairColor: { name: 'Hạt dẻ', value: '#8b5a2b' },
    email: 'phuongthao@example.com',
    facebook: 'fb.com/phuongthao.bui',
    phone: '0922334455',
    username: 'phuongthao',
    password: '******',
    description: 'Chăm chỉ, thích đọc sách, âm nhạc và các chuyến trải nghiệm.'
  },
  {
    key: '9',
    code: 'SV009',
    classCode: '10A1',
    name: 'Phan Tuấn Kiệt',
    avatar: '/img/avatars/thumb-9.jpg',
    birthday: '2004-12-01',
    gender: 'Nam',
    hometown: 'TP. Hồ Chí Minh',
    address: 'Quận Bình Thạnh, TP. Hồ Chí Minh',
    hobbyMask: 8 | 32,
    hairColor: { name: 'Đen', value: '#101010' },
    email: 'tuankiet@example.com',
    facebook: 'fb.com/tuankiet.phan',
    phone: '0911002233',
    username: 'tuankiet',
    password: '******',
    description: 'Có tư duy logic tốt, thích nhiếp ảnh và lập trình web.'
  },
  {
    key: '10',
    code: 'SV010',
    classCode: '10A2',
    name: 'Ngô Bảo Châu',
    avatar: '/img/avatars/thumb-10.jpg',
    birthday: '2005-08-14',
    gender: 'Nữ',
    hometown: 'Thanh Hóa',
    address: 'Đông Sơn, Thanh Hóa',
    hobbyMask: 2 | 16,
    hairColor: { name: 'Nâu hạt dẻ', value: '#7b4a21' },
    email: 'baochau@example.com',
    facebook: 'fb.com/baochau.ngo',
    phone: '0909887766',
    username: 'baochau',
    password: '******',
    description: 'Học tập ổn định, thích đọc sách và tham gia các chuyến dã ngoại.'
  },
  {
    key: '11',
    code: 'SV011',
    classCode: '10A2',
    name: 'Đặng Minh Quân',
    avatar: '/img/avatars/thumb-11.jpg',
    birthday: '2004-05-09',
    gender: 'Nam',
    hometown: 'Quảng Ninh',
    address: 'Hạ Long, Quảng Ninh',
    hobbyMask: 1 | 4 | 32,
    hairColor: { name: 'Đen', value: '#0f0f0f' },
    email: 'minhquan@example.com',
    facebook: 'fb.com/minhquan.dang',
    phone: '0933778899',
    username: 'minhquan',
    password: '******',
    description: 'Năng nổ trong hoạt động nhóm, thích thể thao, âm nhạc và lập trình.'
  },
  {
    key: '12',
    code: 'SV012',
    classCode: '10A3',
    name: 'Mai Anh Thư',
    avatar: '/img/avatars/thumb-12.jpg',
    birthday: '2005-11-03',
    gender: 'Nữ',
    hometown: 'Huế',
    address: 'Phú Nhuận, thành phố Huế',
    hobbyMask: 4 | 8 | 16,
    hairColor: { name: 'Nâu sáng', value: '#a96b32' },
    email: 'anhthu@example.com',
    facebook: 'fb.com/anhthu.mai',
    phone: '0977889900',
    username: 'anhthu',
    password: '******',
    description: 'Yêu thích nghệ thuật, có khả năng tổ chức và hỗ trợ truyền thông lớp.'
  }
];

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
  const [students, setStudents] = useState(initialStudents);
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

  const runAction = action => {
    setShowActionMenu(false);

    if (action === 'delete') {
      if (!selectedRowKeys.length) {
        message.warning('Bạn chưa chọn dữ liệu để xóa');
        return;
      }
      setStudents(prev => prev.filter(student => !selectedRowKeys.includes(student.key)));
      setSelectedRowKeys([]);
      message.success('Đã xóa dữ liệu đã chọn');
      return;
    }

    if (action === 'copy') {
      message.success('Đã sao chép dữ liệu đã chọn');
      return;
    }

    if (action === 'import') {
      message.info('Chức năng nhập file đang chờ kết nối backend');
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

  const ActionButtons = () => (
    <div className="student-table-actions">
      <Tooltip title="Xóa"><DeleteOutlined /></Tooltip>
      <Tooltip title="Sửa"><EditOutlined /></Tooltip>
      <Tooltip title="Nhân bản"><CopyOutlined /></Tooltip>
      <Tooltip title="Tải xuống"><DownloadOutlined /></Tooltip>
      <Tooltip title="Xem"><EyeOutlined /></Tooltip>
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
        render: () => <ActionButtons />
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