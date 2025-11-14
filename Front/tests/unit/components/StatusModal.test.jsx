import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StatusModal from "../../../src/components/StatusModal.jsx";
import OrderStatus from "../../../src/oop/models/OrderStatus.js";

describe("StatusModal", () => {
  it("does not render content when closed", () => {
    const { container } = render(
      <StatusModal open={false} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists states and triggers callbacks", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    render(<StatusModal open onClose={onClose} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(OrderStatus.DELIVERED));
    expect(onSelect).toHaveBeenCalledWith(OrderStatus.DELIVERED);
    fireEvent.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalled();
  });
});
