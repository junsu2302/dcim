import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getDeviceHistory = (deviceId) => axios.get(`${API_URL}/history/device/${deviceId}`);
export const deleteHistory = (historyId) => axios.delete(`${API_URL}/history/${historyId}`);