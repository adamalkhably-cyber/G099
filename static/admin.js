/* ============================================================
   MOCK DATA LAYER
   Mirrors schema.sql: users, clothes, outfit_usage, calendar_events,
   plus the new login_log table added to support live activity.
   Replace the functions in this block with real fetch() calls to
   your backend once it's ready — the render functions below don't
   care where the data comes from.
   ============================================================ */

let userIdSeq = 8;
let clothIdSeq = 20;

const CATEGORY_EMOJI = { Tops: '👕', Bottoms: '👖', Dresses: '👗', Outerwear: '🧥', Shoes: '👟', Accessories: '🧣' };

const users = [
  { user_id: 1, username: 'ava_ryder',    created_at: daysAgo(140), last_login: minutesAgo(4),   online: true },
  { user_id: 2, username: 'noah.k',       created_at: daysAgo(120), last_login: minutesAgo(52) ,  online: false },
  { user_id: 3, username: 'mia_chen',     created_at: daysAgo(95),  last_login: hoursAgo(5),      online: false },
  { user_id: 4, username: 'liam_torres',  created_at: daysAgo(80),  last_login: daysAgo(2),       online: false },
  { user_id: 5, username: 'sofia.b',      created_at: daysAgo(40),  last_login: minutesAgo(18),   online: false },
  { user_id: 6, username: 'ethan_park',   created_at: daysAgo(25),  last_login: hoursAgo(1),      online: false },
  { user_id: 7, username: 'zara_malik',   created_at: daysAgo(6),   last_login: hoursAgo(3),      online: false },
];

const clothes = [
  { cloth_id: 1, user_id: 1, category: 'Tops', color: 'White', size: 'M', emoji: '👕', name: 'Cotton Tee' },
  { cloth_id: 2, user_id: 1, category: 'Bottoms', color: 'Indigo', size: '30', emoji: '👖', name: 'Slim Denim' },
  { cloth_id: 3, user_id: 2, category: 'Outerwear', color: 'Black', size: 'L', emoji: '🧥', name: 'Wool Coat' },
  { cloth_id: 4, user_id: 3, category: 'Dresses', color: 'Emerald', size: 'S', emoji: '👗', name: 'Wrap Dress' },
  { cloth_id: 5, user_id: 3, category: 'Shoes', color: 'Tan', size: '8', emoji: '👟', name: 'Suede Sneakers' },
  { cloth_id: 6, user_id: 4, category: 'Accessories', color: 'Brown', size: 'One', emoji: '🧣', name: 'Wool Scarf' },
  { cloth_id: 7, user_id: 5, category: 'Tops', color: 'Sage', size: 'S', emoji: '👕', name: 'Linen Shirt' },
  { cloth_id: 8, user_id: 5, category: 'Bottoms', color: 'Black', size: '28', emoji: '👖', name: 'Tailored Trousers' },
  { cloth_id: 9, user_id: 6, category: 'Shoes', color: 'White', size: '10', emoji: '👟', name: 'Court Trainers' },
  { cloth_id: 10, user_id: 2, category: 'Tops', color: 'Navy', size: 'L', emoji: '👕', name: 'Merino Sweater' },
  { cloth_id: 11, user_id: 7, category: 'Dresses', color: 'Rust', size: 'M', emoji: '👗', name: 'Slip Dress' },
  { cloth_id: 12, user_id: 4, category: 'Outerwear', color: 'Olive', size: 'M', emoji: '🧥', name: 'Field Jacket' },
];

const outfitUsage = [
  { cloth_id: 2, date_used: daysAgo(1), occasion: 'Work' },
  { cloth_id: 4, date_used: daysAgo(1), occasion: 'Dinner' },
  { cloth_id: 5, date_used: daysAgo(2), occasion: 'Weekend' },
  { cloth_id: 9, date_used: daysAgo(2), occasion: 'Gym' },
  { cloth_id: 7, date_used: daysAgo(3), occasion: 'Work' },
  { cloth_id: 11, date_used: daysAgo(4), occasion: 'Event' },
  { cloth_id: 1, date_used: daysAgo(5), occasion: 'Casual' },
];

const calendarEvents = [
  { user_id: 3, event_date: daysFromNow(1), description: "Mia's gallery opening" },
  { user_id: 5, event_date: daysFromNow(3), description: 'Sofia — client dinner' },
  { user_id: 1, event_date: daysFromNow(6), description: 'Ava — wedding weekend' },
];

const outfitSuggestions = [
  { theme: 'cool', occasion: 'Work', name: 'Tailored Weekday', pieces: ['👔','👖','👞'], weather: '☁️ 62°F' },
  { theme: 'warm', occasion: 'Weekend', name: 'Sunday Market', pieces: ['👕','🩳','👟'], weather: '☀️ 78°F' },
  { theme: 'mono', occasion: 'Evening', name: 'Monochrome Dinner', pieces: ['👗','👠','🧥'], weather: '🌙 58°F' },
];

let liveActivityLog = []; // populated from login_log-style events

function daysAgo(n) { return new Date(Date.now() - n * 86400000); }
function daysFromNow(n) { return new Date(Date.now() + n * 86400000); }
function hoursAgo(n) { return new Date(Date.now() - n * 3600000); }
function minutesAgo(n) { return new Date(Date.now() - n * 60000); }

function timeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d + 'd ago';
}

function initials(name) { return name.replace(/[._]/g, ' ').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase(); }

/* ============================================================
   RENDERING
   ============================================================ */

function render() {
  renderStats();
  renderLiveFeed();
  renderCategoryList('categoryList');
  renderCategoryList('categoryListAnalytics');
  renderOutfits();
  renderRecentWorn();
  renderUsersTable();
  renderCategoryChips();
  renderWardrobe('all');
  renderEvents();
  renderAllUsage();
}

async function loadRealData() {
  // Fetch dashboard stats from admin.py
  const dashboardData = await apiGet('/dashboard');
  
  if (dashboardData) {
    document.getElementById('statTotalUsers').textContent = dashboardData.summary.total_users;
    document.getElementById('statTotalClothes').textContent = dashboardData.summary.total_wardrobe_items;
    document.getElementById('statLiveSessions').textContent = dashboardData.summary.active_users;
    
    // You would then call other functions to render users, outfits, etc.
    // e.g., fetchUsers();
  }
}

function renderLiveFeed() {
  const feed = document.getElementById('liveFeed');
  if (liveActivityLog.length === 0) {
    feed.innerHTML = '<div class="empty-state">No login activity yet. New logins will appear here in real time.</div>';
    return;
  }
  feed.innerHTML = liveActivityLog.slice(0, 12).map((ev, i) => `
    <div class="live-item ${i === 0 && ev.fresh ? 'fresh' : ''}">
      <div class="live-avatar">${initials(ev.username)}</div>
      <div class="live-text"><b>${ev.username}</b> logged in</div>
      <div class="live-time">${timeAgo(ev.time)}</div>
    </div>
  `).join('');
}

function renderCategoryList(elId) {
  const counts = {};
  clothes.forEach(c => counts[c.category] = (counts[c.category] || 0) + 1);
  const max = Math.max(...Object.values(counts), 1);
  const el = document.getElementById(elId);
  el.innerHTML = Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([cat, count]) => `
    <div class="cat-row">
      <div class="cat-emoji">${CATEGORY_EMOJI[cat] || '🧵'}</div>
      <div class="cat-name">${cat}</div>
      <div class="cat-bar-wrap"><div class="cat-bar" style="width:${(count/max*100).toFixed(0)}%"></div></div>
      <div class="cat-count">${count}</div>
    </div>
  `).join('');
}

function renderOutfits() {
  document.getElementById('outfitsRow').innerHTML = outfitSuggestions.map(o => `
    <div class="outfit-card">
      <div class="outfit-banner ${o.theme}"></div>
      <div class="outfit-body">
        <div class="outfit-occasion">${o.occasion}</div>
        <div class="outfit-name">${o.name}</div>
        <div class="outfit-pieces">${o.pieces.map(p => `<div class="outfit-piece">${p}</div>`).join('')}</div>
      </div>
      <div class="outfit-footer">
        <div class="outfit-weather">${o.weather}</div>
        <button class="outfit-save">Save</button>
      </div>
    </div>
  `).join('');
}

function wearCountFor(cloth_id) { return outfitUsage.filter(u => u.cloth_id === cloth_id).length; }

function renderRecentWorn() {
  const sorted = [...outfitUsage].sort((a,b) => b.date_used - a.date_used).slice(0, 6);
  document.getElementById('recentWornBody').innerHTML = sorted.map(u => {
    const cloth = clothes.find(c => c.cloth_id === u.cloth_id);
    const owner = users.find(us => us.user_id === cloth.user_id);
    const wc = wearCountFor(cloth.cloth_id);
    const badge = wc >= 3 ? 'high' : wc === 2 ? 'med' : 'low';
    return `
      <tr>
        <td><div class="item-cell"><div class="item-thumb">${cloth.emoji}</div>${cloth.name}</div></td>
        <td>${owner ? owner.username : '—'}</td>
        <td>${u.occasion}</td>
        <td>${u.date_used.toLocaleDateString()}</td>
        <td><span class="wear-badge ${badge}">${wc} wear${wc === 1 ? '' : 's'}</span></td>
      </tr>`;
  }).join('');
}

function renderAllUsage() {
  const sorted = [...outfitUsage].sort((a,b) => b.date_used - a.date_used);
  document.getElementById('allUsageBody').innerHTML = sorted.map(u => {
    const cloth = clothes.find(c => c.cloth_id === u.cloth_id);
    const owner = users.find(us => us.user_id === cloth.user_id);
    return `<tr><td><div class="item-cell"><div class="item-thumb">${cloth.emoji}</div>${cloth.name}</div></td><td>${owner ? owner.username : '—'}</td><td>${u.occasion}</td><td>${u.date_used.toLocaleDateString()}</td></tr>`;
  }).join('');
}

function renderUsersTable(filter) {
  const term = (filter || '').toLowerCase();
  const rows = users.filter(u => u.username.toLowerCase().includes(term));
  const body = document.getElementById('usersTableBody');
  if (rows.length === 0) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty-state">No users match "${filter}".</div></td></tr>`;
    return;
  }
  body.innerHTML = rows.map(u => {
    const itemCount = clothes.filter(c => c.user_id === u.user_id).length;
    return `
      <tr data-user-id="${u.user_id}">
        <td><div class="item-cell"><div class="live-avatar">${initials(u.username)}</div>${u.username}</div></td>
        <td><span class="status-dot ${u.online ? 'online' : 'offline'}">${u.online ? 'Online' : 'Offline'}</span></td>
        <td>${u.created_at.toLocaleDateString()}</td>
        <td>${itemCount}</td>
        <td>${timeAgo(u.last_login)}</td>
        <td>
          <div class="row-actions">
            <button class="row-action del" data-del-user="${u.user_id}" title="Remove user">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

let activeCategory = 'all';
function renderCategoryChips() {
  const cats = ['all', ...new Set(clothes.map(c => c.category))];
  document.getElementById('categoryChips').innerHTML = cats.map(cat => `
    <button class="chip ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">${cat === 'all' ? 'All' : cat}</button>
  `).join('');
  document.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => { activeCategory = btn.dataset.cat; renderCategoryChips(); renderWardrobe(activeCategory); });
  });
}

function renderWardrobe(filterCat) {
  const items = filterCat === 'all' ? clothes : clothes.filter(c => c.category === filterCat);
  const grid = document.getElementById('wardrobeGrid');
  if (items.length === 0) { grid.innerHTML = '<div class="empty-state">No items in this category yet.</div>'; return; }
  grid.innerHTML = items.map(c => {
    const owner = users.find(u => u.user_id === c.user_id);
    return `
      <div class="clothing-card">
        <div class="clothing-tag">${c.size}</div>
        <div class="clothing-img">${c.emoji}</div>
        <div class="clothing-info">
          <div class="clothing-name">${c.name}</div>
          <div class="clothing-cat">${c.color} · ${owner ? owner.username : 'unassigned'}</div>
        </div>
      </div>`;
  }).join('');
}

function renderEvents() {
  const sorted = [...calendarEvents].sort((a,b) => a.event_date - b.event_date);
  const el = document.getElementById('eventsList');
  if (sorted.length === 0) { el.innerHTML = '<div class="empty-state">No upcoming events.</div>'; return; }
  el.innerHTML = sorted.map(ev => {
    const owner = users.find(u => u.user_id === ev.user_id);
    return `
      <div class="event-row">
        <div class="event-date">
          <div class="d">${ev.event_date.getDate()}</div>
          <div class="m">${ev.event_date.toLocaleString(undefined, { month: 'short' })}</div>
        </div>
        <div>
          <div class="event-desc">${ev.description}</div>
          <div class="event-user">${owner ? owner.username : ''}</div>
        </div>
      </div>`;
  }).join('');
}

//Logout button functionality: clear JWT from localStorage and reset the UI to the login state//
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('admin_jwt'); 
    
    const layout = document.getElementById('adminLayout');
    const loginBox = document.getElementById('loginBox');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');

    if (layout) layout.classList.remove('visible');
    if (loginBox) loginBox.style.display = 'block';
    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';
  });
} else {
  console.error("Warning: 'logoutBtn' ID not found in HTML.");
}

// Fetch and display the dashboard data
async function loadRealDashboard() {
    const dashboardData = await fetchAdminData('/dashboard');
    
    if (dashboardData && dashboardData.summary) {
        document.getElementById('statTotalUsers').textContent = dashboardData.summary.total_users;
        document.getElementById('statTotalClothes').textContent = dashboardData.summary.total_wardrobe_items;
        document.getElementById('statLiveSessions').textContent = dashboardData.summary.active_users;
    }
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  const titles = { overview: 'Overview', users: 'Users', clothes: 'Clothes', analytics: 'Analytics', settings: 'System Settings' };
  document.getElementById('topbarTitle').textContent = titles[name] || 'Overview';
}

document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
document.querySelectorAll('[data-view-link]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.viewLink));
});

/* ============================================================
   USERS: search, add, delete
   ============================================================ */

document.getElementById('globalSearch').addEventListener('input', e => renderUsersTable(e.target.value));

document.getElementById('usersTableBody').addEventListener('click', e => {
  const btn = e.target.closest('[data-del-user]');
  if (!btn) return;
  const id = Number(btn.dataset.delUser);
  const idx = users.findIndex(u => u.user_id === id);
  if (idx > -1) {
    const removed = users[idx];
    users.splice(idx, 1);
    render();
    showToast(`Removed ${removed.username}`);
  }
});

const addUserModal = document.getElementById('addUserModal');
document.getElementById('addUserBtn').addEventListener('click', () => { addUserModal.classList.add('visible'); document.getElementById('newUsername').focus(); });
document.getElementById('cancelAddUser').addEventListener('click', () => addUserModal.classList.remove('visible'));
addUserModal.addEventListener('click', e => { if (e.target === addUserModal) addUserModal.classList.remove('visible'); });

document.getElementById('addUserForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('newUsername').value.trim();
  if (!name) return;
  if (users.some(u => u.username.toLowerCase() === name.toLowerCase())) {
    showToast('That username already exists');
    return;
  }
  users.push({ user_id: ++userIdSeq, username: name, created_at: new Date(), last_login: new Date(), online: false });
  document.getElementById('newUsername').value = '';
  addUserModal.classList.remove('visible');
  render();
  switchView('users');
  showToast(`Added ${name}`);
});

document.getElementById('refreshUsersBtn').addEventListener('click', () => { renderUsersTable(document.getElementById('globalSearch').value); showToast('Users refreshed'); });

document.getElementById('addClothingBtn').addEventListener('click', () => showToast('Hook this up to your clothes-creation form/endpoint'));

/* ============================================================
  LOGOUT
   NOTE: this is a client-side demo check only — see the Security
   Notice panel under System Settings for why this must move to
   a real backend before launch.
   ============================================================ */

document.getElementById('logoutBtn').addEventListener('click', () => {
  document.getElementById('adminLayout').classList.remove('visible');
  document.getElementById('loginBox').style.display = 'block';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  stopLiveUpdates();
});

let liveInterval, tickInterval;
function startLiveUpdates() {
  simulateLogin();
  liveInterval = setInterval(simulateLogin, 9000 + Math.random() * 6000);
  tickInterval = setInterval(tickTimestamps, 15000);
}
function stopLiveUpdates() {
  clearInterval(liveInterval);
  clearInterval(tickInterval);
}

// Helper to fetch data with your JWT token
async function apiGet(endpoint) {
  const token = localStorage.getItem('admin_jwt');
  const response = await fetch(`/api/admin${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 401 || response.status === 403) {
    // Token expired or not admin - force logout
    document.getElementById('logoutBtn').click();
    return null;
  }
  return await response.json();
}