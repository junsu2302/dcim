import client from './client';

export const getMaintenance = () => client.get('/maintenance/');
export const createMaintenance = (data) => client.post('/maintenance/', data);
export const updateMaintenance = (id, data) => client.put(`/maintenance/${id}`, data);
export const deleteMaintenance = (id) => client.delete(`/maintenance/${id}`);
