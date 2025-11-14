import { describe, it, expect, vi, beforeEach } from "vitest";

const { createBrowserRouterMock } = vi.hoisted(()=> ({
  createBrowserRouterMock: vi.fn((routes)=> routes),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createBrowserRouter: (...args)=> createBrowserRouterMock(...args),
  };
});

const { componentMock } = vi.hoisted(()=> {
  const componentStub = ()=> null;
  const componentMock = () => ({ default: componentStub });
  return { componentMock };
});

vi.mock("../../src/App.jsx", componentMock);
vi.mock("../../src/pages/Login.jsx", componentMock);
vi.mock("../../src/pages/ChooseRole.jsx", componentMock);
vi.mock("../../src/pages/Customer/CustomerHome.jsx", componentMock);
vi.mock("../../src/pages/customer/Cart.jsx", componentMock);
vi.mock("../../src/pages/Customer/Checkout.jsx", componentMock);
vi.mock("../../src/pages/customer/TrackOrder.jsx", componentMock);
vi.mock("../../src/pages/courier/CourierHome.jsx", componentMock);
vi.mock("../../src/pages/Courier/OrderDetail.jsx", componentMock);
vi.mock("../../src/pages/Register.jsx", componentMock);
vi.mock("../../src/pages/Customer/CustomerOrders", componentMock);
vi.mock("../../src/pages/AdminCatalog", componentMock);

describe("router definition", () => {
  beforeEach(() => {
    vi.resetModules();
    createBrowserRouterMock.mockClear();
  });

  it("configures routes for all major screens", async () => {
    const router = (await import("../../src/router.jsx")).default;
    expect(createBrowserRouterMock).toHaveBeenCalledTimes(1);
    const routes = createBrowserRouterMock.mock.calls[0][0];
    const paths = routes[0].children.map((child)=> child.path ?? (child.index ? "index" : undefined));
    expect(paths).toEqual([
      "index",
      "register",
      "choose-role",
      "customer",
      "customer/cart",
      "customer/checkout",
      "customer/track",
      "courier",
      "courier/order/:id",
      "customer/order/:id",
      "/customer/orders",
      "admin/catalog",
    ]);
    expect(router).toBe(routes);
  });
});
