import { vi } from "vitest";

export function createAppStateMock(){
  const listeners = new Map();
  const mock = {
    cart: [],
    orders: [],
    user: null,
    on: vi.fn((event, handler)=>{
      listeners.set(event, handler);
      return ()=> listeners.delete(event);
    }),
    emit: vi.fn((event, payload)=>{
      const handler = listeners.get(event);
      handler?.(payload);
    }),
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    setRole: vi.fn(),
    clearCart: vi.fn(),
    addToCart: vi.fn(),
    placeOrder: vi.fn().mockResolvedValue({ id: 123 }),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    fetchOrders: vi.fn().mockResolvedValue([]),
    initialize: vi.fn(),
    logout: vi.fn(),
    subscribeToChat: vi.fn().mockImplementation(() => vi.fn()),
    ensureChatSession: vi.fn(),
    sendChatMessage: vi.fn().mockResolvedValue(undefined),
  };

  const reset = ()=>{
    mock.cart = [];
    mock.orders = [];
    mock.user = null;
    listeners.clear();
    mock.on.mockClear();
    mock.login.mockClear();
    mock.register.mockClear();
    mock.setRole.mockClear();
    mock.clearCart.mockClear();
    mock.addToCart.mockClear();
    mock.placeOrder.mockClear();
    mock.updateStatus.mockClear();
    mock.fetchOrders.mockClear();
    mock.initialize.mockClear();
    mock.logout.mockClear();
    mock.emit.mockClear();
    mock.subscribeToChat.mockClear();
    mock.ensureChatSession.mockClear();
    mock.sendChatMessage.mockClear();
  };

  return { mock, listeners, reset };
}
