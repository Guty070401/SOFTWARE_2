import React from "react";
import { useLocation } from "react-router-dom";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

function withLocation(Component){
  return (props)=> <Component {...props} location={useLocation()} />;
}

function parseExpiration(value){
  const raw = String(value || '').trim();
  if (!raw) {
    throw new Error('El vencimiento de la tarjeta es obligatorio.');
  }
  const match = raw.replace(/\s+/g, '').match(/^([0-9]{2})\/?([0-9]{2,4})$/);
  if (!match) {
    throw new Error('El vencimiento debe tener el formato MM/AA.');
  }
  const month = Number.parseInt(match[1], 10);
  if (month < 1 || month > 12) {
    throw new Error('El mes de vencimiento es inválido.');
  }
  let year = Number.parseInt(match[2], 10);
  if (match[2].length === 2) {
    year += 2000;
  }
  const expiration = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  if (Number.isNaN(expiration.getTime())) {
    throw new Error('La fecha de vencimiento es inválida.');
  }
  return expiration;
}

function getCardLabel(card){
  if (!card) return '';
  if (card.titulo) return card.titulo;
  if (card.numero) return card.numero;
  return `Tarjeta ${card.id}`;
}

class Checkout extends React.Component {
  state = {
    total: 0,
    paying: false,
    name: "",
    phone: "",
    address: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    error: null,
    storeId: null,
    cards: [],
    selectedCardId: "new"
  };

  componentDidMount(){
    if (!appState.cart.length) {
      this.props.navigate("/customer/cart", { replace: true });
      return;
    }
    const passed = this.props.location?.state?.total ?? 0;
    const fallback = appState.cart.reduce((a,i)=>a+Number(i.price || 0)*(i.qty??1),0);
    const total = Number(passed) || fallback;
    const storeId = this.props.location?.state?.storeId ?? (appState.cart.find((item) => item.storeId)?.storeId || null);
    const cards = Array.isArray(appState.cards) ? appState.cards : [];
    this.setState({
      total,
      storeId,
      cards,
      selectedCardId: cards.length ? String(cards[0].id) : "new"
    });
    this.unsubCards = appState.on(EVENTS.CARDS_CHANGED, (nextCards = []) => {
      const array = Array.isArray(nextCards) ? nextCards : [];
      this.setState((prev) => {
        const currentSelection = prev.selectedCardId;
        const hasCurrent = array.some((card) => String(card.id) === String(currentSelection));
        return {
          cards: array,
          selectedCardId: hasCurrent ? currentSelection : (array.length ? String(array[0].id) : 'new')
        };
      });
    });
  }

  componentWillUnmount(){
    if (this.unsubCards) {
      this.unsubCards();
    }
  }

  async pay(e){
    e.preventDefault();
    if (this.state.paying) return;
    this.setState({ paying: true, error: null });
    try {
      if (!this.state.storeId) {
        throw new Error('No se pudo determinar la tienda del pedido.');
      }

      let cardId = this.state.selectedCardId;

      if (cardId === 'new') {
        const normalizedNumber = String(this.state.cardNumber || '').replace(/\s+/g, '');
        if (!/^[0-9]{13,19}$/.test(normalizedNumber)) {
          throw new Error('El número de tarjeta es inválido.');
        }
        const expirationDate = parseExpiration(this.state.cardExpiry);
        const cvv = String(this.state.cardCvv || '').trim();
        if (!/^[0-9]{3,4}$/.test(cvv)) {
          throw new Error('El CVV debe tener 3 o 4 dígitos.');
        }
        const cardTitle = `Tarjeta •••• ${normalizedNumber.slice(-4)}`;
        const card = await appState.addCard({
          number: normalizedNumber,
          expiration: expirationDate.toISOString(),
          csv: cvv,
          title: cardTitle
        });
        cardId = card?.id ? String(card.id) : null;
        if (!cardId) {
          throw new Error('No se pudo registrar la tarjeta.');
        }
        this.setState({ selectedCardId: cardId, cardNumber: '', cardExpiry: '', cardCvv: '' });
      }

      await appState.placeOrder({
        storeId: this.state.storeId,
        address: this.state.address,
        notes: this.state.phone ? `Contacto: ${this.state.phone}` : undefined,
        cardId
      });
      this.props.navigate("/customer/track", { replace: true });
    } catch (error) {
      const message = error?.message || 'No se pudo procesar el pago.';
      this.setState({ error: message });
    } finally {
      this.setState({ paying: false });
    }
  }

  render(){
    const usingSavedCard = this.state.selectedCardId !== 'new';

    return (
      <section className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Checkout</h1>
          <p className="text-slate-500 mb-4">Completa tus datos para confirmar.</p>
          {this.state.error && (
            <div className="p-3 mb-3 rounded bg-rose-100 text-rose-700 text-sm">
              {this.state.error}
            </div>
          )}
          <form onSubmit={(e)=>this.pay(e)} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nombre y Apellidos"
                value={this.state.name}
                onChange={(e)=>this.setState({ name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Teléfono"
                value={this.state.phone}
                onChange={(e)=>this.setState({ phone: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="Dirección exacta de entrega"
              value={this.state.address}
              onChange={(e)=>this.setState({ address: e.target.value })}
              required
            />
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-600">Tarjeta de crédito</label>
              <select
                className="input"
                value={this.state.selectedCardId}
                onChange={(e) => this.setState({ selectedCardId: e.target.value })}
              >
                <option value="new">Registrar nueva tarjeta</option>
                {this.state.cards.map((card) => {
                  const optionId = String(card.id);
                  return (
                    <option key={optionId} value={optionId}>
                      {getCardLabel(card)}
                    </option>
                  );
                })}
              </select>
            </div>
            {this.state.selectedCardId === 'new' && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    className="input"
                    placeholder="Nro. tarjeta"
                    value={this.state.cardNumber}
                    onChange={(e)=>this.setState({ cardNumber: e.target.value })}
                    required
                  />
                  <input
                    className="input"
                    placeholder="MM/AA"
                    value={this.state.cardExpiry}
                    onChange={(e)=>this.setState({ cardExpiry: e.target.value })}
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    className="input"
                    placeholder="CVV"
                    value={this.state.cardCvv}
                    onChange={(e)=>this.setState({ cardCvv: e.target.value })}
                    required
                  />
                  <div className="hidden md:block" />
                </div>
              </>
            )}
            {usingSavedCard && (
              <div className="p-3 rounded bg-slate-100 text-slate-600 text-sm">
                Usando tarjeta guardada: {getCardLabel(this.state.cards.find((card) => String(card.id) === String(this.state.selectedCardId)))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total a pagar</span>
              <span className="text-xl font-semibold">S/ {Number(this.state.total).toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" disabled={this.state.paying}>
              {this.state.paying ? "Procesando..." : "Pagar y crear pedido"}
            </button>
          </form>
        </div>
      </section>
    );
  }
}

export default withNavigate(withLocation(Checkout));
