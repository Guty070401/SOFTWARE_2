export default class User {
  /**
   * @param {string} id
   * @param {string} name
   * @param {'customer'|'courier'|'admin'|null} role
   * @param {string} email
   * @param {string} phone
   * @param {string|null} photo
   */
  constructor(id, name, role = null, email = "", phone = "", photo = null) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.email = email;
    this.phone = phone;
    this.photo = photo;
  }

  setRole(role) {
    this.role = role;
    return this;
  }

  static fromApi(payload) {
    if (!payload) {
      return null;
    }

    const id = payload.id ?? payload.usuarioId ?? payload.userId ?? null;
    const name = payload.nombre ?? payload.name ?? payload.nombreUsuario ?? "";
    const role = payload.rol ?? payload.role ?? null;
    const email = payload.correo ?? payload.email ?? "";
    const phone = payload.celular ?? payload.phone ?? "";
    const photo = payload.foto ?? payload.photo ?? null;

    return new User(id, name, role, email, phone, photo);
  }
}
