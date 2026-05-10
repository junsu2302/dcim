import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const login = (username, password) =>
  axios.post(`${API_URL}/auth/login`, { username, password });

export const getUsers = (token) =>
  axios.get(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } });

export const createUser = (token, data) =>
  axios.post(`${API_URL}/users/`, data, { headers: { Authorization: `Bearer ${token}` } });

export const updateUser = (token, id, data) =>
  axios.put(`${API_URL}/users/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });

export const deleteUser = (token, id) =>
  axios.delete(`${API_URL}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });