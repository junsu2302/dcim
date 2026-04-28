import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const getDocuments = (deviceId) => axios.get(`${API_URL}/documents/device/${deviceId}`);
export const uploadDocument = (deviceId, docType, file) => {
  const formData = new FormData();
  formData.append('doc_type', docType);
  formData.append('file', file);
  return axios.post(`${API_URL}/documents/device/${deviceId}`, formData);
};
export const deleteDocument = (documentId) => axios.delete(`${API_URL}/documents/${documentId}`);
export const getDownloadUrl = (documentId) => `${API_URL}/documents/download/${documentId}`;