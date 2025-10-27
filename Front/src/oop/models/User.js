export default class User {
  /**
   * @param {string | Record<string, any>} idOrData
   * @param {string} [name]
   * @param {'customer'|'courier'|'admin'|null} [role]
   * @param {string} [email]
   */
  constructor(idOrData, name, role = null, email = "") {
    if (typeof idOrData === "object" && idOrData !== null && name === undefined) {
      const data = idOrData;
      this.id = data.id ?? "";
      this.name = data.name ?? data.nombre ?? "";
      this.role = data.role ?? data.rol ?? null;
      this.email = data.email ?? data.correo ?? "";
      this.phone = data.phone ?? data.celular ?? "";
      this.photo = data.photo ?? data.foto ?? null;
      this.solved = Boolean(data.solucion ?? data.solved ?? false);
      this.metadata = { ...data };
    } else {
      this.id = idOrData;
      this.name = name ?? "";
      this.role = role ?? null;
      this.email = email ?? "";
      this.phone = "";
      this.photo = null;
      this.solved = false;
      this.metadata = null;
    }
  }

  setRole(role) {
    this.role = role;
    if (this.metadata) {
      this.metadata.rol = role;
      this.metadata.role = role;
    }
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      email: this.email,
      phone: this.phone,
      photo: this.photo,
      solucion: this.solved,
    };
  }
}
