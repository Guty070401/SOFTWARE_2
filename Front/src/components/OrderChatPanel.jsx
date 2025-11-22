import React from "react";
import appState from "../oop/state/AppState";

export default class OrderChatPanel extends React.Component {
  state = {
    messages: [],
    input: "",
    loading: true,
    sending: false,
    error: "",
  };

  componentDidMount() {
    const { orderId } = this.props;
    if (!orderId) return;
    this.unsubscribe = appState.subscribeToChat(orderId, (messages) => {
      this.setState({ messages, loading: false });
      if (this.scroller) {
        requestAnimationFrame(() => {
          this.scroller.scrollTop = this.scroller.scrollHeight;
        });
      }
    });
    appState.ensureChatSession(orderId);
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const text = this.state.input.trim();
    if (!text) return;
    this.setState({ sending: true, error: "" });
    try {
      await appState.sendChatMessage(this.props.orderId, text);
      this.setState({ input: "" });
    } catch (err) {
      this.setState({ error: err?.message || "No se pudo enviar el mensaje" });
    } finally {
      this.setState({ sending: false });
    }
  };

  render() {
    const { messages, input, loading, sending, error } = this.state;
    const currentUserId = appState.user?.id;
    const currentUserRole = String(appState.user?.role || "customer").toLowerCase();
    if (!this.props.orderId) return null;
    return (
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Chat en tiempo real</h2>
          {!loading && <span className="text-sm text-slate-500">{messages.length} mensajes</span>}
        </div>
        <div
          ref={(el) => (this.scroller = el)}
          className="border rounded p-3 h-64 overflow-y-auto bg-slate-50 space-y-3"
        >
          {loading ? (
            <p className="text-sm text-slate-500">Cargando conversaciones...</p>
          ) : !messages.length ? (
            <p className="text-sm text-slate-500">Todavía no hay mensajes. ¡Inicia la conversación!</p>
          ) : (
            messages.map((msg) => {
              const isMine = currentUserId && msg.usuarioId === currentUserId;
              const roleValue = String(msg.rol || msg.role || "").toLowerCase();
              const roleName = roleValue || (isMine ? currentUserRole : "customer");
              const isCourier = roleName === "courier" || roleName === "repartidor";
              const bubbleClass = isMine ? "bg-indigo-600 text-white" : "bg-white border";
              const label = isCourier ? "Repartidor" : "Cliente";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`rounded px-3 py-2 text-sm max-w-[80%] ${bubbleClass}`}>
                    <div className="flex items-center gap-2 mb-1 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-slate-200 text-slate-700">
                        {label}
                      </span>
                      {isMine && <span className="text-slate-500">(tú)</span>}
                    </div>
                    <div>{msg.mensaje}</div>
                    <div className="text-[11px] opacity-60 mt-1">
                      {new Date(msg.createdAt || msg.creado_en || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={this.handleSubmit} className="mt-3 flex flex-col gap-2">
          <textarea
            className="input min-h-[60px]"
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => this.setState({ input: e.target.value })}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary self-end" disabled={sending || !input.trim()}>
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    );
  }
}
