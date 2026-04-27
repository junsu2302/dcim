import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getRacks = (site) => {
  const params = site ? { site } : {};
  return axios.get(`${API_URL}/racks/`, { params });
};
export const createRack = (data) => axios.post(`${API_URL}/racks/`, data);
export const updateRack = (id, data) => axios.put(`${API_URL}/racks/${id}`, data);
export const deleteRack = (id) => axios.delete(`${API_URL}/racks/${id}`);