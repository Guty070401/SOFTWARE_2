const { generateId } = require('../utils/id');

class OrdenUsuario {
  constructor({
    id = generateId('ord_usr_'),
    ordenId,
    usuarioId,
    esPropietario = false,
    esRepartidor = false
  }) {
    this.id = id;
    this.ordenId = ordenId;
    this.usuarioId = usuarioId;
    this.esPropietario = esPropietario;
    this.esRepartidor = esRepartidor;
  }

  matches(ordenId, usuarioId) {
    return this.ordenId === ordenId && this.usuarioId === usuarioId;
  }
}

module.exports = OrdenUsuario;
