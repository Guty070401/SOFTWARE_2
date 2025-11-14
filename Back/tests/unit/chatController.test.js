const chatController = require("../../src/controllers/chatController");
const chatService = require("../../src/services/chatService");

jest.mock("../../src/services/chatService", () => ({
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
}));

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

describe("chatController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns chat history", async () => {
    const req = { params: { id: "ord-1" }, userId: "usr-1" };
    const res = createRes();
    const next = jest.fn();
    chatService.listMessages.mockResolvedValue([{ id: "msg-1" }]);

    await chatController.listChat(req, res, next);

    expect(chatService.listMessages).toHaveBeenCalledWith("ord-1", "usr-1");
    expect(res.json).toHaveBeenCalledWith({ messages: [{ id: "msg-1" }] });
    expect(next).not.toHaveBeenCalled();
  });

  it("delegates errors in listChat", async () => {
    const err = new Error("boom");
    chatService.listMessages.mockRejectedValue(err);
    const next = jest.fn();

    await chatController.listChat({ params: { id: "ord-1" }, userId: "usr" }, createRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("creates chat message", async () => {
    const req = { params: { id: "ord-2" }, userId: "usr-9", body: { message: "hola" } };
    const res = createRes();
    const next = jest.fn();
    chatService.sendMessage.mockResolvedValue({ id: "msg-2" });

    await chatController.sendChat(req, res, next);

    expect(chatService.sendMessage).toHaveBeenCalledWith("ord-2", "usr-9", "hola");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: { id: "msg-2" } });
  });

  it("delegates errors in sendChat", async () => {
    const err = new Error("fail");
    chatService.sendMessage.mockRejectedValue(err);
    const next = jest.fn();

    await chatController.sendChat({ params: { id: "ord" }, userId: "u", body: { message: "" } }, createRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
