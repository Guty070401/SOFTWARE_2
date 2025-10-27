import ApiClient from "./ApiClient.js";

export default class StoreService {
  constructor() {
    this.api = new ApiClient();
  }

  async listStores() {
    const data = await this.api.get("/stores");
    return data?.stores ?? [];
  }
}
