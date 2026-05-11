import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getDevices = () => axios.get(`${API_URL}/devices/`);
export const getDevice = (id) => axios.get(`${API_URL}/devices/${id}`);
export const createDevice = (data, changedBy) => axios.post(`${API_URL}/devices/`, data, { params: { changed_by: changedBy } });
export const updateDevice = (id, data, changedBy) => axios.put(`${API_URL}/devices/${id}`, data, { params: { changed_by: changedBy } });
export const deleteDevice = (id, changedBy) => axios.delete(`${API_URL}/devices/${id}`, { params: { changed_by: changedBy } });