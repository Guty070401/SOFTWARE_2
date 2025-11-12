import { api } from './api';

export const StoresApi = {
  list: () => api.get('/api/stores'),
  create: (store) => api.post('/api/stores', store),                 // admin
  update: (id, patch) => api.patch(`/api/stores/${id}`, patch),      // admin
  remove: (id) => api.del(`/api/stores/${id}`),                      // admin

  listProducts: (storeId) => api.get(`/api/stores/${storeId}/products`),
  createProduct: (storeId, p) => api.post(`/api/stores/${storeId}/products`, p), // admin
  updateProduct: (id, patch) => api.patch(`/api/stores/products/${id}`, patch),  // admin
  removeProduct: (id) => api.del(`/api/stores/products/${id}`),                  // admin

  exportJSON: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stores/export/json`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const blob = await res.blob();
    return blob; // para descargar
  },
  importJSON: (payload) => api.post('/api/stores/import/json', payload),         // { tiendas, productos }
};

export const OrdersApi = {
  exportJSON: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/export/json`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    return res.blob();
  }
};
