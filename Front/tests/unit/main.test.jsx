import { beforeEach, expect, it, vi } from "vitest";

const { createRootMock, renderMock } = vi.hoisted(()=> {
  const renderMock = vi.fn();
  const createRootMock = vi.fn(() => ({ render: renderMock }));
  return { createRootMock, renderMock };
});

vi.mock("react-dom/client", () => ({
  createRoot: createRootMock,
  default: { createRoot: createRootMock },
}));

describe("main entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    createRootMock.mockClear();
    renderMock.mockClear();
  });

  it("creates the React root and renders the router provider", async () => {
    await import("../../src/main.jsx");
    expect(createRootMock).toHaveBeenCalledWith(document.getElementById("root"));
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
