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
      showCardModal: false,
      cardForm: { cardNumber: "", mm: "", yy: "", cvv: "", cardName: "" },
      cashForm: { amount: "", notes: "" },
      savedDetails: { card: null, cash: null },
      detailsError: "",
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

  getCurrentPaymentDetails() {
    const method = this.state.paymentMethod;
    if (!method) return null;
    return this.state.savedDetails[method] || null;
  }

  isPaymentReady() {
    return Boolean(this.getCurrentPaymentDetails());
  }

  handlePay = (event) => {
    const paymentDetails = this.getCurrentPaymentDetails();
    this.controller.pay({
      event,
      navigate: this.props.navigate,
      paymentDetails,
    });
  };

  handlePaymentMethodChange = (event) => {
    const nextMethod = event.target.value;
    this.setState((prev) => {
      return {
        paymentMethod: nextMethod,
        showCardModal: false,
        detailsError: "",
      };
    });
  };

  handleCardInputChange = (field, value) => {
    if (field === "cardNumber") {
      const digits = (value || "").replace(/\D/g, "").slice(0, 16);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1-");
      this.setState((prev) => ({
        cardForm: { ...prev.cardForm, cardNumber: formatted },
      }));
      return;
    }
    if (field === "mm" || field === "yy" || field === "cvv") {
      const limit = field === "cvv" ? 3 : 2;
      const digits = (value || "").replace(/\D/g, "").slice(0, limit);
      this.setState((prev) => ({
        cardForm: { ...prev.cardForm, [field]: digits },
      }));
      return;
    }
    this.setState((prev) => ({
      cardForm: { ...prev.cardForm, [field]: value },
    }));
  };

  handleCashInputChange = (field, value) => {
    this.setState((prev) => ({
      cashForm: { ...prev.cashForm, [field]: value },
    }));
  };

  handleSaveCardDetails = () => {
    const { cardNumber, mm, yy, cvv, cardName } = this.state.cardForm;
    const digits = (cardNumber || "").replace(/\D/g, "");
    if (
      digits.length !== 16 ||
      mm.length !== 2 ||
      yy.length !== 2 ||
      cvv.length !== 3 ||
      !cardName.trim()
    ) {
      this.setState({
        detailsError: "Completa la información de la tarjeta para continuar.",
      });
      return;
    }

    const last4 = digits.slice(-4);
    const userSummary = `Tarjeta terminada en ${last4}`;
    const publicSummary = "Pago con tarjeta confirmado";
    const savedEntry = {
      method: "card",
      userSummary,
      publicSummary,
    };

    this.setState((prev) => ({
      savedDetails: { ...prev.savedDetails, card: savedEntry },
      showCardModal: false,
      detailsError: "",
      cardForm: { cardNumber: "", mm: "", yy: "", cvv: "", cardName: "" },
    }));
  };

  handleSaveCashDetails = () => {
    const { amount, notes } = this.state.cashForm;
    const numeric = Number(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      this.setState({
        detailsError: "Ingresa el monto con el que pagarás.",
      });
      return;
    }
    const formattedAmount = Number(numeric).toFixed(2);
    const amountText = `Pagará con S/ ${formattedAmount}`;
    const noteValue = notes?.trim() || "";
    const userSummary = noteValue ? `${amountText} · Nota: ${noteValue}` : amountText;
    const publicAmount = amountText.toUpperCase();
    const publicSummary = noteValue ? `${publicAmount}. Nota: ${noteValue}` : publicAmount;
    const savedEntry = {
      method: "cash",
      amount: formattedAmount,
      notes: noteValue,
      userSummary,
      publicSummary,
    };
    this.setState((prev) => ({
      savedDetails: { ...prev.savedDetails, cash: savedEntry },
      detailsError: "",
    }));
  };

  handleEditCashDetails = () => {
    this.setState((prev) => ({
      savedDetails: { ...prev.savedDetails, cash: null },
      detailsError: "",
    }));
  };

  openCardModal = () => {
    if (this.state.paymentMethod === "card") {
      this.setState({ showCardModal: true, detailsError: "" });
    }
  };

  closeCardModal = () => {
    this.setState({ showCardModal: false, detailsError: "" });
  };

  renderCashFields(saved) {
    if (saved) {
      return (
        <div className="rounded border border-slate-200 p-3 bg-slate-50">
          <p className="text-sm text-slate-500">Datos guardados</p>
          <p className="font-medium text-slate-700">{saved.userSummary}</p>
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={this.handleEditCashDetails}
          >
            Editar monto
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
          inputMode="decimal"
          value={this.state.cashForm.amount}
          onChange={(e) => this.handleCashInputChange("amount", e.target.value)}
          required
        />
        <textarea
          className="input min-h-[90px]"
          name="notes"
          placeholder="Indicaciones para el repartidor (opcional)"
          value={this.state.cashForm.notes}
          onChange={(e) => this.handleCashInputChange("notes", e.target.value)}
        ></textarea>
        <button
          type="button"
          className="btn btn-secondary max-w-fit"
          onClick={this.handleSaveCashDetails}
        >
          Guardar datos
        </button>
      </div>
    );
  }

  renderPaymentFields() {
    const method = this.state.paymentMethod;
    const saved = method ? this.state.savedDetails[method] : null;
    let content = null;

    if (!method) {
      content = (
        <p className="text-sm text-slate-500">
          Selecciona un método para ingresar los datos de pago.
        </p>
      );
    } else if (method === "card") {
      content = saved ? (
        <div className="rounded border border-slate-200 p-3 bg-slate-50">
          <p className="text-sm text-slate-500">Datos de tarjeta guardados</p>
          <p className="font-medium text-slate-700">{saved.userSummary}</p>
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={this.openCardModal}
          >
            Editar tarjeta
          </button>
        </div>
      ) : (
        <div className="grid gap-2" aria-label="Datos de tarjeta">
          <p className="text-sm text-slate-500">
            Necesitas ingresar los datos de tu tarjeta para continuar.
          </p>
          <button
            type="button"
            className="btn btn-secondary max-w-fit"
            onClick={this.openCardModal}
          >
            Ingresar tarjeta
          </button>
        </div>
      );
    } else if (method === "cash") {
      content = this.renderCashFields(saved);
    }

    return (
      <>
        {content}
        {this.state.detailsError && (
          <p className="text-sm text-red-600 mt-2">{this.state.detailsError}</p>
        )}
      </>
    );
  }

  renderCardModal() {
    if (
      this.state.paymentMethod !== "card" ||
      !this.state.showCardModal
    ) {
      return null;
    }

    const { cardForm } = this.state;

    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
        <div className="card relative w-full max-w-md">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={this.closeCardModal}
            className="absolute right-3 top-3 text-slate-500 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
          <h2 className="text-lg font-semibold mb-4">Datos de tarjeta</h2>
          <div className="grid gap-3" aria-label="Formulario de tarjeta">
            <input
              className="input"
              name="cardNumber"
              placeholder="Nro. tarjeta (XXXX-XXXX-XXXX-XXXX)"
              maxLength={19}
              inputMode="numeric"
              value={cardForm.cardNumber}
              onChange={(e) =>
                this.handleCardInputChange("cardNumber", e.target.value)
              }
              required
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                className="input"
                name="mm"
                placeholder="MM"
                pattern="(0[1-9]|1[0-2])"
                maxLength={2}
                value={cardForm.mm}
                onChange={(e) => this.handleCardInputChange("mm", e.target.value)}
                required
              />
              <input
                className="input"
                name="yy"
                placeholder="AA"
                pattern="[0-9]{2}"
                maxLength={2}
                value={cardForm.yy}
                onChange={(e) => this.handleCardInputChange("yy", e.target.value)}
                required
              />
              <input
                className="input"
                name="cvv"
                placeholder="CVV"
                pattern="[0-9]{3}"
                maxLength={3}
                value={cardForm.cvv}
                onChange={(e) => this.handleCardInputChange("cvv", e.target.value)}
                required
              />
            </div>
            <input
              className="input"
              name="cardName"
              placeholder="Nombre en la tarjeta"
              value={cardForm.cardName}
              onChange={(e) => this.handleCardInputChange("cardName", e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleSaveCardDetails}
            >
              Guardar datos
            </button>
            {this.state.detailsError && (
              <p className="text-sm text-red-600">{this.state.detailsError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }



  render() {
    const paymentReady = this.isPaymentReady();
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
                type="text"
                className="input"
                placeholder="Nombre y Apellidos"
                required
                pattern="^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{2,60}$"
                title="Ingresa de 2 a 60 caracteres; solo letras, espacios y acentos."
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
                type="text"
                className="input"
                placeholder="Dirección exacta de entrega"
                required
                pattern="^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9°.,\-# ]{5,80}$"
                title="Ingresa una dirección válida (entre 5 y 80 caracteres: letras, números, espacios y símbolos como ., - # º)."
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
                !paymentReady
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
            {this.renderCardModal()}
          </form>
        </div>
      </section>
    );
  }
}

export default withNavigate(withLocation(Checkout));
