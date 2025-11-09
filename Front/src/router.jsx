import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import Login from "./pages/Login.jsx";
import ChooseRole from "./pages/ChooseRole.jsx";
import CustomerHome from "./pages/Customer/CustomerHome.jsx";
import Cart from "./pages/customer/Cart.jsx";
import Checkout from "./pages/Customer/Checkout.jsx";
import TrackOrder from "./pages/customer/TrackOrder.jsx";
import CourierHome from "./pages/courier/CourierHome.jsx";
import OrderDetail from "./pages/Courier/OrderDetail.jsx";
import Register from "./pages/Register.jsx";
import CustomerOrders from "./pages/Customer/CustomerOrders";

// Rutas de la aplicación
const router = createBrowserRouter([
  { path: "/", element: <App />,
    children: [
      { index: true, element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "choose-role", element: <ChooseRole /> },
      { path: "customer", element: <CustomerHome /> },
      { path: "customer/cart", element: <Cart /> },
      { path: "customer/checkout", element: <Checkout /> },
      { path: "customer/track", element: <TrackOrder /> },
      { path: "courier", element: <CourierHome /> },
      { path: "courier/order/:id", element: <OrderDetail /> },
      { path: "/customer/orders", element: <CustomerOrders /> },

    ]
  }
]);

export default router;
