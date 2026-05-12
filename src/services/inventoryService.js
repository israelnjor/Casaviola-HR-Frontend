import API from './api';

// Inventory Lists
export const getAllLists = () => API.get('/inventory/lists');
export const createList = (data) => API.post('/inventory/lists', data);
export const updateList = (id, data) => API.put(`/inventory/lists/${id}`, data);
export const deleteList = (id) => API.delete(`/inventory/lists/${id}`);

// Inventory Items
export const getItemsByList = (listId) => API.get(`/inventory/lists/${listId}/items`);
export const createItems = (data) => API.post('/inventory/items', data);
export const updateItem = (id, data) => API.put(`/inventory/items/${id}`, data);
export const addQty = (id, data) => API.put(`/inventory/items/${id}/addqty`, data);
export const addUsed = (id, data) => API.put(`/inventory/items/${id}/addused`, data);
export const deleteItem = (id) => API.delete(`/inventory/items/${id}`);