export default function StatusModal({ open, onClose, onSelect }) {
  if (!open) return null;
  const states = ["accepted","picked","on_route","delivered","canceled"];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="card w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-2">Actualizar estado</h3>
        <div className="grid gap-2">
          {states.map(s => (
            <button key={s} onClick={() => { onSelect(s); onClose(); }}
              className={`btn w-full ${s==="delivered" ? "btn-primary" : ""}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="btn w-full mt-3">Cerrar</button>
      </div>
    </div>
  );
}
