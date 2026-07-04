/* ============================================================
   MOCK DATA LAYER & UTILITIES
   ============================================================ */
const CATEGORY_EMOJI = { Tops: '👕', Bottoms: '👖', Dresses: '👗', Outerwear: '🧥', Shoes: '👟', Accessories: '🧣' };

function initials(name) { 
  return name.replace(/[._]/g, ' ').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase(); 
}

/* ============================================================
   ADMIN'S PERSONAL WARDROBE LAYER
   ============================================================ */

// Fetch and render ONLY the logged-in admin's personal closet items
async function loadAdminPersonalWardrobe() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const grid = document.getElementById('adminPersonalWardrobeGrid');
  if (!grid) return;

  try {
    const response = await fetch('/api/wardrobe', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return;
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: rgba(4,93,93,0.5);">Your personal admin wardrobe is empty.</div>';
      return;
    }

    grid.innerHTML = data.items.map(item => `
      <div class="clothing-card" style="background: var(--interior-pale); border-radius: 12px; padding: 12px; position: relative; border: 1px solid rgba(4,93,93,0.1);">
        <div style="height: 160px; border-radius: 8px; overflow: hidden; background: #fff; margin-bottom: 8px;">
          ${item.image_path 
            ? `<img src="${item.image_path}" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--interior); font-size:2rem;">👕</div>`
          }
        </div>
        <div style="font-weight: 600; color: var(--exterior); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
        <div style="font-size: 0.75rem; color: rgba(4,93,93,0.7); margin-top: 2px;">${item.category} • Size ${item.size || 'N/A'}</div>
        
        <button onclick="deleteAdminItem(${item.id})" style="position: absolute; top: 18px; right: 18px; background: rgba(192, 74, 58, 0.9); color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 0.7rem; cursor: pointer;">
          Delete
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading personal wardrobe:", err);
  }
}

// Action handler to delete an item out of your personal workspace
window.deleteAdminItem = async function(itemId) {
  if (!confirm("Remove this item from your personal wardrobe?")) return;
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  
  try {
    const response = await fetch(`/api/wardrobe/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      showToast("Item removed from your wardrobe.");
      loadAdminPersonalWardrobe();
      if (typeof loadRealDashboard === 'function') loadRealDashboard();
    }
  } catch (err) {
    console.error("Error deleting personal item:", err);
  }
};

// Fetch and display global counters on the overview tab
async function loadRealDashboard() {
    const dashboardData = await apiGet('/dashboard');
    if (dashboardData && dashboardData.summary) {
        const s = dashboardData.summary;
        document.getElementById('statTotalUsers').textContent = s.total_users;
        document.getElementById('statTotalClothes').textContent = s.total_wardrobe_items;
        document.getElementById('statLiveSessions').textContent = s.active_users;

        const signupsThisWeek = s.signups_this_week ?? 0;
        const signupsPriorWeek = s.signups_prior_week ?? 0;
        const itemsThisWeek = s.items_added_this_week ?? 0;
        const signupsDelta = signupsThisWeek - signupsPriorWeek;

        const statNewSignups = document.getElementById('statNewSignups');
        if (statNewSignups) statNewSignups.textContent = signupsThisWeek;

        // "+2 this week" under Total Users - real count of accounts created
        // in the last 7 days, not a hardcoded placeholder
        renderTrendSpan(document.getElementById('statUsersTrend'), signupsThisWeek, '');

        // "+8 added this week" under Total Clothes - real item count
        renderTrendSpan(document.getElementById('statClothesTrend'), itemsThisWeek, '');

        // "vs -1 prior week" under Sign-ups (7d) - real week-over-week delta
        renderTrendSpan(document.getElementById('statSignupsTrend'), signupsDelta, '');
    }
}

// Render a trend number with the correct sign and up/down color.
// Positive -> green "+N", negative -> red "-N", zero -> neutral "0".
function renderTrendSpan(el, value) {
  if (!el) return;
  if (value > 0) {
    el.textContent = `+${value}`;
    el.className = 'up';
  } else if (value < 0) {
    el.textContent = `${value}`; // already has a minus sign
    el.className = 'down';
  } else {
    el.textContent = '0';
    el.className = '';
  }
}

// Turn an ISO timestamp into a short "x minutes ago" style string
function timeAgo(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Fetch and render the live login activity feed + live badges
async function loadLiveActivity() {
  const feed = document.getElementById('liveFeed');
  const data = await apiGet('/activity/recent?limit=8');
  const activity = (data && data.recent_activity) || [];

  if (feed) {
    if (activity.length === 0) {
      feed.innerHTML = '<div class="empty-state">No recent activity yet.</div>';
    } else {
      feed.innerHTML = activity.map(u => `
        <div class="live-item">
          <div class="live-avatar">${initials(u.username)}</div>
          <div class="live-text"><b>${u.username}</b> logged in</div>
          <div class="live-time">${timeAgo(u.last_active)}</div>
        </div>
      `).join('');
    }
  }

  // Reflect activity in the sidebar "live" badge and topbar ping
  const usersLiveBadge = document.getElementById('usersLiveBadge');
  if (usersLiveBadge) usersLiveBadge.style.display = activity.length > 0 ? 'flex' : 'none';

  // Only flag the bell if something happened since the admin last opened it
  const latestTimestamp = activity.length > 0 ? new Date(activity[0].last_active).getTime() : 0;
  const notifPing = document.getElementById('notifPing');
  if (notifPing) notifPing.classList.toggle('show', latestTimestamp > lastNotifSeenAt);
}

/* ============================================================
   SETTINGS TAB (Profile + Appearance)
   ============================================================ */

// Apply (or remove) the dark theme attribute on <html>, same convention
// the main dashboard (app.js) uses, so both apps stay visually in sync.
function applyAdminTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

let adminCurrentNotifPrefs = { email: false, push: false };

// Populate the Settings form with the admin's current username/theme,
// pulled from the same /api/settings endpoint the main app's Settings
// page already uses (it's per-user, not admin-specific).
async function loadAdminSettingsForm() {
  const usernameInput = document.getElementById('admin-settings-username');
  if (!usernameInput) return;

  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  try {
    const response = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data && data.ok) {
      const s = data.settings || {};
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.username = s.username || currentUser.username;
      localStorage.setItem('user', JSON.stringify(currentUser));

      usernameInput.value = currentUser.username || '';
      adminCurrentNotifPrefs = s.notifications || { email: false, push: false };

      const darkToggle = document.getElementById('admin-dark-mode-toggle');
      if (darkToggle) darkToggle.checked = s.theme === 'dark';
    }
  } catch (err) {
    console.error('Failed to load admin settings:', err);
  }

  // Reflect whatever avatar/name is already saved locally
  refreshSettingsAvatarPreview();
}

function refreshSettingsAvatarPreview() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const name = currentUser.username || currentUser.email || 'Admin';
  const savedAvatar = localStorage.getItem('profileAvatar');

  const avatarImg = document.getElementById('settings-avatar-img');
  const avatarFallback = document.getElementById('settings-avatar-fallback');
  if (!avatarImg || !avatarFallback) return;

  if (savedAvatar) {
    avatarImg.src = savedAvatar;
    avatarImg.style.display = 'block';
    avatarFallback.style.display = 'none';
  } else {
    avatarImg.style.display = 'none';
    avatarFallback.style.display = 'flex';
    avatarFallback.textContent = name.charAt(0).toUpperCase();
  }
}

// Persist just the theme choice right away (doesn't touch username/avatar),
// so the toggle and the actual saved state never drift apart.
async function saveThemePreference(theme) {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const usernameInput = document.getElementById('admin-settings-username');
  const username = (usernameInput && usernameInput.value.trim()) || currentUser.username || '';

  localStorage.setItem('theme', theme);

  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username,
        theme,
        notifications: adminCurrentNotifPrefs
      })
    });
  } catch (err) {
    console.error('Failed to save theme preference:', err);
  }
}

function setupAdminSettingsForm() {
  const form = document.getElementById('admin-settings-form');
  const usernameInput = document.getElementById('admin-settings-username');
  const uploadInput = document.getElementById('admin-profile-upload');
  const filenameLabel = document.getElementById('admin-profile-filename');
  const darkToggle = document.getElementById('admin-dark-mode-toggle');

  let pendingAvatarBase64 = null;

  if (uploadInput) {
    uploadInput.addEventListener('change', () => {
      const file = uploadInput.files && uploadInput.files[0];
      if (!file) {
        if (filenameLabel) filenameLabel.textContent = 'No file chosen';
        return;
      }
      if (filenameLabel) filenameLabel.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        pendingAvatarBase64 = e.target.result;
        const avatarImg = document.getElementById('settings-avatar-img');
        const avatarFallback = document.getElementById('settings-avatar-fallback');
        if (avatarImg && avatarFallback) {
          avatarImg.src = pendingAvatarBase64;
          avatarImg.style.display = 'block';
          avatarFallback.style.display = 'none';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Dark mode applies immediately on toggle AND saves right away - if it
  // only updated the DOM, navigating away before hitting "Save Profile"
  // would leave the page dark while the toggle itself reset to "off" the
  // next time settings were fetched from the server.
  if (darkToggle) {
    darkToggle.addEventListener('change', () => {
      const theme = darkToggle.checked ? 'dark' : 'default';
      applyAdminTheme(theme);
      saveThemePreference(theme);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const theme = darkToggle && darkToggle.checked ? 'dark' : 'default';
      const payload = {
        username: usernameInput ? usernameInput.value.trim() : '',
        theme,
        notifications: adminCurrentNotifPrefs
      };

      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Save failed');
      } catch (err) {
        console.error('Failed to save admin settings:', err);
        if (typeof showToast === 'function') showToast('Failed to save settings.');
        return;
      }

      // Sync locally so the sidebar and this form reflect the change instantly
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.username = payload.username;
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('theme', theme);
      if (pendingAvatarBase64) localStorage.setItem('profileAvatar', pendingAvatarBase64);

      applyAdminTheme(theme);
      loadAdminProfile();
      refreshSettingsAvatarPreview();
      if (typeof showToast === 'function') showToast('Settings saved.');
    });
  }
}

/* ============================================================
   NAVIGATION & INITIALIZATION PIPELINE
   ============================================================ */

// Populate the sidebar with the actual logged-in admin's name/avatar,
// same localStorage 'user' record + 'profileAvatar' key the main
// dashboard (app.js) already uses, so it stays in sync across the app.
function loadAdminProfile() {
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    currentUser = {};
  }

  const name = currentUser.username || currentUser.email || 'Admin';
  const savedAvatar = localStorage.getItem('profileAvatar');

  const nameEl = document.getElementById('sidebar-username');
  if (nameEl) nameEl.textContent = name;

  const avatarImg = document.getElementById('sidebar-avatar-img');
  const avatarFallback = document.getElementById('sidebar-avatar');
  if (avatarImg && avatarFallback) {
    if (savedAvatar) {
      avatarImg.src = savedAvatar;
      avatarImg.style.display = 'block';
      avatarFallback.style.display = 'none';
    } else {
      avatarImg.style.display = 'none';
      avatarFallback.style.display = 'flex';
      avatarFallback.textContent = name.charAt(0).toUpperCase();
    }
  }
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById('view-' + name);
  if (targetView) targetView.classList.add('active');
  
  document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  const titles = { overview: 'Overview', users: 'Users', clothes: 'Clothes', analytics: 'Analytics', settings: 'System Settings' };
  const topbar = document.getElementById('topbarTitle');
  if (topbar) topbar.textContent = titles[name] || 'Overview';
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply the admin's saved theme immediately, before anything else renders
  applyAdminTheme(localStorage.getItem('theme'));

  // Load initial data
  loadAdminProfile();
  loadAdminPersonalWardrobe();
  loadRealDashboard();
  loadLiveActivity();
  loadUsers();
  loadAdminSettingsForm();
  setupAdminSettingsForm();

  // Keep the "live" feed and stats fresh without a manual refresh
  setInterval(loadLiveActivity, 15000);
  setInterval(loadRealDashboard, 15000);
  setInterval(loadUsers, 30000);

  setupGlobalSearch();
  setupNotificationBell();

  // Navigation Links listeners
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
      if (btn.dataset.view === 'clothes') {
        loadAdminPersonalWardrobe();
      }
      if (btn.dataset.view === 'users') {
        loadUsers();
      }
      if (btn.dataset.view === 'settings') {
        loadAdminSettingsForm();
      }
    });
  });

  // Users tab Refresh button
  const refreshUsersBtn = document.getElementById('refreshUsersBtn');
  if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', () => loadUsers());
  }

  document.querySelectorAll('[data-view-link]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.viewLink));
  });

  // Modal Interactive Elements Setup
  const addClothingBtn = document.getElementById('addClothingBtn');
  const addModal = document.getElementById('admin-add-item-modal');
  const closeBtn = document.getElementById('close-admin-add-modal');
  const addForm = document.getElementById('admin-add-item-form');
  
  const photoInput = document.getElementById('admin-new-item-photo');
  const preview = document.getElementById('admin-new-item-photo-preview');
  const filenameLabel = document.getElementById('admin-new-item-photo-filename');
  const defaultPreviewHTML = preview ? preview.innerHTML : '';

  // Open Modal Listener
  if (addClothingBtn && addModal) {
    addClothingBtn.addEventListener('click', () => {
      addModal.classList.add('visible');
    });
  }

  // Close Modal Listener
  if (closeBtn && addModal) {
    closeBtn.addEventListener('click', () => {
      addModal.classList.remove('visible');
    });
  }
  
  window.addEventListener('click', (e) => {
    if (e.target === addModal) {
      addModal.classList.remove('visible');
    }
  });

  // File Upload Custom Interactivity
  if (photoInput && preview && filenameLabel) {
    photoInput.addEventListener('change', function () {
      const file = photoInput.files && photoInput.files[0];
      if (!file) {
        filenameLabel.textContent = 'No file chosen';
        preview.innerHTML = defaultPreviewHTML;
        return;
      }
      
      filenameLabel.textContent = file.name;
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle Form Submission Save Data Cycle
  if (addForm) {
    addForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const file = photoInput.files[0];
      let imagePath = null;
      
      if (file) {
        imagePath = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      const payload = {
        name: document.getElementById('admin-new-item-name').value.trim(),
        category: document.getElementById('admin-new-item-category').value,
        size: document.getElementById('admin-new-item-size').value.trim(),
        color: document.getElementById('admin-new-item-color').value.trim(),
        image_path: imagePath
      };

      try {
        const activeToken = localStorage.getItem('token') || localStorage.getItem('access_token');
        const response = await fetch('/api/wardrobe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // Explicit global custom notification system helper
          if (typeof showToast === 'function') showToast("Added to your personal wardrobe!");
          addModal.classList.remove('visible');
          addForm.reset();
          if (filenameLabel) filenameLabel.textContent = 'No file chosen';
          if (preview) preview.innerHTML = defaultPreviewHTML;
          
          loadAdminPersonalWardrobe();
          loadRealDashboard();
        } else {
          if (typeof showToast === 'function') showToast("Failed to save item.");
        }
      } catch (err) {
        console.error("Upload error:", err);
        if (typeof showToast === 'function') showToast("Network error saving item.");
      }
    });
  }
});

/* ============================================================
   TOPBAR: GLOBAL SEARCH
   ============================================================ */

function setupGlobalSearch() {
  const input = document.getElementById('globalSearch');
  const bar = input && input.closest('.search-bar');
  if (!input || !bar) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-panel search-results-dropdown';
  dropdown.id = 'searchResultsDropdown';
  bar.appendChild(dropdown);

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (!query) {
      dropdown.classList.remove('show');
      dropdown.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(() => runGlobalSearch(query, dropdown, input), 300);
  });

  input.addEventListener('focus', () => {
    if (dropdown.innerHTML && input.value.trim()) dropdown.classList.add('show');
  });

  document.addEventListener('click', (e) => {
    if (!bar.contains(e.target)) dropdown.classList.remove('show');
  });
}

async function runGlobalSearch(query, dropdown, input) {
  dropdown.innerHTML = '<div class="dropdown-empty">Searching…</div>';
  dropdown.classList.add('show');

  const [usersRes, itemsRes] = await Promise.all([
    apiGet(`/users?search=${encodeURIComponent(query)}&per_page=5`),
    apiGet(`/items?search=${encodeURIComponent(query)}&per_page=5`)
  ]);

  const users = (usersRes && usersRes.users) || [];
  const items = (itemsRes && itemsRes.items) || [];

  if (users.length === 0 && items.length === 0) {
    dropdown.innerHTML = '<div class="dropdown-empty">No matches found.</div>';
    return;
  }

  let html = '';
  if (users.length) {
    html += `<div class="search-section-label">Users</div>`;
    html += users.map(u => `
      <div class="dropdown-row" data-type="user" data-id="${u.id}">
        <div class="live-avatar">${initials(u.username || u.email || '?')}</div>
        <div class="dropdown-row-text">
          <div class="dropdown-row-title">${u.username || '—'}</div>
          <div class="dropdown-row-sub">${u.email || ''}</div>
        </div>
      </div>
    `).join('');
  }
  if (items.length) {
    html += `<div class="search-section-label">Clothing Items</div>`;
    html += items.map(it => `
      <div class="dropdown-row" data-type="item" data-id="${it.id}">
        <div class="live-avatar">${CATEGORY_EMOJI[it.category] || '👕'}</div>
        <div class="dropdown-row-text">
          <div class="dropdown-row-title">${it.name}</div>
          <div class="dropdown-row-sub">${it.category || ''}${it.username ? ' • ' + it.username : ''}</div>
        </div>
      </div>
    `).join('');
  }
  dropdown.innerHTML = html;

  dropdown.querySelectorAll('.dropdown-row').forEach(row => {
    row.addEventListener('click', async () => {
      dropdown.classList.remove('show');
      if (row.dataset.type === 'user') {
        switchView('users');
        document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === 'users'));
        await loadUsers();
        highlightUserRow(row.dataset.id);
      } else {
        const title = row.querySelector('.dropdown-row-title').textContent;
        const sub = row.querySelector('.dropdown-row-sub').textContent;
        if (typeof showToast === 'function') showToast(`${title} — ${sub}`);
      }
      if (input) input.value = '';
    });
  });
}

// Scroll to and briefly flash a matched user's row in the Users table
function highlightUserRow(userId) {
  const row = document.querySelector(`#usersTableBody tr[data-user-id="${userId}"]`);
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.add('search-highlight');
  setTimeout(() => row.classList.remove('search-highlight'), 1600);
}

/* ============================================================
   TOPBAR: NOTIFICATION BELL
   ============================================================ */

let lastNotifSeenAt = 0;

function setupNotificationBell() {
  const btn = document.getElementById('notifBellBtn');
  if (!btn) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-panel notif-dropdown';
  dropdown.id = 'notifDropdown';
  btn.appendChild(dropdown);

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('show');
    if (isOpen) {
      dropdown.classList.remove('show');
      return;
    }

    dropdown.innerHTML = '<div class="dropdown-header">Recent Activity</div><div class="dropdown-empty">Loading…</div>';
    dropdown.classList.add('show');

    const data = await apiGet('/activity/recent?limit=8');
    const activity = (data && data.recent_activity) || [];

    dropdown.innerHTML = '<div class="dropdown-header">Recent Activity</div>' + (
      activity.length === 0
        ? '<div class="dropdown-empty">No recent activity.</div>'
        : activity.map(u => `
            <div class="dropdown-row">
              <div class="live-avatar">${initials(u.username)}</div>
              <div class="dropdown-row-text">
                <div class="dropdown-row-title">${u.username} logged in</div>
                <div class="dropdown-row-sub">${timeAgo(u.last_active)}</div>
              </div>
            </div>
          `).join('')
    );

    // Mark as read: hide the red ping and remember when, so it won't
    // reappear until something newer than this comes in.
    lastNotifSeenAt = Date.now();
    const ping = document.getElementById('notifPing');
    if (ping) ping.classList.remove('show');
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target)) dropdown.classList.remove('show');
  });
}

/* ============================================================
   UTILITY COMMUNICATIONS LAYERS
   ============================================================ */

// Logout Functionality — mirrors the main dashboard's logoutUser(): wipe
// localStorage entirely rather than picking individual keys, since stale
// cached fields (username, avatar, etc.) would otherwise leak into
// whichever account logs in next on this device.
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  });
}

// Helper to fetch authenticated dashboard metrics
async function apiGet(endpoint) {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token'); 
  
  try {
    const response = await fetch(`/api/admin${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return null; 
    }
    
    if (response.status === 401 || response.status === 403) {
      const btn = document.getElementById('logout-btn');
      if (btn) btn.click();
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error("API GET Error:", err);
    return null;
  }
}

// Helper for authenticated non-GET admin requests (POST/DELETE etc.)
async function apiMutate(endpoint, method = 'POST', body = null) {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');

  try {
    const response = await fetch(`/api/admin${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 401 || response.status === 403) {
      const btn = document.getElementById('logout-btn');
      if (btn) btn.click();
      return null;
    }

    const contentType = response.headers.get("content-type");
    const data = contentType && contentType.includes("application/json") ? await response.json() : null;
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error("API mutate error:", err);
    return null;
  }
}

/* ============================================================
   USERS TAB
   ============================================================ */

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Fetch and render all users into the Users table
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Loading users…</td></tr>`;

  const data = await apiGet('/users?per_page=100');
  const users = (data && data.users) || [];

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const isEnabled = u.is_active !== false; // account enabled/disabled
    const ONLINE_WINDOW_MS = 15 * 60 * 1000; // consider "online" if seen within last 15 min
    // last_seen is a heartbeat updated on every authenticated request (covers active
    // sessions); fall back to last_login for users who haven't triggered a heartbeat yet.
    const lastActive = u.last_seen || u.last_login;
    const isOnline = isEnabled && lastActive && (Date.now() - new Date(lastActive).getTime() < ONLINE_WINDOW_MS);

    let statusClass, statusLabel;
    if (!isEnabled) {
      statusClass = 'offline';
      statusLabel = 'Disabled';
    } else if (isOnline) {
      statusClass = 'online';
      statusLabel = 'Online';
    } else {
      statusClass = 'offline';
      statusLabel = 'Offline';
    }

    return `
      <tr data-user-id="${u.id}">
        <td>
          <div class="item-cell">
            <div class="live-avatar">${initials(u.username || u.email || '?')}</div>
            <div>
              <div style="font-weight:500;">${u.username || '—'}${u.is_admin ? ' <span class="nav-badge" style="margin-left:6px;">admin</span>' : ''}</div>
              <div style="font-size:0.75rem; color:rgba(4,93,93,0.5);">${u.email || ''}</div>
            </div>
          </div>
        </td>
        <td><span class="status-dot ${statusClass}">${statusLabel}</span></td>
        <td>${formatDate(u.created_at)}</td>
        <td>${u.items_count ?? 0}</td>
        <td>${u.last_login ? timeAgo(u.last_login) : 'Never'}</td>
        <td>
          <div class="row-actions">
            <button class="row-action" title="${isEnabled ? 'Disable user' : 'Enable user'}" onclick="toggleUserActive(${u.id}, this)">
              <svg viewBox="0 0 24 24">${isEnabled
                ? '<circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line>'
                : '<circle cx="12" cy="12" r="10"></circle><polyline points="9 12 12 15 16 10"></polyline>'}</svg>
            </button>
            <button class="row-action del" title="Delete user" onclick="deleteUserAdmin(${u.id}, '${(u.username || '').replace(/'/g, "\\'")}')">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Enable/disable a user account
window.toggleUserActive = async function(userId, btnEl) {
  if (btnEl) btnEl.disabled = true;
  const result = await apiMutate(`/users/${userId}/toggle-active`, 'POST');
  if (result && result.ok) {
    if (typeof showToast === 'function') {
      showToast(result.data.is_active ? "User enabled." : "User disabled.");
    }
    loadUsers();
  } else {
    const msg = (result && result.data && result.data.error) || "Couldn't update user.";
    if (typeof showToast === 'function') showToast(msg);
    if (btnEl) btnEl.disabled = false;
  }
};

// Delete a user and all their data
window.deleteUserAdmin = async function(userId, username) {
  if (!confirm(`Delete ${username || 'this user'} and all their data? This can't be undone.`)) return;
  const result = await apiMutate(`/users/${userId}/delete`, 'DELETE');
  if (result && result.ok) {
    if (typeof showToast === 'function') showToast("User deleted.");
    loadUsers();
    loadRealDashboard();
  } else {
    const msg = (result && result.data && result.data.error) || "Couldn't delete user.";
    if (typeof showToast === 'function') showToast(msg);
  }
};