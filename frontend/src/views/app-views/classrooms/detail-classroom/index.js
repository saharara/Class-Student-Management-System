import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Input, message, Table, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PrinterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useHistory, useParams } from 'react-router-dom';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import ClassroomService from 'services/ClassroomService';
import StudentService from 'services/StudentService';
import { unwrapRecords } from 'services/OdooApiService';
import { getHobbyLabels, normalizeHobbyOptions } from 'constants/HobbyOptions';
import confirmDelete from 'utils/confirmDelete';

import './detailClassroom.css';

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

const mapStudent = (record, index) => {
  const hairColor = record.hair_color || '';

  return {
    key: String(record.id),
    id: record.id,
    stt: index + 1,
    code: record.code || '',
    name: record.fullname || '',
    avatar: record.attachment ? `data:image/png;base64,${record.attachment}` : '',
    birthday: record.dob || '',
    gender: record.sex ? 'Nam' : 'Nữ',
    hometown: record.homecity || '',
    address: record.address || '',
    hobbyMask: Number(record.hobbies || 0),
    hairColor: { name: hairColor, value: hairColor || 'transparent' },
    email: record.email || '',
    facebook: record.facebook || '',
    classId: getClassId(record.class_id),
  };
};

const normalizeLink = value => {
  if (!value) {
    return '';
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const DetailClassroom = () => {
  const history = useHistory();
  const { id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [hobbyOptions, setHobbyOptions] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const [classResponse, studentResponse, hobbyResponse] = await Promise.all([
        ClassroomService.getById(id, {
          columnlist: JSON.stringify(['id', 'code', 'name', 'description', 'student_count']),
        }),
        StudentService.getAll({
          columnlist: JSON.stringify(STUDENT_COLUMNS),
        }),
        StudentService.getHobbies(),
      ]);

      const classData = classResponse?.data || {};
      const nextHobbyOptions = normalizeHobbyOptions(unwrapRecords(hobbyResponse));
      const nextStudents = unwrapRecords(studentResponse)
        .filter(record => getClassId(record.class_id) === Number(id))
        .map(mapStudent);

      setClassroom(classData);
      setHobbyOptions(nextHobbyOptions);
      setStudents(nextStudents);
      setSelectedRowKeys(prev => prev.filter(key => nextStudents.some(student => student.key === key)));
    } catch (error) {
      message.error(error.message || 'Không tải được chi tiết lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredStudents = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return students;
    }

    return students.filter(student => {
      const hobbies = getHobbyLabels(student.hobbyMask, hobbyOptions).join(', ');
      const text = [
        student.stt,
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
      ].join(' ').toLowerCase();

      return text.includes(keyword);
    });
  }, [hobbyOptions, searchText, students]);

  const handleDeleteClassroom = () => {
    if (students.length || Number(classroom?.student_count || 0) > 0) {
      message.warning('Không thể xóa lớp đang có học sinh');
      return;
    }

    confirmDelete({
      content: `Bạn có chắc chắn muốn xóa lớp học ${classroom?.code || classroom?.name || ''} không?`,
      onOk: async () => {
        try {
          const response = await ClassroomService.remove(id);
          message.success(response.message || 'Xóa lớp học thành công');
          history.push(`${APP_PREFIX_PATH}/classrooms`);
        } catch (error) {
          message.error(error.message || 'Xóa lớp học thất bại');
        }
      },
    });
  };
  const handleCopyClassroom = () => {
    history.push(`${APP_PREFIX_PATH}/classrooms/${id}/copy`);
  };

  const handleCopyStudent = record => {
    history.push(`${APP_PREFIX_PATH}/students/${record.id}/copy`);
  };

  const handleDeleteStudent = record => {
    confirmDelete({
      content: `Bạn có chắc chắn muốn xóa học sinh ${record.code || record.name || ''} không?`,
      onOk: async () => {
        try {
          const response = await StudentService.remove(record.id);
          message.success(response.message || 'Xóa học sinh thành công');
          await loadDetail();
        } catch (error) {
          message.error(error.message || 'Xóa học sinh thất bại');
        }
      },
    });
  };

  const handleDeleteSelectedStudents = () => {
    const ids = selectedRowKeys.map(key => Number(key)).filter(Boolean);

    if (!ids.length) {
      message.warning('Bạn chưa chọn học sinh để xóa');
      return;
    }

    confirmDelete({
      content: `Bạn có chắc chắn muốn xóa ${ids.length} học sinh đã chọn không?`,
      onOk: async () => {
        try {
          const response = await StudentService.massDelete(ids);
          message.success(response.message || 'Đã xóa học sinh đã chọn');
          setSelectedRowKeys([]);
          await loadDetail();
        } catch (error) {
          message.error(error.message || 'Xóa học sinh đã chọn thất bại');
        }
      },
    });
  };

  const featurePending = label => {
    message.info(`${label} sẽ được nối ở bước tiếp theo`);
  };

  const classroomHasStudents = students.length > 0 || Number(classroom?.student_count || 0) > 0;

  const studentColumns = [
    {
      title: 'Ảnh',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 68,
      align: 'center',
      render: (value, record) => <Avatar size={34} src={value}>{record.name.slice(0, 1)}</Avatar>,
    },
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 64,
      align: 'center',
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 110,
    },
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'birthday',
      key: 'birthday',
      width: 116,
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 90,
    },
    {
      title: 'Quê quán',
      dataIndex: 'hometown',
      key: 'hometown',
      width: 120,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 170,
      render: value => <Tooltip title={value}><span className="detail-classroom-ellipsis">{value}</span></Tooltip>,
    },
    {
      title: 'Sở thích',
      dataIndex: 'hobbyMask',
      key: 'hobbyMask',
      width: 145,
      render: value => {
        const labels = getHobbyLabels(value, hobbyOptions).join(', ');
        return <Tooltip title={labels}><span className="detail-classroom-ellipsis">{labels}</span></Tooltip>;
      },
    },
    {
      title: 'Màu tóc',
      dataIndex: 'hairColor',
      key: 'hairColor',
      width: 112,
      render: value => (
        <span className="detail-classroom-color">
          <span className="detail-classroom-color-dot" style={{ backgroundColor: value.value }} />
          {value.name}
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 170,
      render: value => <Tooltip title={value}><span className="detail-classroom-ellipsis">{value}</span></Tooltip>,
    },
    {
      title: 'Facebook',
      dataIndex: 'facebook',
      key: 'facebook',
      width: 130,
      render: value => (value ? (
        <a href={normalizeLink(value)} target="_blank" rel="noreferrer">facebook</a>
      ) : ''),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 142,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <div className="detail-classroom-table-actions">
          <Tooltip title="Xóa"><DeleteOutlined className="danger" onClick={() => handleDeleteStudent(record)} /></Tooltip>
          <Tooltip title="Sửa"><EditOutlined className="success" onClick={() => history.push(`${APP_PREFIX_PATH}/students/${record.id}/edit`)} /></Tooltip>
          <Tooltip title="Nhân bản"><CopyOutlined className="primary" onClick={() => handleCopyStudent(record)} /></Tooltip>
          <Tooltip title="Tải xuống"><DownloadOutlined className="muted" onClick={() => featurePending('Tải xuống học sinh')} /></Tooltip>
          <Tooltip title="Xem"><EyeOutlined className="dark" onClick={() => history.push(APP_PREFIX_PATH + '/students/' + record.id)} /></Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="detail-classroom-page">
      <button
        type="button"
        className="detail-classroom-back-btn app-back-arrow-btn"
        onClick={() => history.push(`${APP_PREFIX_PATH}/classrooms`)}
        aria-label="Quay lại"
      >
        <ArrowLeftOutlined />
      </button>

      <div className="detail-classroom-heading">
        <h1>Chi tiết lớp học</h1>
        <div className="detail-classroom-actions">
          <Tooltip title={classroomHasStudents ? 'Không thể xóa lớp đang có học sinh' : 'Xóa lớp học'}>
            <DeleteOutlined
              className={`danger ${classroomHasStudents ? 'is-disabled' : ''}`}
              onClick={classroomHasStudents ? undefined : handleDeleteClassroom}
            />
          </Tooltip>
          <Tooltip title="Sửa lớp học">
            <EditOutlined className="success" onClick={() => history.push(`${APP_PREFIX_PATH}/classrooms/${id}/edit`)} />
          </Tooltip>
          <Tooltip title="Nhân bản lớp học">
            <CopyOutlined className="primary" onClick={handleCopyClassroom} />
          </Tooltip>
          <Tooltip title="In">
            <PrinterOutlined className="dark" onClick={() => window.print()} />
          </Tooltip>
          <Tooltip title="Tải xuống">
            <DownloadOutlined className="muted" onClick={() => featurePending('Tải xuống lớp học')} />
          </Tooltip>
        </div>
      </div>

      <div className="detail-classroom-info">
        <div className="detail-classroom-info-label">ID lớp học</div>
        <div className="detail-classroom-info-value">{classroom?.id || id}</div>
        <div className="detail-classroom-info-label">Mã lớp học</div>
        <div className="detail-classroom-info-value">{classroom?.code || ''}</div>
        <div className="detail-classroom-info-label">Tên lớp học</div>
        <div className="detail-classroom-info-value">{classroom?.name || ''}</div>
        <div className="detail-classroom-info-label detail-classroom-description-label">Mô tả lớp học</div>
        <div className="detail-classroom-info-value detail-classroom-description-value">
          {classroom?.description || ''}
        </div>
      </div>

      <div className="detail-classroom-student-section">
        <h2>Danh sách học sinh</h2>

        <div className="detail-classroom-student-toolbar">
          <Button danger onClick={handleDeleteSelectedStudents}>
            Xóa học sinh đã chọn
          </Button>
          <div className="student-toolbar-right detail-classroom-toolbar-right">
            <div className="student-search-wrap">
              <span className="student-search-label">Tìm kiếm</span>
              <Input
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
                placeholder="Tìm kiếm"
                prefix={<SearchOutlined />}
              />
            </div>
            <Button className="student-primary-btn" type="primary" onClick={() => history.push(`${APP_PREFIX_PATH}/students/add`)}>
              Thêm học sinh
            </Button>
          </div>
        </div>

        <Table
          bordered
          loading={loading}
          className="detail-classroom-students-table"
          columns={studentColumns}
          dataSource={filteredStudents}
          rowSelection={{
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: keys => setSelectedRowKeys(keys.map(String)),
          }}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: total => `${total} học sinh`,
          }}
          scroll={{ x: 1590 }}
          size="small"
        />
      </div>
    </div>
  );
};

export default DetailClassroom;
