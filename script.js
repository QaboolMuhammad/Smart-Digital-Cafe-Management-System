const API_URL = "http://localhost:5000/api";

let cart = [];
let orders = [];
let tables = [];
let staffMembers = [];
let invoiceCounter = 1001;
let adminToken = localStorage.getItem("adminToken");

const menu = [
  { id: 1, name: "Cappuccino", category: "Coffee", price: 450 },
  { id: 2, name: "Latte Coffee", category: "Coffee", price: 500 },
  { id: 3, name: "Espresso", category: "Coffee", price: 350 },
  { id: 4, name: "Zinger Burger", category: "Fast Food", price: 650 },
  { id: 5, name: "Club Sandwich", category: "Fast Food", price: 550 },
  { id: 6, name: "Loaded Fries", category: "Fast Food", price: 480 },
  { id: 7, name: "Chocolate Cake", category: "Dessert", price: 420 },
  { id: 8, name: "Brownie", category: "Dessert", price: 300 },
  { id: 9, name: "Cold Coffee", category: "Cold Drinks", price: 520 },
  { id: 10, name: "Mint Margarita", category: "Cold Drinks", price: 380 }
];

function showToast(message, type = "info") {
  const toastBox = document.getElementById("toastBox");
  if (!toastBox) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  toastBox.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function rupees(amount) {
  return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) section.scrollIntoView({ behavior: "smooth" });
}

function showApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appShell").style.display = "block";
}

function showLogin() {
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("appShell").style.display = "none";
}

async function init() {
  if (!adminToken) {
    showLogin();
    return;
  }

  showApp();

  await loadStaff();
  await loadTables();
  await loadAdminOrders();

  renderSelects();
  renderMenu();
  renderQuickMenu();
  renderCart();
  updateStats();

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  if (searchInput) searchInput.addEventListener("input", renderMenu);
  if (categoryFilter) categoryFilter.addEventListener("change", renderMenu);

  document.addEventListener("mousemove", (e) => {
    const glow = document.getElementById("cursorGlow");
    if (!glow) return;
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
}

async function mainAdminLogin() {
  const email = document.getElementById("mainAdminEmail").value.trim();
  const password = document.getElementById("mainAdminPassword").value.trim();

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Login failed", "error");
      return;
    }

    localStorage.setItem("adminToken", data.token);
    adminToken = data.token;

    showToast("Login successful", "success");
    await init();
  } catch {
    showToast("Backend server is not running", "error");
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminToken");
  adminToken = null;
  cart = [];
  orders = [];
  tables = [];
  staffMembers = [];
  showLogin();
  showToast("Logout successful", "success");
}

async function loadStaff() {
  try {
    const res = await fetch(`${API_URL}/staff`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!res.ok) {
      staffMembers = [];
      renderStaff();
      return;
    }

    staffMembers = await res.json();
    renderStaff();
  } catch {
    staffMembers = [];
    renderStaff();
  }
}

async function addStaff() {
  const name = document.getElementById("staffName").value.trim();
  const phone = document.getElementById("staffPhone").value.trim();
  const role = document.getElementById("staffRole").value;
  const shift = document.getElementById("staffShift").value;

  if (!name) {
    showToast("Staff name required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name, phone, role, shift })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Staff not added", "error");
      return;
    }

    document.getElementById("staffName").value = "";
    document.getElementById("staffPhone").value = "";

    showToast("Staff added successfully", "success");

    await loadStaff();
    renderSelects();
    updateStats();
  } catch {
    showToast("Staff API not working", "error");
  }
}

function renderStaff() {
  const staffList = document.getElementById("staffList");
  if (!staffList) return;

  if (!staffMembers || staffMembers.length === 0) {
    staffList.innerHTML = `<p class="empty">No staff added yet.</p>`;
    return;
  }

  staffList.innerHTML = staffMembers.map(staff => `
    <div class="staff-card">
      <b>${staff.name}</b>
      <p>${staff.phone || "No phone"}</p>
      <span class="badge">${staff.role} • ${staff.shift}</span>
    </div>
  `).join("");
}

async function loadTables() {
  try {
    const res = await fetch(`${API_URL}/tables`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!res.ok) throw new Error();

    const dbTables = await res.json();

    tables = dbTables.map(t => ({
      id: t.tableNo,
      busy: t.busy,
      customer: t.customerName || "",
      guests: t.guests || 0,
      waiter: t.waiter || ""
    }));
  } catch {
    tables = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      busy: false,
      customer: "",
      guests: 0,
      waiter: ""
    }));
  }

  renderTables();
}

function renderSelects() {
  const checkTable = document.getElementById("checkTable");
  const tableSelect = document.getElementById("tableSelect");
  const productSelect = document.getElementById("productSelect");
  const checkWaiter = document.getElementById("checkWaiter");

  if (!checkTable || !tableSelect || !productSelect || !checkWaiter) return;

  checkTable.innerHTML = "";
  tableSelect.innerHTML = `<option value="Takeaway">Takeaway</option>`;
  productSelect.innerHTML = "";
  checkWaiter.innerHTML = `<option value="">Select Waiter</option>`;

  tables.forEach(table => {
    checkTable.innerHTML += `<option value="${table.id}">Table ${table.id}</option>`;
    tableSelect.innerHTML += `<option value="Table ${table.id}">Table ${table.id}</option>`;
  });

  staffMembers
    .filter(s => s.role === "Waiter")
    .forEach(waiter => {
      checkWaiter.innerHTML += `<option value="${waiter.name}">${waiter.name}</option>`;
    });

  menu.forEach(item => {
    productSelect.innerHTML += `<option value="${item.id}">${item.name} - ${rupees(item.price)}</option>`;
  });
}

function renderTables() {
  const grid = document.getElementById("tablesGrid");
  if (!grid) return;

  grid.innerHTML = tables.map(table => `
    <div class="table-card ${table.busy ? "busy" : "free"}">
      <h3>Table ${table.id}</h3>
      <p>${table.busy ? "Busy" : "Free"}</p>
      <small>
        ${table.busy ? `${table.customer} • ${table.guests} guests` : "Available"}
        <br>
        ${table.waiter ? `Waiter: ${table.waiter}` : ""}
      </small>
    </div>
  `).join("");

  updateStats();
}

async function checkInCustomer() {
  const customer = document.getElementById("checkCustomer").value.trim();
  const guests = document.getElementById("checkGuests").value;
  const tableNo = Number(document.getElementById("checkTable").value);
  const waiter = document.getElementById("checkWaiter").value;

  if (!customer) {
    showToast("Please enter customer name", "error");
    return;
  }

  if (!waiter) {
    showToast("Please add/select waiter first", "error");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tables/checkin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ tableNo, customerName: customer, guests, waiter })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Check-in failed", "error");
      return;
    }

    document.getElementById("checkCustomer").value = "";
    await loadTables();
    renderSelects();

    showToast("Customer checked-in successfully", "success");
  } catch {
    showToast("Table API not working", "error");
  }
}

async function resetTables() {
  try {
    const res = await fetch(`${API_URL}/tables/reset-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!res.ok) throw new Error();

    await loadTables();
    renderSelects();
    showToast("All tables reset successfully", "success");
  } catch {
    showToast("Reset failed", "error");
  }
}

function renderMenu() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const grid = document.getElementById("menuGrid");

  if (!grid) return;

  const filtered = menu.filter(item =>
    item.name.toLowerCase().includes(search) &&
    (category === "all" || item.category === category)
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="empty">No menu item found.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="menu-item" onclick="quickAdd(${item.id})">
      <h3>${item.name}</h3>
      <p>${item.category}</p>
      <p class="price">${rupees(item.price)}</p>
    </div>
  `).join("");
}

function renderQuickMenu() {
  const quickMenu = document.getElementById("quickMenu");
  if (!quickMenu) return;

  quickMenu.innerHTML = menu.slice(0, 6).map(item => `
    <div class="quick-item" onclick="quickAdd(${item.id})">
      <h3>${item.name}</h3>
      <p>${item.category}</p>
      <p class="price">${rupees(item.price)}</p>
    </div>
  `).join("");
}

function quickAdd(id) {
  document.getElementById("productSelect").value = id;
  document.getElementById("quantityInput").value = 1;
  addToCart();
}

function addToCart() {
  const productId = Number(document.getElementById("productSelect").value);
  const qty = Number(document.getElementById("quantityInput").value);

  if (qty < 1) {
    showToast("Quantity must be at least 1", "error");
    return;
  }

  const item = menu.find(product => product.id === productId);

  if (!item) {
    showToast("Product not found", "error");
    return;
  }

  const existing = cart.find(product => product.id === productId);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }

  renderCart();
  showToast(`${item.name} added to bill`, "success");
}

function renderCart() {
  const customer = document.getElementById("customerName").value.trim() || "Walk-in Customer";
  const table = document.getElementById("tableSelect").value || "Takeaway";
  const waiter = document.getElementById("orderWaiter").value || "Not Assigned";
  const cartItems = document.getElementById("cartItems");

  setText("invoiceNo", `#INV-${invoiceCounter}`);
  setText("billCustomer", `Customer: ${customer}`);
  setText("billTable", `Table: ${table}`);
  setText("billWaiter", `Waiter: ${waiter}`);
  setText("billDate", new Date().toLocaleString());

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty">No item added yet.</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-row">
        <div>
          <b>${item.name}</b>
          <small>${item.qty} x ${rupees(item.price)}</small>
        </div>
        <strong>${rupees(item.qty * item.price)}</strong>
      </div>
    `).join("");
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  setText("subtotal", rupees(subtotal));
  setText("tax", rupees(tax));
  setText("billTotal", rupees(total));
}

document.addEventListener("change", function(e) {
  if (e.target.id === "tableSelect") {
    const selected = e.target.value;

    if (selected === "Takeaway") {
      document.getElementById("customerName").value = "";
      document.getElementById("orderWaiter").value = "";
    } else {
      const tableNo = Number(selected.replace("Table ", ""));
      const table = tables.find(t => t.id === tableNo);

      if (table && table.busy) {
        document.getElementById("customerName").value = table.customer;
        document.getElementById("orderWaiter").value = table.waiter;
      } else {
        document.getElementById("customerName").value = "";
        document.getElementById("orderWaiter").value = "";
        showToast("This table is free. Check-in customer first.", "info");
      }
    }

    renderCart();
  }
});

document.addEventListener("input", function(e) {
  if (e.target.id === "customerName") renderCart();
});

async function placeOrder() {
  if (cart.length === 0) {
    showToast("Please add at least one item", "error");
    return;
  }

  const customer = document.getElementById("customerName").value.trim() || "Walk-in Customer";
  const table = document.getElementById("tableSelect").value || "Takeaway";
  const waiter = document.getElementById("orderWaiter").value || "Not Assigned";

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax;

  const orderData = {
    invoiceNo: `INV-${invoiceCounter}`,
    customerName: customer,
    tableNo: table,
    waiter,
    items: cart.map(item => ({
      name: item.name,
      category: item.category,
      price: item.price,
      qty: item.qty,
      total: item.price * item.qty
    })),
    subtotal,
    tax,
    grandTotal
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Order not saved", "error");
      return;
    }

    showToast("Order saved successfully", "success");

    invoiceCounter++;
    cart = [];

    document.getElementById("customerName").value = "";
    document.getElementById("orderWaiter").value = "";
    document.getElementById("tableSelect").value = "Takeaway";

    await loadAdminOrders();
    renderCart();
    updateStats();
  } catch {
    showToast("Backend server is not running", "error");
  }
}

async function loadAdminOrders() {
  if (!adminToken) return;

  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!res.ok) {
      localStorage.removeItem("adminToken");
      adminToken = null;
      showLogin();
      return;
    }

    orders = await res.json();
    renderOrders();
    updateStats();
  } catch {
    orders = [];
    renderOrders();
  }
}

function renderOrders() {
  const recentOrders = document.getElementById("recentOrders");
  if (!recentOrders) return;

  if (!orders || orders.length === 0) {
    recentOrders.innerHTML = `<p class="empty">No orders found.</p>`;
    return;
  }

  recentOrders.innerHTML = orders.map(order => `
    <div class="order-row">
      <div>
        <b>${order.invoiceNo} • ${order.customerName}</b>
        <small>
          ${order.tableNo} • Waiter: ${order.waiter || "Not Assigned"}
          <br>
          ${order.items.map(i => `${i.name} x${i.qty}`).join(", ")}
        </small>
      </div>
      <strong>${rupees(order.grandTotal)}</strong>
    </div>
  `).join("");
}

function updateStats() {
  const totalSales = orders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0);
  const totalOrders = orders.length;
  const busyTables = tables.filter(table => table.busy).length;

  setText("salesTotal", rupees(totalSales));
  setText("ordersTotal", totalOrders);
  setText("busyTables", `${busyTables}/10`);
  setText("staffTotal", staffMembers.length);
  setText("menuCount", menu.length);
  setText("heroRevenue", rupees(totalSales));
  setText("heroOrders", totalOrders);
}

function clearCart() {
  cart = [];
  renderCart();
  showToast("Bill cleared", "info");
}

function printBill() {
  if (cart.length === 0) {
    showToast("Please add items before printing bill", "error");
    return;
  }

  window.print();
}

init();