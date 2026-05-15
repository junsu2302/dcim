import client from './client';

export const getRacks = (site) => {
  const params = site ? { site } : {};
  return client.get('/racks/', { params });
};
export const createRack = (data) => client.post('/racks/', data);
export const updateRack = (id, data) => client.put(`/racks/${id}`, data);
export const deleteRack = (id) => client.delete(`/racks/${id}`);
