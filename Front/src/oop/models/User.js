export default class User {
  /**
   * @param {string} id
   * @param {string} name
   * @param {'customer'|'courier'|null} role
   * @param {string} email
   */
  constructor(id, name, role = null, email = "") {
    this.id = id;
    this.name = name;
    this.role = role;
    this.email = email;
  }

  setRole(role) { this.role = role; return this; }
}
