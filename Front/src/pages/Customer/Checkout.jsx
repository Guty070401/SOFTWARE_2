import React from "react";
import { useLocation, Link } from "react-router-dom";
import CheckoutController from "../../oop/controllers/CheckoutController";
import withNavigate from "../../oop/router/withNavigate";

function withLocation(Component) {
  return (props) => <Component {...props} location={useLocation()} />;
}

export class Checkout extends React.Component {
  constructor(props) {
    super(props);
    this.controller = CheckoutController.getInstance();
    this.state = {
      ...this.controller.getState(),
      paymentMethod: "card",
      detailsSaved: false,
    };
  }

  componentDidMount() {
    this.unsubscribe = this.controller.subscribe((state) =>
      this.setState((prev) => ({ ...prev, ...state }))
    );
    this.controller.initialize(this.props);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.location?.state?.total !== this.props.location?.state?.total
    ) {
      this.controller.initialize(this.props);
    }
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  handlePay = (event) => {
    this.controller.pay({ event, navigate: this.props.navigate });
  };

  handlePaymentMethodChange = (event) => {
    this.setState({ paymentMethod: event.target.value, detailsSaved: false });
  };

  handleSavePaymentDetails = () => {
    this.setState({ detailsSaved: true });
  };

  renderPaymentFields() {
    const method = this.state.paymentMethod;
    if (!method) {
      return (
        <p className="text-sm text-slate-500">
          Selecciona un método para ingresar los datos de pago.
        </p>
      );
    }
    if (method === "card") {
      return (
        <div className="grid gap-3" aria-label="Datos de tarjeta">
          <input
            className="input"
            name="cardNumber"
            placeholder="Nro. tarjeta (XXXX-XXXX-XXXX-XXXX)"
            maxLength={19}
            inputMode="numeric"
            onInput={(e) => {
              const digits = (e.target.value || "")
                .replace(/\D/g, "")
                .slice(0, 16);
              e.target.value = digits.replace(/(\d{4})(?=\d)/g, "$1-");
            }}
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input"
              name="mm"
              placeholder="MM"
              pattern="(0[1-9]|1[0-2])"
              maxLength={2}
              required
            />
            <input
              className="input"
              name="yy"
              placeholder="AA"
              pattern="[0-9]{2}"
              maxLength={2}
              required
            />
            <input
              className="input"
              name="cvv"
              placeholder="CVV"
              pattern="[0-9]{3}"
              maxLength={3}
              required
            />
          </div>
          <input
            className="input"
            name="cardName"
            placeholder="Nombre en la tarjeta"
            required
          />
          <button
            type="button"
            className="btn btn-secondary max-w-fit"
            onClick={this.handleSavePaymentDetails}
          >
            Guardar datos
          </button>
        </div>
      );
    }
    return (
      <div className="grid gap-3" aria-label="Pago en efectivo">
        <input
          className="input"
          name="cashAmount"
          placeholder="Monto con el que pagarás"
          inputMode="numeric"
          required
        />
        <textarea
          className="input min-h-[90px]"
          name="notes"
          placeholder="Indicaciones para el repartidor (opcional)"
        ></textarea>
        <button
          type="button"
          className="btn btn-secondary max-w-fit"
          onClick={this.handleSavePaymentDetails}
        >
          Guardar datos
        </button>
      </div>
    );
  }

  render() {
    return (
      <section className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Checkout</h1>
          <p className="text-slate-500 mb-4">
            Completa tus datos para confirmar.
          </p>

          <form onSubmit={this.handlePay} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nombre y Apellidos"
                pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+"
                title="Solo letras y espacios"
                required
              />
              <input
                className="input"
                placeholder="Teléfono"
                inputMode="numeric"
                maxLength={9}
                pattern="9[0-9]{8}"
                title="Teléfono de 9 dígitos que empieza con 9"
                required
              />
            </div>

            <input
              className="input"
              placeholder="Dirección exacta de entrega"
              pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\\s]+"
              title="Solo letras, números y espacios"
              required
            />

            <div>
              <label
                className="text-sm text-slate-500"
                htmlFor="paymentMethod"
              >
                Método de pago
              </label>
              <select
                id="paymentMethod"
                className="input mt-1"
                value={this.state.paymentMethod}
                onChange={this.handlePaymentMethodChange}
              >
                <option value="">Selecciona método</option>
                <option value="card">Tarjeta</option>
                <option value="cash">Efectivo</option>
              </select>
              <div className="mt-3">{this.renderPaymentFields()}</div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total a pagar</span>
              <span className="text-xl font-semibold">
                S/ {Number(this.state.total || 0).toFixed(2)}
              </span>
            </div>

            {this.state.error && (
              <div className="text-red-600 text-sm">{this.state.error}</div>
            )}

            <button
              className="btn btn-primary"
              disabled={
                this.state.paying ||
                !this.state.paymentMethod ||
                !this.state.detailsSaved
              }
            >
              {this.state.paying ? "Procesando..." : "Pagar y crear pedido"}
            </button>

            <Link
              to="/customer/cart"
              className="btn w-full border border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              Volver al carrito
            </Link>
          </form>
        </div>
      </section>
    );
  }
}

export default withNavigate(withLocation(Checkout));
