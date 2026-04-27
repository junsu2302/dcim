import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getDevices = () => axios.get(`${API_URL}/devices/`);
export const getDevice = (id) => axios.get(`${API_URL}/devices/${id}`);
export const createDevice = (data) => axios.post(`${API_URL}/devices/`, data);
export const updateDevice = (id, data) => axios.put(`${API_URL}/devices/${id}`, data);
export const deleteDevice = (id) => axios.delete(`${API_URL}/devices/${id}`);