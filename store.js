(() => {
  const products = {
    lorem: { name: "Lorem ipsum", price: 48 },
    dolor: { name: "Dolor sit amet", price: 64 },
    amet: { name: "Consectetur", price: 32 },
  };
  const quantities = new Map();
  const dialog = document.querySelector(".cart-dialog");
  const cartToggle = document.querySelector("[data-cart-open]");
  const count = document.querySelector("[data-cart-count]");
  const items = document.querySelector("[data-cart-items]");
  const total = document.querySelector("[data-cart-total]");
  const empty = document.querySelector("[data-cart-empty]");
  const clear = document.querySelector("[data-cart-clear]");
  const status = document.querySelector("[data-cart-status]");

  function renderCart() {
    let itemCount = 0;
    let amount = 0;
    const rows = [];
    for (const [id, quantity] of quantities) {
      const product = products[id];
      itemCount += quantity;
      amount += product.price * quantity;
      const row = document.createElement("li");
      const name = document.createElement("span");
      const subtotal = document.createElement("span");
      name.textContent = `${product.name} × ${quantity}`;
      subtotal.textContent = (product.price * quantity).toFixed(2);
      row.append(name, subtotal);
      rows.push(row);
    }
    items.replaceChildren(...rows);
    count.textContent = itemCount;
    total.textContent = amount.toFixed(2);
    empty.hidden = itemCount > 0;
    clear.disabled = itemCount === 0;
    cartToggle.setAttribute(
      "aria-label",
      `Abrir carrito de demostración, ${itemCount} artículos`,
    );
    return itemCount;
  }

  document.querySelectorAll("[data-product]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => {
      const id = button.dataset.product;
      quantities.set(id, (quantities.get(id) || 0) + 1);
      const itemCount = renderCart();
      status.textContent = `${products[id].name} añadido. ${itemCount} artículos en el carrito de demostración.`;
    });
  });

  cartToggle.hidden = false;
  cartToggle.addEventListener("click", () => dialog.showModal());
  document
    .querySelector("[data-cart-close]")
    .addEventListener("click", () => dialog.close());
  clear.addEventListener("click", () => {
    quantities.clear();
    renderCart();
    status.textContent = "Carrito de demostración vacío.";
    document.querySelector("[data-cart-close]").focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      dialog.close();
    }
  });
})();
