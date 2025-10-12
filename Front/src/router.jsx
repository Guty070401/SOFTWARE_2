import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import Login from "./pages/Login.jsx";
import ChooseRole from "./pages/ChooseRole.jsx";
import CustomerHome from "./pages/customer/CustomerHome.jsx";
import Cart from "./pages/customer/Cart.jsx";
import Checkout from "./pages/customer/Checkout.jsx";
import TrackOrder from "./pages/customer/TrackOrder.jsx";
import CourierHome from "./pages/courier/CourierHome.jsx";
import OrderDetail from "./pages/courier/OrderDetail.jsx";
import Register from "./pages/Register.jsx";

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
    ]
  }
]);

export default router;
