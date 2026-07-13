import React from 'react';
import { Card, Empty } from 'antd';

const Classrooms = () => {
  return (
    <Card className="management-content-card" title="Quản lý lớp học">
      <Empty description="Chưa có dữ liệu lớp học" />
    </Card>
  )
}

export default Classrooms;