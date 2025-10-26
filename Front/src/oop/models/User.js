export default class User {
  /**
   * @param {string} id
   * @param {string} name
   * @param {'customer'|'courier'|null} role
   * @param {string} email
   */
  constructor(id, name, role = null, email = "", phone = "", photo = null) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.email = email;
    this.phone = phone;
    this.photo = photo;
  }

  setRole(role) { this.role = role; return this; }

  updateFrom(payload = {}) {
    if (!payload) return this;
    if (payload.name) this.name = payload.name;
    if (payload.role) this.role = payload.role;
    if (payload.email) this.email = payload.email;
    if (payload.phone) this.phone = payload.phone;
    if (Object.prototype.hasOwnProperty.call(payload, "photo")) {
      this.photo = payload.photo;
    }
    return this;
  }
}
