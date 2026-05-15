import client from './client';

export const getDevices = () => client.get('/devices/');
export const getDevice = (id) => client.get(`/devices/${id}`);
export const checkIp = (ip, excludeId) =>
  client.get('/devices/check-ip', { params: excludeId ? { ip, exclude_id: excludeId } : { ip } });
export const createDevice = (data) => client.post('/devices/', data);
export const updateDevice = (id, data) => client.put(`/devices/${id}`, data);
export const deleteDevice = (id) => client.delete(`/devices/${id}`);
