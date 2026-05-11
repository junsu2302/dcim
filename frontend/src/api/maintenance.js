import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getMaintenance = () => axios.get(`${API_URL}/maintenance/`);
export const createMaintenance = (data) => axios.post(`${API_URL}/maintenance/`, data);
export const updateMaintenance = (id, data) => axios.put(`${API_URL}/maintenance/${id}`, data);
export const deleteMaintenance = (id) => axios.delete(`${API_URL}/maintenance/${id}`);
