// Simulación de API; cámbialo por fetch/axios real si quieres.
export default class ApiClient {
  async post(url, data){ return { ok:true, data, url }; }
  async get(url){ return { ok:true, data:[], url }; }
}
