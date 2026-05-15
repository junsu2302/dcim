import client from './client';

export const getRecentHistory = (limit = 10) => client.get('/history/recent', { params: { limit } });
export const getDeviceHistory = (deviceId) => client.get(`/history/device/${deviceId}`);
export const deleteHistory = (historyId) => client.delete(`/history/${historyId}`);
