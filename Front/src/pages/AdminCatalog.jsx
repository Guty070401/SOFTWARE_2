import React, { useEffect, useState } from 'react';
import { StoresApi } from '../services/storeService';

export default function AdminCatalog(){
  const [stores, setStores] = useState([]);
  const [formS, setFormS] = useState({ id:'', nombre:'', logo:'' });
  const [formP, setFormP] = useState({ tiendaId:'', id:'', nombre:'', descripcion:'', precio:'', foto:'' });
  const [msg, setMsg] = useState('');

  async function refresh(){
    const { stores } = await StoresApi.list();
    setStores(stores || []);
  }
  useEffect(()=>{ refresh(); },[]);

  async function onCreateStore(e){
    e.preventDefault(); setMsg('');
    await StoresApi.create(formS);
    setFormS({ id:'', nombre:'', logo:'' });
    refresh(); setMsg('Tienda creada');
  }
  async function onCreateProduct(e){
    e.preventDefault(); setMsg('');
    const { tiendaId, ...p } = formP;
    await StoresApi.createProduct(tiendaId, { ...p, precio: Number(p.precio) });
    setFormP({ tiendaId:'', id:'', nombre:'', descripcion:'', precio:'', foto:'' });
    refresh(); setMsg('Producto creado');
  }
  async function onDeleteStore(id){
    if (!confirm('Eliminar tienda?')) return;
    await StoresApi.remove(id); refresh();
  }
  async function onDeleteProduct(id){
    if (!confirm('Eliminar producto?')) return;
    await StoresApi.removeProduct(id); refresh();
  }

  async function onExportCatalog(){
    const blob = await StoresApi.exportJSON();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href:url, download:'catalogo.json' });
    a.click(); URL.revokeObjectURL(url);
  }

  async function onImportCatalog(e){
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text); // { tiendas:[], productos:[] }
    await StoresApi.importJSON(json);
    e.target.value = ''; refresh(); setMsg('Catálogo importado');
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Admin Catálogo</h1>
      {msg && <div className="p-2 bg-emerald-50 text-emerald-700 rounded">{msg}</div>}

      {/* Crear tienda */}
      <section className="card p-4">
        <h2 className="font-semibold mb-2">Nueva Tienda</h2>
        <form onSubmit={onCreateStore} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border p-2 rounded" placeholder="id (ej. store_demo)" value={formS.id} onChange={e=>setFormS(s=>({...s,id:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Nombre" value={formS.nombre} onChange={e=>setFormS(s=>({...s,nombre:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Logo URL" value={formS.logo} onChange={e=>setFormS(s=>({...s,logo:e.target.value}))}/>
          <button className="btn btn-primary md:col-span-3">Crear tienda</button>
        </form>
      </section>

      {/* Crear producto */}
      <section className="card p-4">
        <h2 className="font-semibold mb-2">Nuevo Producto</h2>
        <form onSubmit={onCreateProduct} className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <input className="border p-2 rounded" placeholder="Tienda ID" value={formP.tiendaId} onChange={e=>setFormP(s=>({...s,tiendaId:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Producto ID" value={formP.id} onChange={e=>setFormP(s=>({...s,id:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Nombre" value={formP.nombre} onChange={e=>setFormP(s=>({...s,nombre:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Descripción" value={formP.descripcion} onChange={e=>setFormP(s=>({...s,descripcion:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Precio" type="number" step="0.01" value={formP.precio} onChange={e=>setFormP(s=>({...s,precio:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="Foto URL" value={formP.foto} onChange={e=>setFormP(s=>({...s,foto:e.target.value}))}/>
          <button className="btn btn-primary md:col-span-6">Crear producto</button>
        </form>
      </section>

      {/* Listado / gestión */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tiendas</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={onExportCatalog}>Exportar JSON</button>
            <label className="btn">
              Importar JSON
              <input type="file" accept="application/json" onChange={onImportCatalog} className="hidden" />
            </label>
          </div>
        </div>

        <div className="divide-y mt-3">
          {stores.map(s=>(
            <div key={s.id} className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {s.logo && <img src={s.logo} className="h-10 w-10 rounded object-cover" />}
                  <div>
                    <div className="font-semibold">{s.nombre}</div>
                    <div className="text-xs text-slate-500">{s.id}</div>
                  </div>
                </div>
                <button className="btn btn-danger" onClick={()=>onDeleteStore(s.id)}>Eliminar</button>
              </div>

              {/* productos */}
              {s.productos?.length ? (
                <ul className="grid md:grid-cols-2 gap-2 mt-2">
                  {s.productos.map(p=>(
                    <li key={p.id} className="border rounded p-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.nombre}</div>
                        <div className="text-xs text-slate-500">S/ {Number(p.precio).toFixed(2)}</div>
                      </div>
                      <button className="btn btn-danger" onClick={()=>onDeleteProduct(p.id)}>Borrar</button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500 mt-1">Sin productos</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
