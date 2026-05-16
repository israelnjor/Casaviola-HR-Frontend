import API from './api';

export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const createStaffLogin = (data) => API.post('/auth/create-login', data);
export const getAllLogins = () => API.get('/auth/logins');
export const toggleLogin = (id) => API.put(`/auth/logins/${id}/toggle`);
export const deleteLogin = (id) => API.delete(`/auth/logins/${id}`);