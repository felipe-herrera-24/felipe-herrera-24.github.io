const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

const root = join(__dirname, "..");

function createStore() {
  function element() {
    return {
      hidden: true,
      disabled: false,
      textContent: "",
      children: [],
      attributes: {},
      listeners: {},
      addEventListener(type, handler) {
        this.listeners[type] = handler;
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      append(...children) {
        this.children.push(...children);
      },
      replaceChildren(...children) {
        this.children = children;
      },
      focus() {
        this.focused = true;
      },
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
      },
      getBoundingClientRect() {
        return { left: 20, right: 200, top: 20, bottom: 200 };
      },
      click(event = {}) {
        this.listeners.click({ target: this, ...event });
      },
    };
  }
  const selectors = [
    ".cart-dialog",
    "[data-cart-open]",
    "[data-cart-count]",
    "[data-cart-items]",
    "[data-cart-total]",
    "[data-cart-empty]",
    "[data-cart-clear]",
    "[data-cart-status]",
    "[data-cart-close]",
  ];
  const elements = Object.fromEntries(
    selectors.map((selector) => [selector, element()]),
  );
  const buttons = ["lorem", "dolor", "amet"].map((id) =>
    Object.assign(element(), { dataset: { product: id } }),
  );
  const document = {
    querySelector: (selector) => elements[selector],
    querySelectorAll: () => buttons,
    createElement: element,
  };
  runInNewContext(readFileSync(join(root, "store.js"), "utf8"), { document });
  return { elements, buttons };
}

test("cart aggregates repeated items and different prices", () => {
  const { elements, buttons } = createStore();
  assert.equal(elements["[data-cart-open]"].hidden, false);
  assert.ok(buttons.every((button) => !button.hidden));
  buttons[0].click();
  buttons[0].click();
  buttons[1].click();
  buttons[2].click();
  assert.equal(elements["[data-cart-count]"].textContent, 4);
  assert.equal(elements["[data-cart-total]"].textContent, "192.00");
  assert.equal(elements["[data-cart-items]"].children.length, 3);
  assert.equal(
    elements["[data-cart-items]"].children[0].children[0].textContent,
    "Lorem ipsum × 2",
  );
  assert.equal(elements["[data-cart-empty]"].hidden, true);
  assert.equal(elements["[data-cart-clear]"].disabled, false);
  assert.match(
    elements["[data-cart-open]"].attributes["aria-label"],
    /4 artículos/,
  );
  assert.match(
    elements["[data-cart-status]"].textContent,
    /Consectetur añadido/,
  );
});

test("clearing resets totals, rows, availability and keyboard focus", () => {
  const { elements, buttons } = createStore();
  buttons[0].click();
  elements["[data-cart-clear]"].click();
  assert.equal(elements["[data-cart-count]"].textContent, 0);
  assert.equal(elements["[data-cart-total]"].textContent, "0.00");
  assert.equal(elements["[data-cart-items]"].children.length, 0);
  assert.equal(elements["[data-cart-empty]"].hidden, false);
  assert.equal(elements["[data-cart-clear]"].disabled, true);
  assert.equal(elements["[data-cart-close]"].focused, true);
  buttons[1].click();
  assert.equal(elements["[data-cart-total]"].textContent, "64.00");
});

test("cart opens, closes, and only dismisses on an outside click", () => {
  const { elements } = createStore();
  const dialog = elements[".cart-dialog"];
  elements["[data-cart-open]"].click();
  assert.equal(dialog.open, true);
  dialog.click({ clientX: 50, clientY: 50 });
  assert.equal(dialog.open, true);
  dialog.click({ clientX: 5, clientY: 50 });
  assert.equal(dialog.open, false);
  elements["[data-cart-open]"].click();
  elements["[data-cart-close]"].click();
  assert.equal(dialog.open, false);
});

test("static content works without scripts and loads no image or remote assets", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const css = readFileSync(join(root, "styles.css"), "utf8");
  assert.doesNotMatch(
    html,
    /<(img|svg|canvas|iframe)\b|https?:\/\/|\/js\/|\/css\//i,
  );
  assert.doesNotMatch(css, /url\s*\(|@import/i);
  assert.match(html, /data-cart-open\s+hidden/);
  assert.equal((html.match(/data-product="[^"]+"\s+hidden/g) || []).length, 3);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(html.includes(`id="${id}"`), `Missing anchor target: ${id}`);
  }
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /\binfinite\b/);
});
