import { Modal } from 'antd';

const confirmDelete = ({
  title = 'Xác nhận xóa',
  content = 'Bạn có chắc chắn muốn xóa dữ liệu này không?',
  onOk,
} = {}) => Modal.confirm({
  title,
  content,
  okText: 'Xóa',
  cancelText: 'Hủy',
  okType: 'danger',
  centered: true,
  onOk,
});

export default confirmDelete;