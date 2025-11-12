// ApiClient.js — adapta la capa OOP a nuestro cliente real
import { api } from '../../services/api';

export default class ApiClient {
  async post(url, data){ return api.post(url, data); }     // usar /api/*
  async get(url){ return api.get(url); }
  async patch(url, data){ return api.patch(url, data); }
  async del(url){ return api.del(url); }
}
