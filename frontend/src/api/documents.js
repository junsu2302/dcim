import client from './client';

export const getDocuments = (deviceId) => client.get(`/documents/device/${deviceId}`);

export const uploadDocument = (deviceId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(`/documents/device/${deviceId}`, formData);
};

export const deleteDocument = (documentId) => client.delete(`/documents/${documentId}`);

export const downloadDocument = async (documentId, filename) => {
  const res = await client.get(`/documents/download/${documentId}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'download');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
