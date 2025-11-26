// Servicio de ordenes OOP conectado al backend real
import ApiClient from './ApiClient.js';

export default class OrderService {
  constructor(){ this.api = new ApiClient(); }

  async placeOrder(cart, options = {}){
    const { storeIdOverride = null, extraPayload = {} } = options;
    if (!Array.isArray(cart) || cart.length === 0) throw new Error('Carrito vacio');
    const storeId = storeIdOverride || cart[0]?.storeId || 'store_demo';
    const items = cart.map(i => ({
      productoId: i.id,
      cantidad: i.qty ?? 1,
      precio: Number(i.price ?? i.precio ?? i.precioUnitario ?? 0),
      name: i.name,
      image: i.image
    }));
    const payload = {
      storeId,
      items,
      tarjetaId: null,
      direccionEntrega: 'Direccion demo',
      comentarios: '',
      ...extraPayload,
    };
    const { order } = await this.api.post('/api/orders', payload);
    return order;
  }

  async updateStatus(order, status){
    const sLower = String(status || '').toLowerCase();
    const sUpper = sLower.toUpperCase();
    const id = order.id;
    const tries = [
      { path: `/api/orders/${id}/status`, body: { status: sLower } },
      { path: `/api/orders/${id}/status`, body: { status: sUpper } },
      { path: `/api/orders/${id}`, body: { status: sLower } },
      { path: `/api/orders/${id}`, body: { estado: sUpper } },
    ];
    let lastErr = null;
    for (const t of tries){
      try { await this.api.patch(t.path, t.body); lastErr = null; break; }
      catch (e) { lastErr = e; }
    }
    if (lastErr) throw lastErr;
    order.status = sLower;
    return order;
  }

  async cancel(order){
    const id = order.id;
    const tries = [
      { path: `/api/orders/${id}/cancel`, body: {} },
      { path: `/api/orders/${id}/status`, body: { status: 'canceled' } },
      { path: `/api/orders/${id}/status`, body: { status: 'CANCELED' } },
    ];
    let lastErr = null;
    for (const t of tries){
      try { await this.api.post(t.path, t.body); lastErr = null; break; }
      catch (e) { lastErr = e; }
    }
    if (lastErr) throw lastErr;
    order.status = 'canceled';
    return order;
  }

  async list(){
    const data = await this.api.get('/api/orders');
    return data?.orders || data || [];
  }

  async getById(id){
    const data = await this.api.get(`/api/orders/${id}`);
    return data?.order || data;
  }
}
