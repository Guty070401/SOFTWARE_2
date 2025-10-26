const usuarios = new Map();
const tarjetas = new Map();
const tiendas = new Map();
const productos = new Map();
const ordenes = new Map();
const ordenUsuarios = [];
const ordenProductos = [];
const historialEstados = [];

function clear() {
  usuarios.clear();
  tarjetas.clear();
  tiendas.clear();
  productos.clear();
  ordenes.clear();
  ordenUsuarios.length = 0;
  ordenProductos.length = 0;
  historialEstados.length = 0;
}

module.exports = {
  usuarios,
  tarjetas,
  tiendas,
  productos,
  ordenes,
  ordenUsuarios,
  ordenProductos,
  historialEstados,
  clear
};
