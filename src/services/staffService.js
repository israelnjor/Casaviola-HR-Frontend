import API from './api';

export const getAllStaff = () => API.get('/staff');
export const getStaffById = (id) => API.get(`/staff/${id}`);
export const createStaff = (data) => API.post('/staff', data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);
export const deleteStaff = (id) => API.delete(`/staff/${id}`);