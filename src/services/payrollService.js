import API from './api';

export const getAllPayroll = () => API.get('/payroll');
export const getPayrollByStaffId = (staffId) => API.get(`/payroll/staff/${staffId}`);
export const createPayroll = (data) => API.post('/payroll', data);
export const updatePayroll = (id, data) => API.put(`/payroll/${id}`, data);
export const deletePayroll = (id) => API.delete(`/payroll/${id}`);