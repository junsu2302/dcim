import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getVMs = (deviceId) => axios.get(`${API_URL}/vms/device/${deviceId}`);
export const createVM = (deviceId, data) => axios.post(`${API_URL}/vms/device/${deviceId}`, data);
export const updateVM = (vmId, data) => axios.put(`${API_URL}/vms/${vmId}`, data);
export const deleteVM = (vmId) => axios.delete(`${API_URL}/vms/${vmId}`);