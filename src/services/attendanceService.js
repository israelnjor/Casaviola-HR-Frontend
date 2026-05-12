import API from './api';

export const getAllAttendance = () => API.get('/attendance');
export const getAttendanceByDate = (date) => API.get(`/attendance/date/${date}`);
export const createAttendance = (data) => API.post('/attendance', data);
export const updateAttendance = (id, data) => API.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => API.delete(`/attendance/${id}`);