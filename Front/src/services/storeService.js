import { api, BASE_URL } from './api';

const buildUrl = (path) => `${BASE_URL}${path}`;

export const StoresApi = {
  list: () => api.get('/stores'),
  create: (store) => api.post('/stores', store),                     // admin
  update: (id, patch) => api.patch(`/stores/${id}`, patch),          // admin
  remove: (id) => api.del(`/stores/${id}`),                          // admin

  listProducts: (storeId) => api.get(`/stores/${storeId}/products`),
  createProduct: (storeId, p) => api.post(`/stores/${storeId}/products`, p), // admin
  updateProduct: (id, patch) => api.patch(`/stores/products/${id}`, patch),  // admin
  removeProduct: (id) => api.del(`/stores/products/${id}`),                  // admin

  exportJSON: async () => {
    const res = await fetch(buildUrl('/stores/export/json'), {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const blob = await res.blob();
    return blob; // para descargar
  },
  importJSON: (payload) => api.post('/stores/import/json', payload),         // { tiendas, productos }
};

export const OrdersApi = {
  exportJSON: async () => {
    const res = await fetch(buildUrl('/orders/export/json'), {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    return res.blob();
  }
};
