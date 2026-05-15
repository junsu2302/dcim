import client from './client';

export const getSnapshots = () => client.get('/snapshots/');
export const getSnapshot = (id) => client.get(`/snapshots/${id}`);
export const createSnapshot = (memo, saved_by) => client.post('/snapshots/', { memo, saved_by });
export const deleteSnapshot = (id) => client.delete(`/snapshots/${id}`);
