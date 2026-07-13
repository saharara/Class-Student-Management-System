import axios from 'axios';
import { API_BASE_URL } from 'configs/AppConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true,
});

api.interceptors.response.use(
  response => {
    const payload = response.data;

    if (typeof payload === 'string' && payload.trim().startsWith('<!DOCTYPE html>')) {
      return Promise.reject(new Error('Bạn cần đăng nhập Odoo trước khi tải dữ liệu'));
    }

    if (payload && payload.status === 'error') {
      const error = new Error(payload.message || 'Có lỗi xảy ra');
      error.payload = payload;
      return Promise.reject(error);
    }

    return payload;
  },
  error => Promise.reject(error)
);

export const unwrapRecords = response => {
  const data = response?.data;
  if (Array.isArray(data)) {
    return data;
  }
  return data?.records || [];
};

export default api;

