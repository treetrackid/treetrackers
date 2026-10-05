const TT = {
  products: {
    totebag: {
      id: 'totebag',
      name: 'Eco Tote Bag',
      price: 30000,
      emoji: '👜',
      description: 'A reusable everyday tote designed for lighter, greener routines.',
      contribution: '20% of profit supports TreeTrack #1.'
    },
    pencil: {
      id: 'pencil',
      name: 'Plantable Pencil',
      price: 10000,
      emoji: '✏️🌱',
      description: 'A plantable pencil that can return to the soil when you are done writing.',
      contribution: '20% of profit supports TreeTrack #1.'
    },
    plantingkit: {
      id: 'plantingkit',
      name: 'Planting Kit',
      price: 25000,
      emoji: '🪴',
      description: 'A simple starter kit for growing a small decorative plant at home.',
      contribution: '20% of profit supports TreeTrack #1.'
    }
  },
  mapLocations: [
    {
      id: 'suropati',
      name: 'Taman Suropati',
      district: 'Menteng, Jakarta Pusat',
      query: 'Taman Suropati Jakarta',
      note: 'A central urban park that can represent a future TreeTrack community planting touchpoint.'
    },
    {
      id: 'gbk',
      name: 'Hutan Kota GBK',
      district: 'Senayan, Jakarta Pusat',
      query: 'Hutan Kota GBK Jakarta',
      note: 'A major urban green-space reference for future city greening and public engagement.'
    },
    {
      id: 'tebet',
      name: 'Tebet Eco Park',
      district: 'Tebet, Jakarta Selatan',
      query: 'Tebet Eco Park Jakarta',
      note: 'A strong example of a community-facing green space and a useful benchmark for future campaigns.'
    },
    {
      id: 'ragunan',
      name: 'Ragunan Green Area',
      district: 'Pasar Minggu, Jakarta Selatan',
      query: 'Ragunan Jakarta',
      note: 'A large green area that highlights the importance of vegetation and biodiversity in the city.'
    },
    {
      id: 'srengseng',
      name: 'Hutan Kota Srengseng',
      district: 'Kembangan, Jakarta Barat',
      query: 'Hutan Kota Srengseng Jakarta',
      note: 'An urban forest reference point for the western side of Jakarta.'
    },
    {
      id: 'muara-angke',
      name: 'Mangrove Muara Angke',
      district: 'Penjaringan, Jakarta Utara',
      query: 'Mangrove Muara Angke Jakarta',
      note: 'A coastal green area highlighting the importance of urban and coastal ecosystems.'
    }
  ],
  phases: [
    { key: 'waiting', label: 'Waiting to be planted', short: 'Waiting', description: 'Your tree is registered to the campaign and waiting for the end-of-month planting day.', percent: 8 },
    { key: 'planted', label: 'Planted', short: 'Planted', description: 'Your tree has been planted at its assigned campaign location.', percent: 34 },
    { key: 'sprout', label: 'First sprout', short: 'Sprout', description: 'The young tree has started to establish itself in the soil.', percent: 65 },
    { key: 'growing', label: 'Growing', short: 'Growing', description: 'The tree is established and continuing its monthly growth journey.', percent: 90 }
  ]
};


/* =========================================================
   Campaign Tree #1 — shared growth state
   The admin dashboard updates this single campaign state.
   My Tree reads the same state for every adopter.
   ========================================================= */
TT.campaignTreeDefault = {
  campaign: 'Campaign Tree #1',
  phase: 'waiting',
  title: 'Waiting to be planted',
  description: 'Your tree is registered to the campaign and waiting for the end-of-month planting day.',
  updateDate: '',
  updatedAt: '',
  imageUrl: '',
  imageFileId: ''
};
TT.campaignTree = { ...TT.campaignTreeDefault };


/* =========================================================
   TreeTrack Order Managementk
   Local-first so the static website works immediately.
   Set TT.orderApiUrl to a deployed Google Apps Script Web App
   endpoint when you want orders shared across devices.
   ========================================================= */
TT.orderApiUrl = 'https://script.google.com/macros/s/AKfycbzbgyhVFCBz81z1Bw7u60rMAiPTu5ZsMLeDBeMBV6pQT2WuIctzUr9U0xwkvQXvUBRCBA/exec';
TT.adminUsername = 'admin';
TT.adminPasswordHash = '308b683255e0e243df7f808f4081c85cc1edab3cd33c67bf2c5ec00ce2655dc8';
TT.orderStatuses = [
  { key: 'pending', label: 'Awaiting WhatsApp confirmation' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'paid', label: 'Payment received' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' }
];

function getOrders() {
  return getJSON('tt_orders', []);
}

function saveOrders(orders) {
  setJSON('tt_orders', orders);
}

function statusLabel(key) {
  return TT.orderStatuses.find(item => item.key === key)?.label || key || 'Unknown';
}

function statusClass(key) {
  return `status status-${key}`;
}

function normalizeOrderStatus(order) {
  if (!order) return 'pending';
  if (order.statusKey) return order.statusKey;
  const legacy = String(order.status || '').toLowerCase();
  if (legacy.includes('confirm')) return 'confirmed';
  return 'pending';
}

function saveOrder(order) {
  const orders = getOrders();
  const index = orders.findIndex(item => item.id === order.id);
  if (index >= 0) orders[index] = order;
  else orders.unshift(order);
  saveOrders(orders);
}

function getReviews() {
  return getJSON('tt_reviews', []);
}

function saveReviews(reviews) {
  setJSON('tt_reviews', reviews);
}

function getReviewForOrder(orderId) {
  return getReviews().find(review => review.orderId === orderId) || null;
}

function saveReview(review) {
  const reviews = getReviews();
  const index = reviews.findIndex(item => item.id === review.id || item.orderId === review.orderId);
  if (index >= 0) reviews[index] = review;
  else reviews.unshift(review);
  saveReviews(reviews);
  return review;
}

function deleteOrderEverywhere(orderId) {
  const orders = getOrders().filter(order => order.id !== orderId);
  saveOrders(orders);
  const users = getUsers();
  users.forEach(user => {
    user.orders = (user.orders || []).filter(order => order.id !== orderId);
  });
  saveUsers(users);
  const reviews = getReviews().filter(review => review.orderId !== orderId);
  saveReviews(reviews);
  return true;
}

function updateOrderEverywhere(orderId, mutator) {
  const orders = getOrders();
  const index = orders.findIndex(item => item.id === orderId);
  if (index < 0) return null;
  mutator(orders[index]);
  saveOrders(orders);

  const users = getUsers();
  users.forEach(user => {
    const userOrder = (user.orders || []).find(item => item.id === orderId);
    if (userOrder) mutator(userOrder);
  });
  saveUsers(users);
  return orders[index];
}

async function syncOrderRemote(action, order) {
  if (!TT.orderApiUrl) return { ok: false, skipped: true };
  try {
    const response = await fetch(TT.orderApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, order })
    });
    return { ok: response.ok };
  } catch (error) {
    console.warn('TreeTrack remote order sync failed:', error);
    return { ok: false, error };
  }
}

function getOrderForCurrentUser(orderId) {
  const user = getCurrentUser();
  if (!user) return null;
  return (user.orders || []).find(order => order.id === orderId) || null;
}

function cartDetailed() {
  return getCart()
    .map(item => ({ ...item, product: TT.products[item.productId] }))
    .filter(item => item.product && Number(item.quantity) > 0)
    .map(item => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity)),
      subtotal: item.product.price * Math.max(1, Number(item.quantity))
    }));
}

function cartTotal(items = cartDetailed()) {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(entry => entry.productId === productId);
  if (!item) return;
  item.quantity = Math.max(1, Math.min(99, Number(quantity) || 1));
  setCart(cart);
}

function removeCartItem(productId) {
  setCart(getCart().filter(item => item.productId !== productId));
}

function money(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function uid(prefix = 'tt') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Failed to read ${key}`, error);
    return fallback;
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return getJSON('tt_users', []);
}

function saveUsers(users) {
  setJSON('tt_users', users);
}

function getCurrentUserId() {
  return sessionStorage.getItem('tt_current_user') || '';
}

function setCurrentUserId(id) {
  if (id) sessionStorage.setItem('tt_current_user', id);
  else sessionStorage.removeItem('tt_current_user');
}

function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers().find(user => user.id === id) || null;
}

function updateCurrentUser(mutator) {
  const users = getUsers();
  const id = getCurrentUserId();
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return null;
  mutator(users[index]);
  saveUsers(users);
  return users[index];
}

async function sha256(textValue) {
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(textValue);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return btoa(unescape(encodeURIComponent(textValue)));
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(window.__ttToastTimer);
  window.__ttToastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function currentPage() {
  const file = location.pathname.split('/').pop();
  return file || 'index.html';
}

function initNav() {
  const user = getCurrentUser();
  const links = document.querySelectorAll('[data-auth-link]');
  links.forEach(link => {
    if (user) {
      link.textContent = user.name ? `Hi, ${user.name.split(' ')[0]}` : 'My Account';
      link.href = 'account.html';
    } else {
      link.textContent = 'Login';
      link.href = 'login.html';
    }
  });

  const toggle = document.querySelector('[data-mobile-toggle]');
  const nav = document.querySelector('.nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => nav?.classList.remove('open'));
  });

  const cartCount = document.querySelector('[data-cart-count]');
  if (cartCount) cartCount.textContent = String(getCart().reduce((sum, item) => sum + item.quantity, 0));
}

function getCart() {
  return getJSON('tt_cart', []);
}

function setCart(cart) {
  setJSON('tt_cart', cart);
  document.querySelectorAll('[data-cart-count]').forEach(node => {
    node.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
  });
}

function addToCart(productId, quantity = 1, buyNow = false) {
  const product = TT.products[productId];
  if (!product) return;
  if (!getCurrentUser()) {
    sessionStorage.setItem('tt_pending_product', JSON.stringify({ productId, quantity, buyNow }));
    showToast('Please log in first to purchase.');
    setTimeout(() => location.href = 'login.html?redirect=checkout.html', 450);
    return;
  }
  const cart = getCart();
  const existing = cart.find(item => item.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.push({ productId, quantity });
  setCart(cart);
  if (buyNow) {
    location.href = 'checkout.html';
  } else {
    showToast(`${product.name} added to your cart.`);
  }
}

function clearCart() {
  setCart([]);
}

function goToLogin(redirect = 'account.html') {
  location.href = `login.html?redirect=${encodeURIComponent(redirect)}`;
}

function requireLogin(redirect = currentPage()) {
  if (!getCurrentUser()) {
    location.href = `login.html?redirect=${encodeURIComponent(redirect)}`;
    return false;
  }
  return true;
}

function getQuery(name) {
  return new URLSearchParams(location.search).get(name) || '';
}

function initProductButtons() {
  document.querySelectorAll('[data-add-to-cart]').forEach(button => {
    button.addEventListener('click', () => addToCart(button.dataset.addToCart, 1, false));
  });
  document.querySelectorAll('[data-buy-now]').forEach(button => {
    button.addEventListener('click', () => addToCart(button.dataset.buyNow, 1, true));
  });
}

function renderProductList(targetSelector, compact = false) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  target.innerHTML = Object.values(TT.products).map(product => `
    <article class="product-card">
      <div class="product-media" aria-hidden="true">${product.emoji}</div>
      <div class="product-body">
        <div class="product-meta">
          <span class="kicker">TreeTrack #1</span>
          <span class="price">${money(product.price)}</span>
        </div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p><strong>${product.contribution}</strong></p>
        <div class="product-actions">
          <button class="btn btn-outline small" type="button" data-add-to-cart="${product.id}">Add to cart</button>
          <button class="btn btn-primary small" type="button" data-buy-now="${product.id}">Buy now</button>
        </div>
      </div>
    </article>
  `).join('');
  initProductButtons();
}


function initLoginPage() {
  const form = document.querySelector('#loginForm');
  const signupForm = document.querySelector('#signupForm');
  const adminForm = document.querySelector('#adminLoginForm');
  if (!form && !signupForm && !adminForm) return;

  const notice = document.querySelector('[data-login-notice]');
  const redirect = getQuery('redirect') || 'account.html';

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = form.email.value.trim().toLowerCase();
      const password = form.password.value;
      const users = getUsers();
      const passwordHash = await sha256(password);
      const user = users.find(item => item.email === email && item.passwordHash === passwordHash);
      if (!user) {
        if (notice) {
          notice.textContent = 'Email or password is incorrect.';
          notice.className = 'alert error show';
        }
        return;
      }
      setCurrentUserId(user.id);
      const pending = sessionStorage.getItem('tt_pending_product');
      if (pending) {
        sessionStorage.removeItem('tt_pending_product');
        const item = JSON.parse(pending);
        const cart = getCart();
        const existing = cart.find(cartItem => cartItem.productId === item.productId);
        if (existing) existing.quantity += item.quantity;
        else cart.push({ productId: item.productId, quantity: item.quantity });
        setCart(cart);
      }
      location.href = redirect;
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async event => {
      event.preventDefault();
      const name = signupForm.name.value.trim();
      const email = signupForm.email.value.trim().toLowerCase();
      const password = signupForm.password.value;
      const confirm = signupForm.confirm.value;
      const users = getUsers();
      if (!name || !email || !password) return;
      if (password.length < 6) {
        if (notice) { notice.textContent = 'Password must be at least 6 characters.'; notice.className = 'alert error show'; }
        return;
      }
      if (password !== confirm) {
        if (notice) { notice.textContent = 'Passwords do not match.'; notice.className = 'alert error show'; }
        return;
      }
      if (users.some(item => item.email === email)) {
        if (notice) { notice.textContent = 'An account with this email already exists.'; notice.className = 'alert error show'; }
        return;
      }
      const user = {
        id: uid('user'), name, email,
        passwordHash: await sha256(password), phone: '', address: '',
        createdAt: new Date().toISOString(), orders: [], adoptions: []
      };
      users.push(user);
      saveUsers(users);
      setCurrentUserId(user.id);
      const pending = sessionStorage.getItem('tt_pending_product');
      if (pending) {
        sessionStorage.removeItem('tt_pending_product');
        const item = JSON.parse(pending);
        setCart([{ productId: item.productId, quantity: item.quantity }]);
      }
      location.href = redirect;
    });
  }

  if (adminForm) {
    adminForm.addEventListener('submit', async event => {
      event.preventDefault();
      const username = adminForm.username.value.trim();
      const password = adminForm.password.value;
      const hash = await sha256(password);
      const adminNotice = document.querySelector('[data-admin-login-notice]');
      if (username !== TT.adminUsername || hash !== TT.adminPasswordHash) {
        if (adminNotice) {
          adminNotice.textContent = 'Admin username or password is incorrect.';
          adminNotice.className = 'alert error show';
        }
        return;
      }
      sessionStorage.setItem('tt_admin_unlocked', '1');
      location.href = 'admin.html';
    });
  }
}

function initCheckout() {
  const root = document.querySelector('#checkoutRoot');
  if (!root) return;
  if (!requireLogin('checkout.html')) return;

  const user = getCurrentUser();

  function render() {
    const items = cartDetailed();
    if (!items.length) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="kicker">Your cart</div>
          <h2>Your cart is empty.</h2>
          <p>Choose a product to support TreeTrack #1 and get started.</p>
          <a class="btn btn-primary" href="shop.html">Explore products</a>
        </div>`;
      return;
    }

    const total = cartTotal(items);
    root.innerHTML = `
      <div class="checkout-grid">
        <form class="form-card" id="checkoutForm">
          <div class="kicker">TreeTrack #1</div>
          <h1>Complete your details.</h1>
          <p>Review your cart, complete the form, then continue to WhatsApp for manual payment and order confirmation.</p>

          <div class="checkout-cart" aria-label="Cart items">
            <div class="checkout-cart-head">
              <h3>Your products</h3>
              <a class="btn btn-ghost small" href="shop.html">Add more</a>
            </div>
            ${items.map(item => `
              <div class="checkout-item" data-cart-item="${escapeHtml(item.productId)}">
                <div class="checkout-item-icon" aria-hidden="true">${item.product.emoji}</div>
                <div class="checkout-item-main">
                  <strong>${escapeHtml(item.product.name)}</strong>
                  <small>${money(item.product.price)} each</small>
                  <div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.product.name)}">
                    <button type="button" class="quantity-btn" data-cart-minus="${escapeHtml(item.productId)}" aria-label="Decrease quantity">−</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button type="button" class="quantity-btn" data-cart-plus="${escapeHtml(item.productId)}" aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <div class="checkout-item-side">
                  <strong>${money(item.subtotal)}</strong>
                  <button type="button" class="remove-item" data-cart-remove="${escapeHtml(item.productId)}">Remove</button>
                </div>
              </div>`).join('')}
          </div>

          <div class="form-row">
            <div class="field"><label for="name">Full name</label><input id="name" name="name" value="${escapeHtml(user.name)}" required></div>
            <div class="field"><label for="email">Email</label><input id="email" name="email" value="${escapeHtml(user.email)}" type="email" required></div>
          </div>
          <div class="form-row">
            <div class="field"><label for="phone">WhatsApp number</label><input id="phone" name="phone" value="${escapeHtml(user.phone || '')}" placeholder="08xxxxxxxxxx" required></div>
            <div class="field"><label for="city">City</label><input id="city" name="city" placeholder="Jakarta / Depok / etc." required></div>
          </div>
          <div class="field"><label for="address">Delivery address</label><textarea id="address" name="address" placeholder="Full delivery address" required>${escapeHtml(user.address || '')}</textarea></div>
          <div class="field"><label for="notes">Order notes <span style="font-weight:400;color:var(--muted)">(optional)</span></label><textarea id="notes" name="notes" placeholder="Optional notes"></textarea></div>
          <div id="checkoutAlert" class="alert error"></div>
          <div class="form-footer">
            <a class="btn btn-ghost" href="shop.html">Back to shop</a>
            <button class="btn btn-primary" type="submit">Create order &amp; continue to WhatsApp</button>
          </div>
          <div class="form-note">Your order is saved to this TreeTrack account. The admin dashboard can update its status after WhatsApp confirmation.</div>
        </form>
        <aside class="summary-card">
          <div class="kicker">Order summary</div>
          <h2 style="font-size:2.4rem">Your total</h2>
          ${items.map(item => `
            <div class="summary-item">
              <div><strong>${escapeHtml(item.product.name)}</strong><br><small>${item.quantity} × ${money(item.product.price)}</small></div>
              <strong>${money(item.subtotal)}</strong>
            </div>`).join('')}
          <div class="summary-total"><span>Total</span><span>${money(total)}</span></div>
          <div class="summary-highlight"><strong>20% of profit</strong><span>from each product supports the TreeTrack #1 planting campaign.</span></div>
        </aside>
      </div>`;

    root.querySelectorAll('[data-cart-minus]').forEach(button => {
      button.addEventListener('click', () => {
        const current = cartDetailed().find(item => item.productId === button.dataset.cartMinus)?.quantity || 1;
        if (current <= 1) removeCartItem(button.dataset.cartMinus);
        else updateCartQuantity(button.dataset.cartMinus, current - 1);
        render();
      });
    });
    root.querySelectorAll('[data-cart-plus]').forEach(button => {
      button.addEventListener('click', () => {
        const current = cartDetailed().find(item => item.productId === button.dataset.cartPlus)?.quantity || 1;
        updateCartQuantity(button.dataset.cartPlus, current + 1);
        render();
      });
    });
    root.querySelectorAll('[data-cart-remove]').forEach(button => {
      button.addEventListener('click', () => {
        const product = TT.products[button.dataset.cartRemove];
        removeCartItem(button.dataset.cartRemove);
        showToast(`${product?.name || 'Product'} removed from your cart.`);
        render();
      });
    });

    root.querySelector('#checkoutForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const currentItems = cartDetailed();
      if (!currentItems.length) { render(); return; }
      const phone = form.phone.value.trim();
      if (phone.replace(/\D/g, '').length < 9) {
        const alert = form.querySelector('#checkoutAlert');
        alert.textContent = 'Please enter a valid WhatsApp number.';
        alert.className = 'alert error show';
        return;
      }
      const now = new Date();
      const orderId = `TT1-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
      const order = {
        id: orderId,
        campaign: 'TreeTrack #1',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        statusKey: 'pending',
        status: statusLabel('pending'),
        items: currentItems,
        total: cartTotal(currentItems),
        customer: {
          name: form.name.value.trim(),
          email: form.email.value.trim().toLowerCase(),
          phone,
          city: form.city.value.trim(),
          address: form.address.value.trim(),
          notes: form.notes.value.trim()
        },
        adoption: {
          id: uid('tree'),
          phase: 'waiting',
          treeType: 'Campaign Tree #1',
          location: 'Jakarta — assigned at planting day',
          nextUpdate: 'End of month planting update',
          adoptedAt: now.toISOString()
        }
      };

      updateCurrentUser(current => {
        current.name = order.customer.name;
        current.email = order.customer.email;
        current.phone = order.customer.phone;
        current.address = order.customer.address;
        current.orders = current.orders || [];
        current.adoptions = current.adoptions || [];
        current.orders.unshift(order);
        current.adoptions.unshift(order.adoption);
      });
      saveOrder(order);
      localStorage.setItem('tt_last_order_id', orderId);
      clearCart();
      await syncOrderRemote('create_order', order);
      location.href = `payment.html?order=${encodeURIComponent(orderId)}`;
    });
  }

  render();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function findOrderById(orderId) {
  const user = getCurrentUser();
  if (!user) return null;
  return (user.orders || []).find(order => order.id === orderId) || null;
}

function buildWhatsAppLink(order) {
  const itemLines = order.items.map(item => `${item.product.name} × ${item.quantity} — ${money(item.subtotal)}`).join('\n');
  const message = [
    'Hello TreeTrack! I would like to confirm my TreeTrack #1 order.',
    '',
    `Order ID: ${order.id}`,
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `WhatsApp: ${order.customer.phone}`,
    `City: ${order.customer.city}`,
    `Address: ${order.customer.address}`,
    '',
    'Order items:',
    itemLines,
    `Total: ${money(order.total)}`,
    '',
    'Please send me the manual payment instructions. Thank you!'
  ].join('\n');
  return `https://wa.me/628139511928?text=${encodeURIComponent(message)}`;
}

function initPayment() {
  const root = document.querySelector('#paymentRoot');
  if (!root) return;
  if (!requireLogin('payment.html')) return;
  const orderId = getQuery('order') || localStorage.getItem('tt_last_order_id');
  const order = findOrderById(orderId);
  if (!order) {
    root.innerHTML = `<div class="empty-state"><h2>Order not found.</h2><p>Please return to your account to see your saved purchase history.</p><a class="btn btn-primary" href="account.html">Go to my account</a></div>`;
    return;
  }

  const link = buildWhatsAppLink(order);
  const currentStatus = normalizeOrderStatus(order);
  const currentIndex = Math.max(0, TT.orderStatuses.findIndex(status => status.key === currentStatus));
  const statusSteps = TT.orderStatuses.filter(status => status.key !== 'cancelled');
  const review = getReviewForOrder(order.id);

  root.innerHTML = `
    <div class="payment-box">
      <div class="form-card">
        <div class="kicker">TreeTrack #1 · Order tracking</div>
        <h1>Order ${escapeHtml(order.id)}</h1>
        <p>Your order is saved. Keep this Order ID when talking to the TreeTrack team on WhatsApp.</p>
        <div class="order-status-banner">
          <span class="${statusClass(currentStatus)}">${escapeHtml(statusLabel(currentStatus))}</span>
          <small>Last updated ${new Date(order.updatedAt || order.createdAt).toLocaleString('en-GB')}</small>
        </div>
        <div class="order-tracker">
          ${statusSteps.map((status, index) => `<div class="tracker-step ${index <= currentIndex && currentStatus !== 'cancelled' ? 'done' : ''} ${index === currentIndex && currentStatus !== 'cancelled' ? 'current' : ''}"><span>${index < currentIndex ? '✓' : index + 1}</span><small>${escapeHtml(status.label)}</small></div>`).join('')}
        </div>
        ${currentStatus === 'cancelled' ? '<div class="alert error show">This order has been cancelled. Please contact TreeTrack if you need help.</div>' : ''}
        <p><strong>Order ID:</strong> <span class="order-code">${escapeHtml(order.id)}</span></p>
        <div class="summary-item"><div>Items</div><strong>${order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</strong></div>
        <div class="summary-item"><div>Total</div><strong>${money(order.total)}</strong></div>
        ${currentStatus !== 'completed' ? `<div class="whatsapp-box"><h3>Continue on WhatsApp</h3><p>Send your pre-filled order details to the TreeTrack team at <strong>+62 813-9511-928</strong>.</p><a class="btn btn-primary" href="${link}" target="_blank" rel="noopener">Open WhatsApp →</a></div>` : ''}
        ${currentStatus === 'completed' ? `<section class="review-panel" id="paymentReviewPanel">
          <div class="kicker">Your experience</div>
          <h2>${review ? 'Your TreeTrack review.' : 'How was your TreeTrack order?'}</h2>
          <p>Share a star rating, a short review, and optionally a photo. Your review can appear in the public Shop review section.</p>
          <div id="paymentReviewMount"></div>
        </section>` : ''}
        <div class="form-footer">
          <a class="btn btn-ghost" href="account.html">View my order history</a>
          <a class="btn btn-outline" href="shop.html">Continue shopping</a>
        </div>
      </div>
    </div>`;

  if (currentStatus === 'completed') {
    renderReviewForm(order, root.querySelector('#paymentReviewMount'));
  }
}

function initAccount() {
  const root = document.querySelector('#accountRoot');
  if (!root) return;
  if (!requireLogin('account.html')) return;
  const user = getCurrentUser();
  const orders = user.orders || [];
  root.innerHTML = `
    <div class="account-grid">
      <section class="profile-card">
        <div class="avatar">${escapeHtml((user.name || 'T').slice(0,1).toUpperCase())}</div>
        <h2>${escapeHtml(user.name)}</h2>
        <p>${escapeHtml(user.email)}</p>
        <div style="margin-top:20px;display:grid;gap:8px;">
          <div><small style="color:var(--muted)">WhatsApp</small><br>${escapeHtml(user.phone || 'Not set')}</div>
          <div><small style="color:var(--muted)">Address</small><br>${escapeHtml(user.address || 'Not set')}</div>
        </div>
        <button class="btn btn-outline block" style="margin-top:24px" type="button" id="logoutBtn">Log out</button>
      </section>
      <section class="orders-card">
        <div class="kicker">Saved activity</div>
        <h2 style="font-size:3rem">Purchase history</h2>
        ${orders.length ? `
          <div style="margin-top:22px">
            ${orders.map(order => {
              const status = normalizeOrderStatus(order);
              const review = getReviewForOrder(order.id);
              return `
              <div class="order-row">
                <div><strong>${escapeHtml(order.id)}</strong><br><small style="color:var(--muted)">${new Date(order.createdAt).toLocaleString('en-GB')}</small></div>
                <div>${order.items.map(item => `${escapeHtml(item.product.name)} × ${item.quantity}`).join('<br>')}</div>
                <div><strong>${money(order.total)}</strong></div>
                <div>
                  <span class="${statusClass(status)}">${escapeHtml(statusLabel(status))}</span><br>
                  <a class="order-view-link" href="payment.html?order=${encodeURIComponent(order.id)}">View status →</a>
                  ${status === 'completed' ? `<br><button class="review-link" type="button" data-review-order="${escapeHtml(order.id)}">${review ? 'Edit review' : 'Leave a review'}</button>` : ''}
                </div>
              </div>
              <div class="review-inline-mount" id="review-mount-${escapeHtml(order.id)}"></div>`;
            }).join('')}
          </div>` : `
          <div class="empty-state" style="margin-top:22px;padding:50px 18px">
            <h2>No purchases yet.</h2>
            <p>Your future TreeTrack product purchases and campaign participation will be saved here.</p>
            <a class="btn btn-primary" href="shop.html">Explore shop</a>
          </div>`}
      </section>
    </div>`;

  root.querySelector('#logoutBtn').addEventListener('click', () => {
    setCurrentUserId('');
    location.href = 'index.html';
  });

  root.querySelectorAll('[data-review-order]').forEach(button => {
    button.addEventListener('click', () => {
      const order = orders.find(item => item.id === button.dataset.reviewOrder);
      const mount = root.querySelector(`#review-mount-${CSS.escape(button.dataset.reviewOrder)}`);
      if (order && mount) {
        renderReviewForm(order, mount);
        mount.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
}

function phaseIndex(phase) {
  return Math.max(0, TT.phases.findIndex(item => item.key === phase));
}

function normalizeCampaignTreeState(state = {}) {
  const fallback = TT.campaignTreeDefault;
  const phase = TT.phases.some(item => item.key === state.phase) ? state.phase : fallback.phase;
  const phaseData = TT.phases.find(item => item.key === phase) || TT.phases[0];
  return {
    campaign: state.campaign || fallback.campaign,
    phase,
    title: state.title || phaseData.label,
    description: state.description || phaseData.description,
    updateDate: state.updateDate || '',
    updatedAt: state.updatedAt || '',
    imageUrl: state.imageUrl || '',
    imageFileId: state.imageFileId || ''
  };
}

async function getReviewsRemote() {
  if (!TT.orderApiUrl) return getReviews();
  try {
    const response = await fetch(`${TT.orderApiUrl}?action=getReviews&_=${Date.now()}`, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error(`Review API returned ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data?.reviews)) {
      saveReviews(data.reviews);
      return data.reviews;
    }
  } catch (error) {
    console.warn('TreeTrack reviews fetch failed:', error);
  }
  return getReviews();
}

async function getCampaignTreeRemote() {
  if (!TT.orderApiUrl) {
    TT.campaignTree = normalizeCampaignTreeState(getJSON('tt_campaign_tree', TT.campaignTreeDefault));
    return TT.campaignTree;
  }
  try {
    const url = `${TT.orderApiUrl}?action=tree&campaign=Campaign%20Tree%20%231&_=${Date.now()}`;
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error(`Tree API returned ${response.status}`);
    const data = await response.json();
    if (!data?.ok || !data?.tree) throw new Error(data?.error || 'Campaign tree data was not returned.');
    TT.campaignTree = normalizeCampaignTreeState(data.tree);
    localStorage.setItem('tt_campaign_tree', JSON.stringify(TT.campaignTree));
    return TT.campaignTree;
  } catch (error) {
    console.warn('TreeTrack campaign tree fetch failed:', error);
    return TT.campaignTree = normalizeCampaignTreeState(getJSON('tt_campaign_tree', TT.campaignTreeDefault));
  }
}

async function saveCampaignTreeRemote(state) {
  const next = normalizeCampaignTreeState(state);
  TT.campaignTree = next;
  localStorage.setItem('tt_campaign_tree', JSON.stringify(next));

  if (!TT.orderApiUrl) {
    return { ok: false, skipped: true, error: new Error('TreeTrack Web App URL is empty.') };
  }

  try {
    const remoteTree = {
      ...next,
      imageData: state.imageData || '',
      removeImage: Boolean(state.removeImage)
    };
    const response = await fetch(TT.orderApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'update_tree', tree: remoteTree }),
      cache: 'no-store'
    });

    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) {
      throw new Error(`Web App returned a non-JSON response (${response.status}). Make sure the latest Code.gs is deployed as Web App.`);
    }
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Tree API returned ${response.status}`);
    }

    const verified = await getCampaignTreeRemote();
    if (verified.phase !== next.phase || verified.title !== next.title || verified.description !== next.description) {
      throw new Error('The shared Campaign Tree was not updated. Redeploy the latest Code.gs and try again.');
    }
    TT.campaignTree = verified;
    localStorage.setItem('tt_campaign_tree', JSON.stringify(verified));
    return { ok: true, data, tree: verified };
  } catch (error) {
    console.warn('TreeTrack campaign tree update failed:', error);
    return { ok: false, error };
  }
}

function treeModelMarkup(phase) {
  if (phase === 'waiting') {
    return `
      <div class="tree-stage waiting-stage">
        <div class="tree-soil waiting-soil"></div>
      </div>`;
  }
  if (phase === 'planted') {
    return `
      <div class="tree-stage planted-stage">
        <div class="tree-soil mound-soil"></div>
        <div class="soil-highlight"></div>
      </div>`;
  }
  if (phase === 'sprout') {
    return `
      <div class="tree-stage sprout-stage">
        <div class="tree-soil mound-soil"></div>
        <div class="sprout-stem"></div>
        <div class="sprout-leaf sprout-leaf-left"></div>
        <div class="sprout-leaf sprout-leaf-right"></div>
      </div>`;
  }
  return `
    <div class="tree-stage growing-stage">
      <div class="tree-soil mound-soil"></div>
      <div class="tree-trunk main-trunk"></div>
      <div class="branch b1"></div><div class="branch b2"></div><div class="branch b3"></div><div class="branch b4"></div><div class="branch b5"></div>
      <div class="tree-canopy">
        <div class="canopy-cluster c1"></div>
        <div class="canopy-cluster c2"></div>
        <div class="canopy-cluster c3"></div>
        <div class="canopy-cluster c4"></div>
        <div class="canopy-cluster c5"></div>
        <div class="canopy-cluster c6"></div>
        <div class="canopy-cluster c7"></div>
        <div class="canopy-cluster c8"></div>
      </div>
    </div>`;
}

function renderTreeModel(scene, phase = 'waiting', rotation = 0) {
  if (!scene) return;
  const current = TT.phases[phaseIndex(phase)] || TT.phases[0];
  scene.innerHTML = `
    <div class="waiting-note">${phase === 'waiting' ? 'Nursery stage · planting day pending' : current.label}</div>
    <div class="tree-model tree-phase-${escapeHtml(phase)}" data-tree-model style="transform: translate(-50%,-50%) rotateY(${rotation}deg)">
      ${treeModelMarkup(phase)}
    </div>
    <div class="tree-tag">${escapeHtml(current.label)} · ${current.percent}% journey</div>`;
}

async function initMyTree() {
  const root = document.querySelector('#treeRoot');
  if (!root) return;
  if (!requireLogin('my-tree.html')) return;
  const user = getCurrentUser();
  const adoptions = user.adoptions || [];
  if (!adoptions.length) {
    root.innerHTML = `<div class="empty-state"><h2>Your tree journey is waiting.</h2><p>Once you purchase a TreeTrack #1 product, your virtual tree adoption will appear here.</p><a class="btn btn-primary" href="shop.html">Support TreeTrack #1</a></div>`;
    return;
  }

  await getCampaignTreeRemote();
  let campaign = normalizeCampaignTreeState(TT.campaignTree);
  const selected = { ...adoptions[0], phase: campaign.phase, treeType: campaign.campaign, nextUpdate: campaign.updateDate || adoptions[0].nextUpdate };

  root.innerHTML = `
    <div class="tree-app">
      <section class="tree-panel">
        <div class="kicker">Interactive growth view</div>
        <div class="tree-scene" id="treeScene"></div>
        <div class="tree-footage-card" id="treeFootage"></div>
        <div class="tree-controls">
          <button class="btn btn-outline small" id="rotateLeft" type="button">← Rotate</button>
          <button class="btn btn-outline small" id="rotateRight" type="button">Rotate →</button>
        </div>
        <div class="form-note">Drag across the tree or use the rotation controls to explore the 3D-inspired model.</div>
      </section>
      <section class="tree-info">
        <div class="kicker">My Tree</div>
        <h2 id="treeTitle">${escapeHtml(selected.treeType)}</h2>
        <span class="phase" id="treePhase"></span>
        <div class="phase-bar" id="phaseBar"></div>
        <div class="tree-update-card">
          <span class="kicker">Latest campaign update</span>
          <h3 id="treeUpdateTitle"></h3>
          <p id="treeDescription"></p>
          <small id="treeUpdateDate"></small>
        </div>
        <div class="tree-metadata">
          <div class="meta"><span>Campaign</span><strong>TreeTrack #1</strong></div>
          <div class="meta"><span>Location</span><strong id="treeLocation"></strong></div>
          <div class="meta"><span>Adopted</span><strong id="treeAdopted"></strong></div>
          <div class="meta"><span>Last campaign update</span><strong id="treeUpdate"></strong></div>
        </div>
        <div class="kicker">Growth journey</div>
        <div class="tree-timeline">
          ${TT.phases.map((item, index) => `<div class="growth-card" data-growth-index="${index}"><h4>${index+1}. ${item.label}</h4><p>${item.description}</p></div>`).join('')}
        </div>
        <div style="margin-top:24px" class="form-footer">
          <a class="btn btn-primary" href="campaign.html">Read campaign details</a>
          <a class="btn btn-outline" href="account.html">My account</a>
        </div>
      </section>
    </div>`;

  let rotation = 0;
  const scene = document.querySelector('#treeScene');
  let dragging = false;
  let startX = 0;

  function updateTree() {
    const p = TT.phases[phaseIndex(selected.phase)] || TT.phases[0];
    renderTreeModel(scene, selected.phase, rotation);
    const footage = document.querySelector('#treeFootage');
    if (footage) {
      footage.innerHTML = campaign.imageUrl
        ? `<div class="tree-footage-head"><div><span class="kicker">Real tree footage</span><h3>What the campaign tree looks like</h3><p>Latest photo uploaded by the TreeTrack admin.</p></div><span class="footage-date">${escapeHtml(campaign.updateDate || 'Latest update')}</span></div><img class="tree-footage-image" src="${escapeHtml(campaign.imageUrl)}" alt="Latest real photo of Campaign Tree #1" loading="lazy">`
        : `<div class="tree-footage-empty"><span class="kicker">Real tree footage</span><h3>Photo coming soon</h3><p>The TreeTrack team has not uploaded the latest field photo yet. Check back after the next campaign update.</p></div>`;
    }
    document.querySelector('#treePhase').textContent = campaign.title || p.label;
    document.querySelector('#treeDescription').textContent = campaign.description || p.description;
    document.querySelector('#treeUpdateTitle').textContent = campaign.title || p.label;
    document.querySelector('#treeLocation').textContent = selected.location;
    document.querySelector('#treeAdopted').textContent = new Date(selected.adoptedAt).toLocaleDateString('en-GB');
    document.querySelector('#treeUpdate').textContent = campaign.updateDate || 'Not announced yet';
    document.querySelector('#treeUpdateDate').textContent = campaign.updateDate ? `Updated ${campaign.updateDate}` : 'Campaign update';
    document.querySelector('#phaseBar').innerHTML = TT.phases.map((item, index) => `<span class="phase-dot ${index <= phaseIndex(selected.phase) ? 'active' : ''}" title="${escapeHtml(item.label)}"></span>`).join('');
    document.querySelectorAll('[data-growth-index]').forEach((card, index) => card.classList.toggle('current', index === phaseIndex(selected.phase)));
  }
  updateTree();

  document.querySelector('#rotateLeft').addEventListener('click', () => { rotation -= 22; renderTreeModel(scene, selected.phase, rotation); });
  document.querySelector('#rotateRight').addEventListener('click', () => { rotation += 22; renderTreeModel(scene, selected.phase, rotation); });
  scene.addEventListener('pointerdown', event => { dragging = true; startX = event.clientX; scene.setPointerCapture(event.pointerId); });
  scene.addEventListener('pointermove', event => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    rotation += delta * .35;
    startX = event.clientX;
    renderTreeModel(scene, selected.phase, rotation);
  });
  scene.addEventListener('pointerup', () => { dragging = false; });
  scene.addEventListener('pointercancel', () => { dragging = false; });

  // Keep an already-open My Tree page in sync with the shared campaign.
  // It checks on visibility changes and periodically, so adopters do not
  // need to sign out or clear localStorage after an admin update.
  let refreshBusy = false;
  const refreshCampaign = async () => {
    if (refreshBusy) return;
    refreshBusy = true;
    try {
      const latest = await getCampaignTreeRemote();
      if (latest && (latest.phase !== campaign.phase || latest.updatedAt !== campaign.updatedAt || latest.title !== campaign.title || latest.imageUrl !== campaign.imageUrl)) {
        campaign = normalizeCampaignTreeState(latest);
        selected.phase = campaign.phase;
        selected.treeType = campaign.campaign;
        selected.nextUpdate = campaign.updateDate || selected.nextUpdate;
        updateTree();
      }
    } finally {
      refreshBusy = false;
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshCampaign();
  });
  window.setInterval(refreshCampaign, 30000);
}

async function resizeImageFile(file, maxSize = 1000, quality = 0.78) {
  if (!file || !file.type.startsWith('image/')) return '';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderStars(rating) {
  const value = Math.max(1, Math.min(5, Number(rating) || 5));
  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

function renderReviewForm(order, mount) {
  if (!mount) return;
  const existing = getReviewForOrder(order.id);
  mount.innerHTML = `
    <form class="review-form" data-review-form="${escapeHtml(order.id)}">
      <div class="review-rating-field">
        <label for="reviewRating-${escapeHtml(order.id)}">Rating</label>
        <div class="star-picker" role="radiogroup" aria-label="Choose a rating">
          ${[5,4,3,2,1].map(value => `<label><input type="radio" name="rating" value="${value}" ${Number(existing?.rating || 5) === value ? 'checked' : ''}><span>${value}★</span></label>`).join('')}
        </div>
      </div>
      <div class="field"><label for="reviewText-${escapeHtml(order.id)}">Your review</label><textarea id="reviewText-${escapeHtml(order.id)}" name="review" rows="5" maxlength="700" required placeholder="Tell us what you liked about your TreeTrack experience.">${escapeHtml(existing?.text || '')}</textarea></div>
      <div class="field"><label for="reviewPhoto-${escapeHtml(order.id)}">Photo <span class="form-note-inline">(optional)</span></label><input id="reviewPhoto-${escapeHtml(order.id)}" name="photo" type="file" accept="image/*"><small class="field-help">One photo, automatically resized for the website.</small></div>
      ${existing?.image ? `<div class="review-existing-photo"><img src="${existing.image}" alt="Your review photo"><button type="button" class="btn btn-ghost small" data-remove-review-image>Remove photo</button></div>` : ''}
      <div class="form-footer"><button class="btn btn-primary" type="submit">${existing ? 'Update review' : 'Publish review'} →</button><button class="btn btn-ghost" type="button" data-cancel-review>Cancel</button></div>
      <div class="form-note">Your name, rating, text, and optional photo will appear in the Shop review section.</div>
    </form>`;

  const form = mount.querySelector('[data-review-form]');
  form.querySelector('[data-cancel-review]')?.addEventListener('click', () => { mount.innerHTML = ''; });
  form.querySelector('[data-remove-review-image]')?.addEventListener('click', () => {
    const review = getReviewForOrder(order.id);
    if (review) {
      review.image = '';
      saveReview(review);
      renderReviewForm(order, mount);
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const currentUser = getCurrentUser();
    const liveOrder = findOrderById(order.id);
    if (!currentUser || !liveOrder || normalizeOrderStatus(liveOrder) !== 'completed') {
      showToast('Only completed orders can be reviewed.');
      return;
    }
    const rating = Number(form.querySelector('input[name="rating"]:checked')?.value || 5);
    const text = form.review.value.trim();
    if (!text) return;
    const file = form.photo.files?.[0];
    let image = existing?.image || '';
    if (file) {
      try { image = await resizeImageFile(file); }
      catch (_) { showToast('That image could not be processed.'); return; }
    }
    const review = {
      id: existing?.id || uid('review'),
      orderId: liveOrder.id,
      userId: currentUser.id,
      customerName: currentUser.name,
      rating,
      text,
      image,
      productNames: (liveOrder.items || []).map(item => item.product?.name || '').filter(Boolean),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveReview(review);
    updateOrderEverywhere(liveOrder.id, item => { item.reviewId = review.id; });
    await syncOrderRemote('save_review', review);
    showToast('Thank you — your review is now live in the Shop.');
    mount.innerHTML = `<div class="review-saved"><strong>Review published.</strong><p>Thanks for helping other TreeTrack supporters.</p><span class="review-stars">${renderStars(rating)}</span></div>`;
  });
}

async function initShopReviews() {
  const root = document.querySelector('#shopReviews');
  if (!root) return;

  const render = (reviews) => {
    const sorted = [...reviews].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    root.innerHTML = sorted.length ? sorted.map(review => `
      <article class="review-card">
        <div class="review-card-head"><div><strong>${escapeHtml(review.customerName || 'TreeTrack supporter')}</strong><small>${new Date(review.createdAt).toLocaleDateString('en-GB')}</small></div><span class="review-stars" aria-label="${review.rating} out of 5 stars">${renderStars(review.rating)}</span></div>
        <p>${escapeHtml(review.text)}</p>
        ${review.productNames?.length ? `<div class="review-products">${review.productNames.map(name => `<span>${escapeHtml(name)}</span>`).join('')}</div>` : ''}
        ${review.image ? `<img class="review-photo" src="${escapeHtml(review.image)}" alt="Photo shared by ${escapeHtml(review.customerName || 'customer')}">` : ''}
        ${review.adminResponse ? `<div class="review-response"><strong>TreeTrack response</strong><p>${escapeHtml(review.adminResponse)}</p><small>${review.adminResponseAt ? new Date(review.adminResponseAt).toLocaleDateString('en-GB') : ''}</small></div>` : ''}
      </article>`).join('') : `<div class="empty-state compact review-empty"><h3>Be the first to review TreeTrack.</h3><p>Complete an order and share your experience here.</p></div>`;
  };

  render(getReviews());
  const remote = await getReviewsRemote();
  render(remote);
}

function initTreeSelectors() {
  document.querySelectorAll('[data-tree-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-tree-filter]').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.treeFilter;
      document.querySelectorAll('[data-tree-card]').forEach(card => {
        const show = filter === 'all' || card.dataset.treeCard.split(',').includes(filter);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

function initMap() {
  const frame = document.querySelector('#googleMap');
  const detail = document.querySelector('#mapDetail');
  if (!frame || !detail) return;
  let active = TT.mapLocations[0];
  function selectLocation(location) {
    active = location;
    frame.src = `https://www.google.com/maps?q=${encodeURIComponent(location.query)}&output=embed`;
    detail.innerHTML = `<strong>${escapeHtml(location.name)}</strong><p>${escapeHtml(location.district)}</p><p>${escapeHtml(location.note)}</p><a class="btn btn-primary small" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.query)}" target="_blank" rel="noopener">Open in Google Maps →</a>`;
    document.querySelectorAll('[data-map-id]').forEach(button => button.classList.toggle('active', button.dataset.mapId === location.id));
  }
  document.querySelectorAll('[data-map-id]').forEach(button => {
    const location = TT.mapLocations.find(item => item.id === button.dataset.mapId);
    if (location) button.addEventListener('click', () => selectLocation(location));
  });
  selectLocation(active);
}

function initDynamicContent() {
  const productTarget = document.querySelector('#productGrid');
  if (productTarget) renderProductList('#productGrid');
  const homeProducts = document.querySelector('#homeProductGrid');
  if (homeProducts) renderProductList('#homeProductGrid', true);
  initTreeSelectors();
}


function initAdmin() {
  const root = document.querySelector('#adminRoot');
  if (!root) return;

  const allowed = sessionStorage.getItem('tt_admin_unlocked') === '1';
  if (!allowed) {
    root.innerHTML = `
      <div class="admin-login form-card">
        <div class="kicker">Private workspace</div>
        <h1>Admin access locked.</h1>
        <p>Enter the TreeTrack admin credentials to unlock order management.</p>
        <div class="alert error" data-admin-dashboard-notice></div>
        <div class="form-footer">
          <a class="btn btn-primary" href="login.html?admin=1">Go to admin login →</a>
          <a class="btn btn-ghost" href="index.html">Back to site</a>
        </div>
        <div class="form-note">Admin access is separate from customer accounts.</div>
      </div>`;
    return;
  }

  async function loadTreeState() {
    await getCampaignTreeRemote();
    render();
  }

  function render() {
    const orders = getOrders();
    const activeStatuses = ['pending', 'confirmed', 'paid', 'processing'];
    const activeOrders = orders.filter(o => activeStatuses.includes(normalizeOrderStatus(o)));
    const archivedOrders = orders.filter(o => ['completed', 'cancelled'].includes(normalizeOrderStatus(o)));
    const revenue = orders.filter(o => ['paid','processing','completed'].includes(normalizeOrderStatus(o))).reduce((sum,o) => sum + Number(o.total || 0), 0);
    const pending = orders.filter(o => ['pending','confirmed'].includes(normalizeOrderStatus(o))).length;
    const completed = orders.filter(o => normalizeOrderStatus(o) === 'completed').length;
    const cancelled = orders.filter(o => normalizeOrderStatus(o) === 'cancelled').length;
    const tree = normalizeCampaignTreeState(TT.campaignTree);

    root.innerHTML = `
      <div class="admin-toolbar">
        <div><div class="kicker">TreeTrack #1</div><h1>Admin dashboard</h1><p>Manage orders and the shared Campaign Tree #1 growth stage from one workspace.</p></div>
        <div class="admin-toolbar-actions"><button class="btn btn-outline" id="exportOrders" type="button">Export CSV</button><button class="btn btn-ghost" id="adminLogout" type="button">Lock dashboard</button></div>
      </div>
      <div class="admin-stats">
        <div class="stat-card"><span>Active orders</span><strong>${activeOrders.length}</strong></div>
        <div class="stat-card"><span>Tracked revenue</span><strong>${money(revenue)}</strong></div>
        <div class="stat-card"><span>Needs action</span><strong>${pending}</strong></div>
        <div class="stat-card"><span>Archived</span><strong>${completed + cancelled}</strong></div>
      </div>

      <section class="admin-tree-card">
        <div class="admin-tree-copy">
          <div class="kicker">Campaign Tree #1</div>
          <h2>Tree progress</h2>
          <p>Because this campaign represents one shared tree, one update here is reflected in every adopter's <strong>My Tree</strong> page.</p>
          <div class="admin-tree-current"><span>Current stage</span><strong id="adminTreeCurrentLabel">${escapeHtml(tree.title)}</strong><small id="adminTreeCurrentDate">${tree.updateDate ? `Last update: ${escapeHtml(tree.updateDate)}` : 'No campaign update date yet'}</small></div>
          <form id="campaignTreeForm" class="admin-tree-form">
            <div class="form-row">
              <div class="field"><label for="campaignTreePhase">Tree stage</label><select id="campaignTreePhase" name="phase">${TT.phases.map(p => `<option value="${p.key}" ${tree.phase === p.key ? 'selected' : ''}>${p.label}</option>`).join('')}</select></div>
              <div class="field"><label for="campaignTreeDate">Update date</label><input id="campaignTreeDate" name="updateDate" type="date" value="${escapeHtml(tree.updateDate)}"></div>
            </div>
            <div class="field"><label for="campaignTreeTitle">Update title</label><input id="campaignTreeTitle" name="title" value="${escapeHtml(tree.title)}" maxlength="100"></div>
            <div class="field"><label for="campaignTreeDescription">Update description</label><textarea id="campaignTreeDescription" name="description" rows="4" maxlength="500">${escapeHtml(tree.description)}</textarea></div>
            <div class="field"><label for="campaignTreeImage">Real tree footage <span class="form-note-inline">(optional)</span></label><input id="campaignTreeImage" name="image" type="file" accept="image/*"><small class="field-help">Upload the latest real photo of Campaign Tree #1. It will appear below the 3D model for every adopter.</small>${tree.imageUrl ? `<div class="admin-tree-current-photo"><img src="${escapeHtml(tree.imageUrl)}" alt="Current Campaign Tree #1 footage"><button class="btn btn-danger small" type="button" id="removeCampaignTreeImage">Remove photo</button></div>` : ''}</div>
            <div class="form-footer"><button class="btn btn-primary" type="submit" id="saveCampaignTree">Save tree update</button><span class="form-note" id="campaignTreeNotice">This updates Campaign Tree #1 for every adopter.</span></div>
          </form>
        </div>
        <div class="admin-tree-preview">
          <div class="kicker">Live preview</div>
          <div class="admin-tree-preview-scene" id="adminTreePreview"></div>
          <span class="admin-tree-preview-label" id="adminTreePreviewLabel">${escapeHtml(tree.title)}</span>
        </div>
      </section>

      <section class="orders-card admin-orders">
        <div class="admin-tabs" role="tablist" aria-label="Order sections">
          <button class="admin-tab active" type="button" data-admin-tab="active">Needs processing <span>${activeOrders.length}</span></button>
          <button class="admin-tab" type="button" data-admin-tab="archive">Completed / Cancelled <span>${archivedOrders.length}</span></button>
        </div>
        <div id="activePanel" class="admin-tab-panel">
          <div class="admin-section-head"><div><div class="kicker">Live queue</div><h2>Orders to process</h2></div><div class="field admin-filter"><label for="adminStatusFilter">Filter</label><select id="adminStatusFilter"><option value="all">All active</option>${TT.orderStatuses.filter(s => activeStatuses.includes(s.key)).map(s => `<option value="${s.key}">${s.label}</option>`).join('')}</select></div></div>
          ${activeOrders.length ? `<div class="admin-order-list" id="adminActiveOrderList"></div>` : `<div class="empty-state compact"><h3>All caught up.</h3><p>No active orders need processing right now.</p></div>`}
        </div>
        <div id="archivePanel" class="admin-tab-panel" hidden>
          <div class="admin-section-head"><div><div class="kicker">Archive</div><h2>Completed & cancelled</h2><p class="admin-muted">These orders stay out of the main dashboard until you need the history.</p></div></div>
          ${archivedOrders.length ? `<div class="admin-order-list" id="adminArchiveOrderList"></div>` : `<div class="empty-state compact"><h3>No archived orders.</h3><p>Completed and cancelled orders will appear here.</p></div>`}
        </div>
      </section>

      <section class="orders-card admin-reviews-section">
        <div class="admin-section-head">
          <div><div class="kicker">Customer feedback</div><h2>Reviews & responses</h2><p class="admin-muted">Reply to customer reviews or remove a review from the public Shop section.</p></div>
          <span class="admin-review-count">${getReviews().length} review${getReviews().length === 1 ? '' : 's'}</span>
        </div>
        <div class="admin-review-list" id="adminReviewList"></div>
      </section>`;

    const activeList = root.querySelector('#adminActiveOrderList');
    const archiveList = root.querySelector('#adminArchiveOrderList');
    const filter = root.querySelector('#adminStatusFilter');
    const reviewList = root.querySelector('#adminReviewList');

    function orderMarkup(order, archived = false) {
      const status = normalizeOrderStatus(order);
      return `<article class="admin-order-row">
        <div class="admin-order-main">
          <div class="order-id-line"><strong>${escapeHtml(order.id)}</strong><span class="${statusClass(status)}">${escapeHtml(statusLabel(status))}</span></div>
          <div class="admin-order-meta"><span>${escapeHtml(order.customer?.name || '')}</span><span>${escapeHtml(order.customer?.phone || '')}</span><span>${new Date(order.createdAt).toLocaleString('en-GB')}</span></div>
          <div class="admin-order-items">${(order.items || []).map(item => `<span>${escapeHtml(item.product?.name || '')} × ${item.quantity}</span>`).join('')}</div>
        </div>
        <div class="admin-order-total"><strong>${money(order.total)}</strong>${archived ? `<button class="btn btn-danger small" type="button" data-delete-order="${escapeHtml(order.id)}">Delete order</button>` : `<select data-order-status="${escapeHtml(order.id)}" aria-label="Update order status">${TT.orderStatuses.filter(s => activeStatuses.includes(s.key) || s.key === 'completed' || s.key === 'cancelled').map(option => `<option value="${option.key}" ${status === option.key ? 'selected' : ''}>${option.label}</option>`).join('')}</select>`}</div>
      </article>`;
    }

    function drawActive(filterValue='all') {
      if (!activeList) return;
      const visible = activeOrders.filter(order => filterValue === 'all' || normalizeOrderStatus(order) === filterValue);
      activeList.innerHTML = visible.length ? visible.map(order => orderMarkup(order)).join('') : '<div class="empty-state compact"><h3>No orders match this filter.</h3></div>';
      bindActiveControls();
    }

    function drawArchive() {
      if (!archiveList) return;
      archiveList.innerHTML = archivedOrders.length ? archivedOrders.map(order => orderMarkup(order, true)).join('') : '<div class="empty-state compact"><h3>No archived orders.</h3></div>';
      archiveList.querySelectorAll('[data-delete-order]').forEach(button => {
        button.addEventListener('click', async () => {
          const order = getOrders().find(item => item.id === button.dataset.deleteOrder);
          if (!order) return;
          const status = normalizeOrderStatus(order);
          if (!['completed','cancelled'].includes(status)) return;
          if (!window.confirm(`Delete order ${order.id} permanently from this browser?`)) return;
          deleteOrderEverywhere(order.id);
          await syncOrderRemote('delete_order', { id: order.id });
          await syncOrderRemote('delete_review', { id: order.reviewId || '', orderId: order.id });
          showToast(`Order ${order.id} deleted.`);
          render();
        });
      });
    }

    function bindActiveControls() {
      activeList?.querySelectorAll('[data-order-status]').forEach(select => {
        select.addEventListener('change', async () => {
          const key = select.value;
          const updated = updateOrderEverywhere(select.dataset.orderStatus, order => {
            order.statusKey = key;
            order.status = statusLabel(key);
            order.updatedAt = new Date().toISOString();
          });
          if (updated) {
            await syncOrderRemote('update_order', updated);
            showToast(`Order ${updated.id} updated to ${statusLabel(key)}.`);
            render();
          }
        });
      });
    }

    function drawReviews() {
      if (!reviewList) return;
      const reviews = getReviews().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      reviewList.innerHTML = reviews.length ? reviews.map(review => `
        <article class="admin-review-row">
          <div class="admin-review-main">
            <div class="admin-review-head">
              <div><strong>${escapeHtml(review.customerName || 'TreeTrack supporter')}</strong><span class="admin-muted">${new Date(review.createdAt).toLocaleString('en-GB')}</span></div>
              <span class="review-stars">${renderStars(review.rating)}</span>
            </div>
            <div class="admin-review-meta"><span>Order: ${escapeHtml(review.orderId || '—')}</span>${review.productNames?.length ? `<span>${review.productNames.map(name => escapeHtml(name)).join(', ')}</span>` : ''}</div>
            <p class="admin-review-text">${escapeHtml(review.text)}</p>
            ${review.image ? `<img class="admin-review-photo" src="${escapeHtml(review.image)}" alt="Customer review photo">` : ''}
          </div>
          <div class="admin-review-actions">
            <label for="adminResponse-${escapeHtml(review.id)}">Response</label>
            <textarea id="adminResponse-${escapeHtml(review.id)}" rows="4" maxlength="700" data-review-response="${escapeHtml(review.id)}" placeholder="Write a short response to the customer...">${escapeHtml(review.adminResponse || '')}</textarea>
            <div class="admin-review-buttons">
              <button class="btn btn-primary small" type="button" data-save-review-response="${escapeHtml(review.id)}">${review.adminResponse ? 'Update response' : 'Reply to review'}</button>
              <button class="btn btn-danger small" type="button" data-delete-review="${escapeHtml(review.id)}">Delete review</button>
            </div>
            ${review.adminResponse ? `<div class="admin-review-existing"><strong>Current response</strong><p>${escapeHtml(review.adminResponse)}</p></div>` : ''}
          </div>
        </article>`).join('') : `<div class="empty-state compact"><h3>No reviews yet.</h3><p>Customer reviews will appear here after completed orders are reviewed.</p></div>`;

      reviewList.querySelectorAll('[data-save-review-response]').forEach(button => {
        button.addEventListener('click', async () => {
          const review = getReviews().find(item => item.id === button.dataset.saveReviewResponse);
          if (!review) return;
          const field = reviewList.querySelector(`[data-review-response="${CSS.escape(review.id)}"]`);
          const responseText = field?.value.trim() || '';
          button.disabled = true;
          const updated = { ...review, adminResponse: responseText, adminResponseAt: responseText ? new Date().toISOString() : '' };
          const result = await syncOrderRemote('save_review', updated);
          button.disabled = false;
          if (!result.ok) {
            showToast('Review response could not be synced. Check the Web App deployment.');
            return;
          }
          saveReview(updated);
          showToast(responseText ? 'Response published.' : 'Response removed.');
          render();
        });
      });

      reviewList.querySelectorAll('[data-delete-review]').forEach(button => {
        button.addEventListener('click', async () => {
          const review = getReviews().find(item => item.id === button.dataset.deleteReview);
          if (!review) return;
          if (!window.confirm(`Delete the review from ${review.customerName || 'this customer'}?`)) return;
          const result = await syncOrderRemote('delete_review', { id: review.id, orderId: review.orderId || '' });
          if (!result.ok) {
            showToast('Review could not be deleted from the shared data.');
            return;
          }
          saveReviews(getReviews().filter(item => item.id !== review.id));
          showToast('Review deleted.');
          render();
        });
      });
    }

    // Campaign tree editor and live 3D preview.
    const preview = root.querySelector('#adminTreePreview');
    const phaseSelect = root.querySelector('#campaignTreePhase');
    const titleInput = root.querySelector('#campaignTreeTitle');
    const descriptionInput = root.querySelector('#campaignTreeDescription');
    const dateInput = root.querySelector('#campaignTreeDate');
    const imageInput = root.querySelector('#campaignTreeImage');
    const removeImageButton = root.querySelector('#removeCampaignTreeImage');
    let removeCampaignImage = false;
    removeImageButton?.addEventListener('click', () => {
      if (!window.confirm('Remove the current real tree footage? Customer My Tree will return to the default photo-coming-soon state after you save.')) return;
      removeCampaignImage = true;
      removeImageButton.closest('.admin-tree-current-photo')?.remove();
      if (imageInput) imageInput.value = '';
      const notice = root.querySelector('#campaignTreeNotice');
      if (notice) notice.textContent = 'Photo marked for removal. Click Save tree update to apply it for every adopter.';
    });
    const previewLabel = root.querySelector('#adminTreePreviewLabel');
    const previewTree = () => {
      const phase = phaseSelect?.value || tree.phase;
      const phaseData = TT.phases.find(p => p.key === phase) || TT.phases[0];
      if (titleInput && !titleInput.dataset.edited) titleInput.value = phaseData.label;
      if (descriptionInput && !descriptionInput.dataset.edited) descriptionInput.value = phaseData.description;
      renderTreeModel(preview, phase, 0);
      if (previewLabel) previewLabel.textContent = titleInput?.value || phaseData.label;
    };
    titleInput?.addEventListener('input', () => { titleInput.dataset.edited = '1'; if (previewLabel) previewLabel.textContent = titleInput.value || 'Tree update'; });
    descriptionInput?.addEventListener('input', () => { descriptionInput.dataset.edited = '1'; });
    phaseSelect?.addEventListener('change', () => { delete titleInput.dataset.edited; delete descriptionInput.dataset.edited; previewTree(); });
    previewTree();

    root.querySelector('#campaignTreeForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const button = root.querySelector('#saveCampaignTree');
      const notice = root.querySelector('#campaignTreeNotice');
      const phase = phaseSelect.value;
      const phaseData = TT.phases.find(p => p.key === phase) || TT.phases[0];
      let imageData = '';
      const file = imageInput?.files?.[0];
      if (file) {
        try {
          if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
          if (file.size > 12 * 1024 * 1024) throw new Error('Please choose an image smaller than 12 MB.');
          imageData = await resizeImageFile(file, 1400, 0.82);
        } catch (error) {
          showToast(error.message || 'That image could not be processed.');
          return;
        }
      }
      const next = {
        campaign: 'Campaign Tree #1',
        phase,
        title: titleInput.value.trim() || phaseData.label,
        description: descriptionInput.value.trim() || phaseData.description,
        updateDate: dateInput.value || '',
        updatedAt: new Date().toISOString(),
        imageData,
        removeImage: removeCampaignImage
      };
      button.disabled = true;
      if (notice) notice.textContent = imageData ? 'Uploading photo and saving campaign update…' : (removeCampaignImage ? 'Removing photo and saving campaign update…' : 'Saving campaign update…');
      const result = await saveCampaignTreeRemote(next);
      button.disabled = false;
      if (result.ok) {
        if (notice) notice.textContent = removeCampaignImage ? 'Saved. The real tree photo was removed for every adopter.' : 'Saved. Every adopter will see this campaign stage on My Tree.';
        root.querySelector('#adminTreeCurrentLabel').textContent = next.title;
        root.querySelector('#adminTreeCurrentDate').textContent = next.updateDate ? `Last update: ${next.updateDate}` : 'Updated just now';
        removeCampaignImage = false;
        if (imageInput) imageInput.value = '';
        showToast('Campaign Tree #1 updated.');
      } else {
        const reason = result.error?.message || 'Unknown Web App error.';
        if (notice) notice.textContent = `Saved locally, but the shared campaign could not be updated: ${reason}`;
        showToast('Campaign update could not be synced.');
      }
    });

    drawActive();
    drawArchive();
    drawReviews();
    filter?.addEventListener('change', () => drawActive(filter.value));
    root.querySelectorAll('[data-admin-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        root.querySelectorAll('[data-admin-tab]').forEach(item => item.classList.toggle('active', item === tab));
        root.querySelector('#activePanel').hidden = tab.dataset.adminTab !== 'active';
        root.querySelector('#archivePanel').hidden = tab.dataset.adminTab !== 'archive';
      });
    });
    root.querySelector('#adminLogout').addEventListener('click', () => { sessionStorage.removeItem('tt_admin_unlocked'); initAdmin(); });
    root.querySelector('#exportOrders').addEventListener('click', exportOrdersCSV);
  }

  Promise.all([getCampaignTreeRemote(), getReviewsRemote()]).then(render).catch(render);
}

function exportOrdersCSV() {
  const orders = getOrders();
  const header = ['Order ID','Created At','Customer','Email','WhatsApp','City','Address','Items','Total','Status','Updated At'];
  const rows = orders.map(order => [
    order.id,
    order.createdAt,
    order.customer?.name || '',
    order.customer?.email || '',
    order.customer?.phone || '',
    order.customer?.city || '',
    order.customer?.address || '',
    (order.items || []).map(item => `${item.product?.name || ''} x ${item.quantity}`).join(' | '),
    order.total || 0,
    statusLabel(normalizeOrderStatus(order)),
    order.updatedAt || order.createdAt
  ]);
  const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `treetrack-orders-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function run() {
  initNav();
  initDynamicContent();
  initShopReviews();
  initLoginPage();
  initCheckout();
  initPayment();
  initAccount();
  initMyTree();
  initMap();
  initAdmin();

  document.querySelectorAll('[data-require-login]').forEach(button => {
    button.addEventListener('click', event => {
      if (!getCurrentUser()) {
        event.preventDefault();
        goToLogin(button.dataset.requireLogin || 'account.html');
      }
    });
  });

  const footerYear = document.querySelector('[data-year]');
  if (footerYear) footerYear.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', run);


/* =========================================================
   TreeTrack Visual Enhancements
   ========================================================= */
(function initTreeTrackVisualEnhancements() {
  const setup = () => {
    document.body.classList.add('tt-enhanced');

    // Soft mouse-following ambient glow.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let raf = 0;
      window.addEventListener('pointermove', (event) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
          raf = 0;
        });
      }, { passive: true });
    }

    // Scroll reveal for major content blocks.
    const revealTargets = document.querySelectorAll(
      '.section-head, .photo-card, .text-card, .story-card, .stat-card, .sdg-card, ' +
      '.campaign-banner, .product-card, .map-shell, .timeline, .form-card, .checkout-grid, ' +
      '.account-grid, .tree-app, .empty-state, .payment-box'
    );

    revealTargets.forEach((element, index) => {
      element.classList.add('reveal-on-scroll');
      element.style.transitionDelay = `${Math.min(index % 5, 4) * 55}ms`;
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });

      revealTargets.forEach(element => observer.observe(element));
    } else {
      revealTargets.forEach(element => element.classList.add('is-visible'));
    }

    // Make the current navigation item visually identifiable.
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = (link.getAttribute('href') || '').split('#')[0];
      if (href === page) link.setAttribute('aria-current', 'page');
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
