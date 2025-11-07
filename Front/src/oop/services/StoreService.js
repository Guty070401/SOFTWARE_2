import ApiClient from './ApiClient.js';

export default class StoreService {
  constructor(){
    this.api = new ApiClient();
  }

  async listStores(){
    const data = await this.api.get('/stores');
    return Array.isArray(data?.stores) ? data.stores : [];
  }

  async createStore(payload = {}){
    const data = await this.api.post('/stores', payload);
    return data?.store || null;
  }

  async createProduct(storeId, payload = {}){
    if (!storeId) {
      throw new Error('storeId es obligatorio');
    }
    const path = `/stores/${encodeURIComponent(storeId)}/products`;
    const data = await this.api.post(path, payload);
    return data?.product || null;
  }

  async deleteStore(storeId){
    if (!storeId) {
      throw new Error('storeId es obligatorio');
    }
    const path = `/stores/${encodeURIComponent(storeId)}`;
    const data = await this.api.delete(path);
    return data?.store || null;
  }

  async deleteProduct(storeId, productId){
    if (!storeId) {
      throw new Error('storeId es obligatorio');
    }
    if (!productId) {
      throw new Error('productId es obligatorio');
    }
    const path = `/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}`;
    const data = await this.api.delete(path);
    return data?.product || null;
  }
}
