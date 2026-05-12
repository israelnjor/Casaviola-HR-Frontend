import API from './api';

export const getAllPerformance = () => API.get('/performance');
export const createPerformance = (data) => API.post('/performance', data);
export const updatePerformance = (id, data) => API.put(`/performance/${id}`, data);
export const deletePerformance = (id) => API.delete(`/performance/${id}`);