import client from './client';

export const getVMs = (deviceId) => client.get(`/vms/device/${deviceId}`);
export const getVmCounts = () => client.get('/vms/counts');
export const createVM = (deviceId, data) => client.post(`/vms/device/${deviceId}`, data);
export const updateVM = (vmId, data) => client.put(`/vms/${vmId}`, data);
export const deleteVM = (vmId) => client.delete(`/vms/${vmId}`);
