import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import OrderStatus, { statusLabel } from "../../oop/models/OrderStatus";
import withNavigate from "../../oop/router/withNavigate";
import { useLocation } from "react-router-dom";

function withLocation(Component){
  return (props)=> <Component {...props} location={useLocation()} />;
}

class TrackOrder extends React.Component {
  state = { orders: [], filter: 'all', q: '', page: 1, pageSize: 10 };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, (orders)=> this.setState({ orders }));
    // Inicializar desde URL
    this.syncFromUrl();
    // Cargar todos los pedidos desde el backend
    appState.fetchOrders().catch(()=>{});
    // Estado actual por si ya existen en memoria
    this.setState({ orders: appState.orders });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  syncFromUrl(){
    const search = this.props.location?.search || '';
    const sp = new URLSearchParams(search);
    const filter = sp.get('filter') || 'all';
    const q = sp.get('q') || '';
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(sp.get('pageSize') || '10', 10));
    this.setState({ filter, q, page, pageSize });
  }

  syncToUrl(){
    const { filter, q, page, pageSize } = this.state;
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.set('filter', filter);
    if (q) params.set('q', q);
    if (page && page !== 1) params.set('page', String(page));
    if (pageSize && pageSize !== 10) params.set('pageSize', String(pageSize));
    const search = params.toString();
    const path = this.props.location?.pathname || '/customer/track';
    this.props.navigate(search ? `${path}?${search}` : path, { replace: true });
  }

  setFilter(v){ this.setState({ filter: v, page: 1 }, ()=> this.syncToUrl()); }
  setQuery(v){ this.setState({ q: v, page: 1 }, ()=> this.syncToUrl()); }
  setPage(p){ this.setState({ page: Math.max(1, p) }, ()=> this.syncToUrl()); }
  setPageSize(ps){ this.setState({ pageSize: Math.max(1, ps), page: 1 }, ()=> this.syncToUrl()); }

  filtered(){
    const { orders, filter, q } = this.state;
    const ql = (q||'').toLowerCase();
    let list = orders || [];
    if (filter && filter !== 'all'){
      if (filter === 'en_curso'){
        list = list.filter(o => ![OrderStatus.DELIVERED, OrderStatus.CANCELED].includes(o.status));
      } else {
        list = list.filter(o => String(o.status).toLowerCase() === String(filter));
      }
    }
    if (ql){
      list = list.filter(o => {
        const inId = String(o.id).toLowerCase().includes(ql);
        const inItems = Array.isArray(o.items) && o.items.some(it => String(it.name||'').toLowerCase().includes(ql));
        return inId || inItems;
      });
    }
    return list;
  }

  render(){
    const list = this.filtered();
    const { page, pageSize } = this.state;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const orders = list.slice(start, end);
    return (
      <section className="max-w-4xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-4">Pedidos</h1>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-sm text-slate-500">Estado</label>
              <select className="input mt-1" value={this.state.filter} onChange={e=>this.setFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="en_curso">En curso</option>
                <option value={OrderStatus.PENDING}>{statusLabel(OrderStatus.PENDING)}</option>
                <option value={OrderStatus.ACCEPTED}>{statusLabel(OrderStatus.ACCEPTED)}</option>
                <option value={OrderStatus.PICKED}>{statusLabel(OrderStatus.PICKED)}</option>
                <option value={OrderStatus.ON_ROUTE}>{statusLabel(OrderStatus.ON_ROUTE)}</option>
                <option value={OrderStatus.DELIVERED}>{statusLabel(OrderStatus.DELIVERED)}</option>
                <option value={OrderStatus.CANCELED}>{statusLabel(OrderStatus.CANCELED)}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-500">Buscar</label>
              <input className="input mt-1" placeholder="ID o nombre de producto" value={this.state.q} onChange={e=>this.setQuery(e.target.value)} />
            </div>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between mb-3 text-sm text-slate-600">
            <div>
              Mostrando {total ? start + 1 : 0}–{end} de {total}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" disabled={current <= 1} onClick={()=>this.setPage(current - 1)}>Anterior</button>
              <span>Página {current} / {totalPages}</span>
              <button className="btn" disabled={current >= totalPages} onClick={()=>this.setPage(current + 1)}>Siguiente</button>
            </div>
          </div>

          {!orders.length ? (
            <p className="text-slate-500">No hay pedidos que coincidan.</p>
          ) : (
            <div className="grid gap-3">
              {orders.map(o => (
                <div key={o.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">#{o.id}</p>
                    <p className="text-sm text-slate-500">{statusLabel(o.status)} · {Array.isArray(o.items)? o.items.length: 0} ítems</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">S/ {Number(o.total ?? 0).toFixed(2)}</span>
                    <button className="btn" onClick={()=>this.props.navigate(`/customer/order/${o.id}`)}>Ver</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default withNavigate(withLocation(TrackOrder));
