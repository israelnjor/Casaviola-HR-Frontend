import API from './api';

export const getAllMessages = () => API.get('/messages');
export const getMessageById = (id) => API.get(`/messages/${id}`);
export const createMessage = (data) => API.post('/messages', data);
export const updateMessage = (id, data) => API.put(`/messages/${id}`, data);
export const deleteMessage = (id) => API.delete(`/messages/${id}`);