import { Modal } from 'antd';

const confirmDiscardChanges = ({
  onOk,
  title = 'Hủy cập nhật?',
  content = 'Các thay đổi chưa lưu sẽ bị mất. Bạn có muốn hủy cập nhật không?',
  okText = 'Hủy cập nhật',
} = {}) => Modal.confirm({
  title,
  content,
  okText,
  cancelText: 'Tiếp tục chỉnh sửa',
  okType: 'danger',
  centered: true,
  onOk,
});

export default confirmDiscardChanges;
