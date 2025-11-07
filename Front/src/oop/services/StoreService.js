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
}
