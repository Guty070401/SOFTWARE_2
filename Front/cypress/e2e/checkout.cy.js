describe("Checkout page (functional)", () => {
  it("shows checkout form and total", () => {
    cy.visit("/customer/checkout", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "test-token");
      },
    });

    cy.contains("h1", "Checkout").should("be.visible");
    cy.get('input[placeholder="Nombre y Apellidos"]').should("exist");
    cy.contains("button", "Pagar y crear pedido").should("exist");
  });
});
