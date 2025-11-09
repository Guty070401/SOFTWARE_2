import React from "react";
import OrderStatus from "../oop/models/OrderStatus";

export default class StatusModal extends React.Component {
  render(){
    const { open, onClose, onSelect } = this.props;
    if (!open) return null;

    const states = [OrderStatus.ACCEPTED, OrderStatus.PICKED, OrderStatus.ON_ROUTE, OrderStatus.DELIVERED, OrderStatus.CANCELED];

    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
        <div className="card w-full max-w-sm">
          <h3 className="text-lg font-semibold mb-2">Actualizar Estado</h3>
          <div className="grid gap-2">
            {states.map(s => (
              <button key={s} onClick={() => onSelect?.(s)} className={`btn w-full ${s===OrderStatus.DELIVERED ? "btn-primary":""}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="btn w-full mt-3">Cerrar</button>
        </div>
      </div>
    );
  }
}
