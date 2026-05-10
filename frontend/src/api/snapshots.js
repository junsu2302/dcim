import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getSnapshots = () => axios.get(`${API_URL}/snapshots/`);
export const getSnapshot = (id) => axios.get(`${API_URL}/snapshots/${id}`);
export const createSnapshot = (memo) => axios.post(`${API_URL}/snapshots/`, { memo });
export const deleteSnapshot = (id) => axios.delete(`${API_URL}/snapshots/${id}`);