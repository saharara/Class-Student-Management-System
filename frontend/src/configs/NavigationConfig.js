import {
  BookOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { APP_PREFIX_PATH } from 'configs/AppConfig'

const navigationConfig = [
  {
    key: 'classrooms',
    path: `${APP_PREFIX_PATH}/classrooms`,
    title: 'sidenav.classrooms',
    icon: BookOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'students',
    path: `${APP_PREFIX_PATH}/students`,
    title: 'sidenav.students',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: []
  }
]

export default navigationConfig;
