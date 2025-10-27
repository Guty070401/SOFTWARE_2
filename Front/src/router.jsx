import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ChooseRole from "./pages/ChooseRole.jsx";
import CustomerHome from "./pages/Customer/CustomerHome.jsx";
import Cart from "./pages/Customer/Cart.jsx";
import Checkout from "./pages/Customer/Checkout.jsx";
import TrackOrder from "./pages/Customer/TrackOrder.jsx";
import CustomerOrders from "./pages/Customer/CustomerOrders.jsx";
import CourierHome from "./pages/Courier/CourierHome.jsx";
import OrderDetail from "./pages/Courier/OrderDetail.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "choose-role", element: <ChooseRole /> },
      { path: "customer", element: <CustomerHome /> },
      { path: "customer/cart", element: <Cart /> },
      { path: "customer/checkout", element: <Checkout /> },
      { path: "customer/track", element: <TrackOrder /> },
      { path: "customer/orders", element: <CustomerOrders /> },
      { path: "courier", element: <CourierHome /> },
      { path: "courier/order/:id", element: <OrderDetail /> },
    ],
  },
]);

export default router;
