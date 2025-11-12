Resumen de cambios – Checkout → Detalle de Pedido

- Problema: al finalizar la compra, el botón "Pagar y crear pedido" navegaba a la ruta `/customer/order/:id`, que no existe en `Front/src/router.jsx`, provocando un 404.

- Cambios aplicados:
  - `Front/src/pages/Customer/Checkout.jsx`:
    - Reescrito el flujo de pago para crear la orden usando `appState.placeOrder()` (persiste en backend y actualiza `appState.orders`).
    - Redirección al detalle del pedido recién creado con la nueva ruta de cliente: ``/customer/order/${order.id}``.
  - `Front/src/router.jsx`:
    - Se añadió la ruta: `customer/order/:id` reutilizando el componente de detalle existente.

- Vistas/archivos afectados:
  - `Front/src/pages/Customer/Checkout.jsx`: crea y guarda la orden en backend, y navega al detalle del pedido.
  - `Front/src/router.jsx`: nueva ruta `customer/order/:id` para ver el pedido recién creado desde el flujo de cliente.
  - `Front/src/pages/Courier/OrderDetail.jsx`: componente reutilizado para mostrar el detalle (si el rol no es courier, oculta acciones de repartidor y el botón “volver” apunta a pedidos del cliente).

- Comportamiento actual tras el cambio:
  - El pedido se guarda en el backend mediante `appState.placeOrder()` y se agrega a `appState.orders`.
  - El carrito se limpia automáticamente dentro de `placeOrder()`.
  - Tras pagar, el usuario es llevado a la vista de detalle del pedido recién creado: `'/customer/order/:id'`.
  - Se enriquece la orden creada con la información del carrito para poder mostrar nombre y precio de ítems inmediatamente en el detalle, incluso si el backend no devuelve esos campos. Esto se realiza en `AppState.placeOrder()`.

- Nota:
  - Se reutiliza el componente `OrderDetail` de repartidor también para cliente. El componente detecta el rol y sólo muestra acciones de actualización de estado cuando el rol es “courier”.

- Cómo probar:
  1) Iniciar sesión y agregar productos al carrito.
  2) Ir a Checkout y pulsar "Pagar y crear pedido".
  3) Verificar que redirige a `'/customer/order/:id'` mostrando sólo el pedido recién creado (con ítems y total) y que el backend recibe la orden.
