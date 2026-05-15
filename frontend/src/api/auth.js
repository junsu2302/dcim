import client from './client';

export const login = (username, password) =>
  client.post('/auth/login', { username, password });

export const logout = () => client.post('/auth/logout');

export const changePassword = (old_password, new_password) =>
  client.put('/auth/change-password', { old_password, new_password });

export const getLoginHistory = () => client.get('/auth/login-history');

export const getUsers = () => client.get('/users/');
export const createUser = (data) => client.post('/users/', data);
export const updateUser = (id, data) => client.put(`/users/${id}`, data);
export const deleteUser = (id) => client.delete(`/users/${id}`);
