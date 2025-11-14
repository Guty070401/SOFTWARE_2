const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const orderService = require("../services/orderService");
const chatController = require("../controllers/chatController");

const normalizeItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    productoId: item.productoId ?? item.productId ?? item.id,
    cantidad: Number(item.cantidad ?? item.qty ?? item.quantity ?? 1),
    precio: Number(item.precio ?? item.price ?? 0),
  }));
};

const sendError = (res, error) =>
  res.status(error?.status || 500).json({ message: error?.message || "Error" });

router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await orderService.listOrdersForUser(req.userId);
    res.json({ orders });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const storeId = req.body.storeId ?? req.body.tiendaId;
    const items = normalizeItems(req.body.items);
    if (!storeId) return res.status(400).json({ message: "storeId es requerido" });
    if (!items.length) return res.status(400).json({ message: "items no puede estar vacío" });

    const payload = {
      storeId,
      items,
      tarjetaId: req.body.tarjetaId ?? req.body.cardId ?? null,
      direccionEntrega: req.body.direccion ?? req.body.direccionEntrega ?? req.body.address ?? "",
      comentarios: req.body.comentarios ?? req.body.notes ?? "",
    };
    const order = await orderService.createOrder(req.userId, payload);
    res.status(201).json({ order });
  } catch (error) {
    console.error("[orders] create error", error);
    sendError(res, error);
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const order = await orderService.getOrderByIdForUser(req.params.id, req.userId);
    res.json({ order });
  } catch (error) {
    sendError(res, error);
  }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ order });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/:id/chat", requireAuth, chatController.listChat);
router.post("/:id/chat", requireAuth, chatController.sendChat);

module.exports = router;
