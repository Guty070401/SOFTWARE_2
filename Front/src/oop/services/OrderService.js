// Servicio de órdenes conectado con el backend
import ApiClient from './ApiClient.js';

function normaliseCart(cart = []){
  const map = new Map();
  for (const item of cart) {
    const productId = item.productoId || item.productId || item.id;
    if (!productId) continue;
    const key = String(productId);
    const current = map.get(key) || { productoId: productId, cantidad: 0 };
    current.cantidad += Number(item.qty ?? 1);
    map.set(key, current);
  }
  return Array.from(map.values());
}

export default class OrderService {
  constructor(){ this.api = new ApiClient(); }

  async listOrders(){
    const data = await this.api.get('/orders');
    return Array.isArray(data?.orders) ? data.orders : [];
  }

  async getOrder(orderId){
    if (!orderId) return null;
    const data = await this.api.get(`/orders/${orderId}`);
    return data?.order || null;
  }

  async placeOrder(cart, { storeId, address, cardId = null, notes = '' } = {}) {
    const items = normaliseCart(cart);
    const payload = {
      storeId,
      tarjetaId: cardId || null,
      direccionEntrega: address || '',
      comentarios: notes || '',
      items
    };
    const data = await this.api.post('/orders', payload);
    return data?.order || null;
  }

  async updateStatus(order, status, notes = ''){
    const id = typeof order === 'object' ? order.id : order;
    if (!id) return null;
    const data = await this.api.patch(`/orders/${id}/status`, { status, notes });
    return data?.order || null;
  }
}
