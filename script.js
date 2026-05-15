const menuItems = [
  { name: 'Cappuccino', category: 'Coffee', price: 450, emoji: '☕' },
  { name: 'Spanish Latte', category: 'Coffee', price: 620, emoji: '🥛' },
  { name: 'Espresso Shot', category: 'Coffee', price: 320, emoji: '🫘' },
  { name: 'Zinger Burger', category: 'Fast Food', price: 690, emoji: '🍔' },
  { name: 'Club Sandwich', category: 'Fast Food', price: 580, emoji: '🥪' },
  { name: 'Loaded Fries', category: 'Fast Food', price: 420, emoji: '🍟' },
  { name: 'Chocolate Cake', category: 'Dessert', price: 470, emoji: '🍰' },
  { name: 'Brownie Sundae', category: 'Dessert', price: 530, emoji: '🍨' },
  { name: 'Mint Margarita', category: 'Cold Drinks', price: 380, emoji: '🍹' },
  { name: 'Iced Tea', category: 'Cold Drinks', price: 300, emoji: '🧊' }
];

let tables = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, status: 'free', customer: '', guests: 0 }));
let cart = [];
let orders = [];
let invoiceCounter = 1001;

function rupees(amount) { return `Rs. ${amount.toLocaleString('en-PK')}`; }
function scrollToSection(id) { document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }

function renderTables() {
  const grid = document.getElementById('tablesGrid');
  const checkTable = document.getElementById('checkTable');
  const tableSelect = document.getElementById('tableSelect');
  grid.innerHTML = tables.map(t => `
    <div class="table-card ${t.status}">
      <b>Table ${t.id}</b>
      <span>${t.status === 'busy' ? 'Busy' : 'Free'}</span>
      <small>${t.status === 'busy' ? `${t.customer} • ${t.guests} guests` : 'Ready for check-in'}</small>
      ${t.status === 'busy' ? `<button onclick="checkoutTable(${t.id})">Checkout</button>` : ''}
    </div>`).join('');
  const freeOptions = tables.filter(t => t.status === 'free').map(t => `<option value="${t.id}">Table ${t.id}</option>`).join('');
  checkTable.innerHTML = freeOptions || '<option value="">No free table</option>';
  tableSelect.innerHTML = '<option value="Takeaway">Takeaway</option>' + tables.map(t => `<option value="Table ${t.id}">Table ${t.id} ${t.status === 'busy' ? '• Busy' : '• Free'}</option>`).join('');
  updateStats();
}

function checkInCustomer() {
  const name = document.getElementById('checkCustomer').value.trim() || 'Walk-in Customer';
  const guests = Number(document.getElementById('checkGuests').value) || 1;
  const tableId = Number(document.getElementById('checkTable').value);
  if (!tableId) return alert('No free table available.');
  const table = tables.find(t => t.id === tableId);
  table.status = 'busy'; table.customer = name; table.guests = guests;
  document.getElementById('checkCustomer').value = '';
  renderTables();
}

function checkoutTable(id) {
  const table = tables.find(t => t.id === id);
  table.status = 'free'; table.customer = ''; table.guests = 0;
  renderTables();
}
function resetTables() { tables.forEach(t => { t.status = 'free'; t.customer = ''; t.guests = 0; }); renderTables(); }

function renderMenu() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const filtered = menuItems.filter(item => item.name.toLowerCase().includes(search) && (category === 'all' || item.category === category));
  document.getElementById('menuGrid').innerHTML = filtered.map((item) => `
    <div class="menu-card" onclick="selectProduct('${item.name}')">
      <div class="emoji">${item.emoji}</div><h3>${item.name}</h3><p>${item.category}</p><b>${rupees(item.price)}</b>
    </div>`).join('');
}

function fillProducts() {
  const select = document.getElementById('productSelect');
  select.innerHTML = menuItems.map((item, index) => `<option value="${index}">${item.name} - ${rupees(item.price)}</option>`).join('');
  document.getElementById('quickMenu').innerHTML = menuItems.slice(0, 6).map(item => `<button onclick="quickAdd('${item.name}')">${item.emoji} ${item.name}</button>`).join('');
}
function selectProduct(name) { document.getElementById('productSelect').value = menuItems.findIndex(i => i.name === name); scrollToSection('pos'); }
function quickAdd(name) { document.getElementById('productSelect').value = menuItems.findIndex(i => i.name === name); addToCart(); }

function addToCart() {
  const product = menuItems[Number(document.getElementById('productSelect').value)];
  const qty = Math.max(1, Number(document.getElementById('quantityInput').value) || 1);
  const existing = cart.find(i => i.name === product.name);
  if (existing) existing.qty += qty; else cart.push({ ...product, qty });
  updateInvoiceInfo(); renderCart();
}

function updateInvoiceInfo() {
  const customer = document.getElementById('customerName').value.trim() || 'Walk-in Customer';
  const table = document.getElementById('tableSelect').value || 'Takeaway';
  document.getElementById('billCustomer').innerText = `Customer: ${customer}`;
  document.getElementById('billTable').innerText = `Table: ${table}`;
  document.getElementById('billDate').innerText = new Date().toLocaleString();
  document.getElementById('invoiceNo').innerText = `#INV-${invoiceCounter}`;
}

function renderCart() {
  updateInvoiceInfo();
  const box = document.getElementById('cartItems');
  if (cart.length === 0) box.innerHTML = '<p class="empty">No item added yet.</p>';
  let subtotal = 0;
  if (cart.length) box.innerHTML = cart.map((item, index) => {
    const amount = item.price * item.qty; subtotal += amount;
    return `<div class="cart-row"><span>${item.name}<small>${item.qty} × ${rupees(item.price)}</small></span><b>${rupees(amount)}</b><button class="no-print" onclick="removeItem(${index})">×</button></div>`;
  }).join('');
  const tax = Math.round(subtotal * 0.05);
  document.getElementById('subtotal').innerText = rupees(subtotal);
  document.getElementById('tax').innerText = rupees(tax);
  document.getElementById('billTotal').innerText = rupees(subtotal + tax);
}
function removeItem(index) { cart.splice(index, 1); renderCart(); }
function clearCart() { cart = []; renderCart(); }

function placeOrder() {
  if (cart.length === 0) return alert('Please add at least one item before placing order.');
  const customer = document.getElementById('customerName').value.trim() || 'Walk-in Customer';
  const table = document.getElementById('tableSelect').value || 'Takeaway';
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  orders.unshift({ invoice: invoiceCounter, customer, table, items: cart.map(i => `${i.name} x${i.qty}`).join(', '), total: subtotal + tax, time: new Date().toLocaleTimeString() });
  invoiceCounter++;
  cart = [];
  document.getElementById('customerName').value = '';
  renderOrders(); renderCart(); updateStats();
  alert('Order placed successfully and saved in recent records.');
}

function renderOrders() {
  const box = document.getElementById('recentOrders');
  box.innerHTML = orders.length ? orders.map(o => `<div class="order-row"><div><b>#INV-${o.invoice} • ${o.customer}</b><small>${o.table} • ${o.items} • ${o.time}</small></div><strong>${rupees(o.total)}</strong></div>`).join('') : '<p class="empty">No orders placed yet.</p>';
}
function updateStats() {
  const sales = orders.reduce((s, o) => s + o.total, 0);
  document.getElementById('salesTotal').innerText = rupees(sales);
  document.getElementById('ordersTotal').innerText = orders.length;
  document.getElementById('heroRevenue').innerText = rupees(sales);
  document.getElementById('heroOrders').innerText = orders.length;
  document.getElementById('busyTables').innerText = `${tables.filter(t => t.status === 'busy').length}/10`;
  document.getElementById('menuCount').innerText = menuItems.length;
}
function printBill() {
  if (cart.length === 0) return alert('Add items first, then print bill.');
  updateInvoiceInfo();
  window.print();
}

['searchInput','categoryFilter'].forEach(id => document.getElementById(id).addEventListener(id === 'searchInput' ? 'input' : 'change', renderMenu));
['customerName','tableSelect'].forEach(id => document.getElementById(id).addEventListener('input', updateInvoiceInfo));
document.addEventListener('mousemove', e => { const g = document.getElementById('cursorGlow'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; });

const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); }), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

renderTables(); renderMenu(); fillProducts(); renderOrders(); renderCart(); updateStats();
