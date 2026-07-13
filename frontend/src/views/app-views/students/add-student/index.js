import React, { useState } from 'react';
import { Button, Input, Popover, Select } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { ChromePicker } from 'react-color';

import './addStudent.css';

const { TextArea } = Input;
const { Option } = Select;

const HAIR_COLOR_OPTIONS = [
  { value: 'black', label: 'Đen', color: '#111111' },
  { value: 'dark-brown', label: 'Nâu đen', color: '#3b2a23' },
  { value: 'brown', label: 'Nâu', color: '#7a4a24' },
  { value: 'chestnut', label: 'Hạt dẻ', color: '#8b5a2b' },
  { value: 'yellow', label: 'Vàng', color: '#f2c94c' },
  { value: 'red', label: 'Đỏ', color: '#d93025' },
  { value: 'gray', label: 'Xám', color: '#8c8c8c' },
  { value: 'white', label: 'Trắng', color: '#f5f5f5' },
];

const AddStudent = () => {
  const history = useHistory();

  const [hairColor, setHairColor] = useState(null);
  const [showHairPicker, setShowHairPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentHairColor = hairColor?.color || '#111111';

  const hairColorPicker = (
    <div className="add-student-color-popover-content">
      <ChromePicker
        color={currentHairColor}
        disableAlpha
        onChange={(color) =>
          setHairColor({
            value: 'custom',
            label: 'Tùy chọn',
            color: color.hex,
          })
        }
        styles={{
          default: {
            picker: {
              width: 260,
              boxShadow: 'none',
              fontFamily: 'Arial, Roboto, Segoe UI, Tahoma, sans-serif',
            },
          },
        }}
      />

      <div className="hair-color-suggestion-title">Màu quen thuộc</div>

      <div className="hair-color-suggestions">
        {HAIR_COLOR_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            className="hair-color-suggestion"
            onClick={() => {
              setHairColor(item);
              setShowHairPicker(false);
            }}
          >
            <span
              className="hair-color-dot"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  const handleSave = () => {
    console.log('Lưu học sinh');
  };

  const handleSaveAndContinue = () => {
    console.log('Lưu và tiếp tục');
  };

  return (
    <div className="add-student-page">
      <button
        type="button"
        className="add-student-back-btn"
        onClick={() => history.goBack()}
        aria-label="Quay lại"
      >
        <ArrowLeftOutlined />
      </button>
      <h1 className="add-student-title">Thêm học sinh mới</h1>
      <div className="add-student-frame">
        <div className="add-student-top">
          <div className="add-student-photo">
            <div className="add-student-photo-box" />

            <Button className="add-student-upload-btn" type="primary">
              Upload
            </Button>

            <div className="add-student-photo-label">Ảnh</div>
          </div>

          <div className="add-student-top-fields">
            <label className="add-student-field code-field">
              <span>
                Mã học sinh <em className="req-star">*</em>
              </span>
              <Input placeholder="Mã học sinh*" />
            </label>

            <label className="add-student-field name-field">
              <span>
                Họ và tên <em className="req-star">*</em>
              </span>
              <Input placeholder="Họ và tên học sinh*" />
            </label>

            <label className="add-student-field birthday-field">
              <span>
                Ngày sinh <em className="req-star">*</em>
              </span>
              <Input placeholder="yyyy - mm - dd*" />
            </label>

            <div className="add-student-gender">
              <span>
                Giới tính <em className="req-star">*</em>
              </span>

              <div className="add-student-gender-box">
                <label>
                  <input type="radio" name="add-student-gender" />
                  Nam
                </label>

                <label>
                  <input
                    type="radio"
                    name="add-student-gender"
                    defaultChecked
                  />
                  Nữ
                </label>
              </div>
            </div>

            <div className="add-student-class-row">
              <div className="add-student-class-field">
                <span>
                  Lớp học <em className="req-star">*</em>
                </span>

                <Select className="add-student-select" placeholder="Lớp học*">
                  <Option value="10A1">10A1</Option>
                  <Option value="10A2">10A2</Option>
                  <Option value="10A3">10A3</Option>
                </Select>
              </div>

              <Button
                className="add-student-plus-btn"
                type="primary"
                icon={<PlusOutlined />}
              />
            </div>

            <label className="add-student-field email-field">
              <span>Email</span>
              <Input placeholder="Email học sinh" />
            </label>

            <label className="add-student-field facebook-field">
              <span>Facebook</span>
              <Input placeholder="Link Facebook học sinh" />
            </label>

            <label className="add-student-field account-field">
              <span>Tài khoản</span>
              <Input placeholder="Tài khoản" />
            </label>

            <label className="add-student-field password-field">
              <span>
                Mật khẩu <em className="req-star">*</em>
              </span>

              <div className="add-student-password-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="add-student-password-input"
                  placeholder="Mật khẩu"
                />

                <button
                  type="button"
                  className="add-student-password-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Ẩn hiện mật khẩu"
                >
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
            </label>
          </div>
        </div>

        <div className="add-student-wide-fields">
          <label className="add-student-field full">
            <span>Quê quán</span>
            <Input placeholder="Quê quán" />
          </label>

          <label className="add-student-field full">
            <span>Địa chỉ</span>
            <Input placeholder="Địa chỉ" />
          </label>

          <div className="add-student-lower-grid">
            <label className="add-student-field hobby-field">
              <span>Sở thích</span>

              <Select
                className="add-student-select"
                placeholder="Sở thích"
                mode="multiple"
              >
                <Option value="sport">Chơi thể thao</Option>
                <Option value="book">Đọc sách</Option>
                <Option value="music">Âm nhạc</Option>
                <Option value="paint">Vẽ tranh</Option>
                <Option value="travel">Du lịch</Option>
                <Option value="code">Lập trình</Option>
              </Select>
            </label>

            <div className="add-student-field hair-field">
              <span>Màu tóc</span>

              <Popover
                overlayClassName="add-student-color-popover"
                content={hairColorPicker}
                trigger="click"
                visible={showHairPicker}
                onVisibleChange={setShowHairPicker}
                placement="bottomLeft"
              >
                <button
                  type="button"
                  className="add-student-color-picker-trigger"
                >
                  {hairColor ? (
                    <span className="hair-color-option">
                      <span
                        className="hair-color-dot"
                        style={{ backgroundColor: hairColor.color }}
                      />
                      <span>{hairColor.label}</span>
                      <span className="hair-color-hex">
                        {hairColor.color}
                      </span>
                    </span>
                  ) : (
                    <span className="add-student-color-placeholder">
                      Màu tóc
                    </span>
                  )}
                </button>
              </Popover>
            </div>
          </div>

          <label className="add-student-field full add-student-description">
            <span>Mô tả</span>
            <TextArea placeholder="Mô tả học sinh" rows={4} />
          </label>

          <div className="add-student-actions">
            <Button
              type="primary"
              className="add-student-save-btn"
              onClick={handleSave}
            >
              Lưu
            </Button>

            <Button
              className="add-student-save-continue-btn"
              onClick={handleSaveAndContinue}
            >
              Lưu và tiếp tục
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;