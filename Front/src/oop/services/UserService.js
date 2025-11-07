import ApiClient from './ApiClient.js';

function normaliseCard(raw){
  if (!raw) return null;
  return {
    id: raw.id,
    titulo: raw.titulo || raw.title || '',
    numero: raw.numero || raw.numeroTarjeta || raw.maskedNumber || '',
    vencimiento: raw.vencimiento || raw.expiration || null,
    foto: raw.foto || raw.image || null,
    invalidada: Boolean(raw.invalidada)
  };
}

export default class UserService {
  constructor(){
    this.api = new ApiClient();
  }

  async listCards(){
    const data = await this.api.get('/users/me/cards');
    const cards = Array.isArray(data?.cards) ? data.cards : [];
    return cards.map(normaliseCard).filter(Boolean);
  }

  async addCard({ number, expiration, csv, title, photo } = {}){
    const payload = {
      numeroTarjeta: number,
      vencimiento: expiration,
      csv,
      titulo: title,
      foto: photo ?? null
    };
    const data = await this.api.post('/users/me/cards', payload);
    return normaliseCard(data?.card);
  }

  async removeCard(cardId){
    if (!cardId) {
      throw new Error('cardId es obligatorio');
    }
    await this.api.delete(`/users/me/cards/${encodeURIComponent(cardId)}`);
  }
}
