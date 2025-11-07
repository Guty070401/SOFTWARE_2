import ApiClient from "./ApiClient.js";

export default class StoreService {
  constructor() {
    this.api = new ApiClient();
  }

  async listStores() {
    const response = await this.api.get("/stores");
    return response?.stores ?? [];
  }
}
