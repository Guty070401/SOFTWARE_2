// Back/src/services/storeService.js  (CommonJS)
const { supabase } = require('../data/database');

async function listStores() {
  const { data: stores, error: errStores } = await supabase
    .from('tiendas')
    .select('*')
    .order('nombre_origen', { ascending: true });
  if (errStores) throw errStores;

  const { data: products, error: errProds } = await supabase
    .from('productos')
    .select('*');
  if (errProds) throw errProds;

  const byStore = products.reduce((acc, p) => {
    acc[p.tienda_id] ||= [];
    acc[p.tienda_id].push({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      foto: p.foto
    });
    return acc;
  }, {});

  return stores.map(s => ({
    id: s.id,
    nombre: s.nombre_origen,
    logo: s.logo,
    productos: byStore[s.id] || []
  }));
}

async function getStore(storeId) {
  const { data, error } = await supabase
    .from('tiendas')
    .select('*')
    .eq('id', storeId)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, nombre: data.nombre_origen, logo: data.logo } : null;
}

async function getProduct(productId) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', productId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { id: data.id, tiendaId: data.tienda_id, nombre: data.nombre, descripcion: data.descripcion, precio: Number(data.precio), foto: data.foto }
    : null;
}
async function createStore({ id, nombre, logo }) {
  const row = { id, nombre_origen: nombre, logo: logo || null };
  const { data, error } = await supabase.from('tiendas').insert(row).select().single();
  if (error) throw error;
  return { id: data.id, nombre: data.nombre_origen, logo: data.logo };
}

async function updateStore(id, { nombre, logo }) {
  const patch = {};
  if (nombre !== undefined) patch.nombre_origen = nombre;
  if (logo !== undefined) patch.logo = logo;
  const { data, error } = await supabase.from('tiendas').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return { id: data.id, nombre: data.nombre_origen, logo: data.logo };
}

async function deleteStore(id) {
  const { error } = await supabase.from('tiendas').delete().eq('id', id);
  if (error) throw error;
}

async function listProductsByStore(storeId) {
  const { data, error } = await supabase.from('productos').select('*').eq('tienda_id', storeId);
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id, tiendaId: p.tienda_id, nombre: p.nombre,
    descripcion: p.descripcion, precio: Number(p.precio), foto: p.foto
  }));
}

async function createProduct({ id, tiendaId, nombre, descripcion, precio, foto }) {
  const row = { id, tienda_id: tiendaId, nombre, descripcion: descripcion || null, precio, foto: foto || null };
  const { data, error } = await supabase.from('productos').insert(row).select().single();
  if (error) throw error;
  return { id: data.id, tiendaId: data.tienda_id, nombre: data.nombre, descripcion: data.descripcion, precio: Number(data.precio), foto: data.foto };
}

async function updateProduct(id, { tiendaId, nombre, descripcion, precio, foto }) {
  const patch = {};
  if (tiendaId !== undefined) patch.tienda_id = tiendaId;
  if (nombre !== undefined) patch.nombre = nombre;
  if (descripcion !== undefined) patch.descripcion = descripcion;
  if (precio !== undefined) patch.precio = precio;
  if (foto !== undefined) patch.foto = foto;
  const { data, error } = await supabase.from('productos').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return { id: data.id, tiendaId: data.tienda_id, nombre: data.nombre, descripcion: data.descripcion, precio: Number(data.precio), foto: data.foto };
}

async function deleteProduct(id) {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw error;
}

/* Export/Import JSON para catálogo */
async function exportCatalog() {
  const { data: tiendas, error: e1 } = await supabase.from('tiendas').select('*');
  if (e1) throw e1;
  const { data: productos, error: e2 } = await supabase.from('productos').select('*');
  if (e2) throw e2;
  return {
    tiendas: (tiendas || []).map(t => ({ id: t.id, nombre: t.nombre_origen, logo: t.logo })),
    productos: (productos || []).map(p => ({
      id: p.id, tiendaId: p.tienda_id, nombre: p.nombre,
      descripcion: p.descripcion, precio: Number(p.precio), foto: p.foto
    }))
  };
}

async function importCatalog({ tiendas = [], productos = [] }) {
  if (tiendas.length) {
    const rows = tiendas.map(t => ({ id: t.id, nombre_origen: t.nombre, logo: t.logo || null }));
    const { error } = await supabase.from('tiendas').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }
  if (productos.length) {
    const rows = productos.map(p => ({
      id: p.id, tienda_id: p.tiendaId, nombre: p.nombre,
      descripcion: p.descripcion || null, precio: p.precio, foto: p.foto || null
    }));
    const { error } = await supabase.from('productos').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }
  return { ok: true };
}
module.exports = {
  listStores, getStore, getProduct,
  createStore, updateStore, deleteStore,
  listProductsByStore, createProduct, updateProduct, deleteProduct,
  exportCatalog, importCatalog
};