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

    // /api/wardrobe returns a plain array of items, not {items: [...]}
    const items = Array.isArray(data) ? data : (data.items || []);

    if (items.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: rgba(4,93,93,0.5);">Your personal admin wardrobe is empty.</div>';
      return;
    }

    grid.innerHTML = items.map(item => `
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
  adminConfirm(
    'Remove Item',
    'Remove this item from your personal wardrobe?',
    async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      try {
        const response = await fetch(`/api/wardrobe/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          showAdminToast('Item removed from your wardrobe.');
          loadAdminPersonalWardrobe();
          if (typeof loadRealDashboard === 'function') loadRealDashboard();
        } else {
          showAdminToast('Failed to remove item.', 'error');
        }
      } catch (err) {
        console.error('Error deleting personal item:', err);
        showAdminToast('Network error.', 'error');
      }
    }
  );
};

/* ============================================================
   ADMIN'S PERSONAL OUTFITS LAYER
   ============================================================ */

// Fetch and render the logged-in admin's own outfits
async function loadAdminOutfits() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const grid = document.getElementById('adminOutfitsGrid');
  if (!grid) return;

  try {
    const response = await fetch('/api/outfits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return;
    const data = await response.json();

    // Handle either a plain array or a {outfits: [...]} / {items: [...]} shape,
    // matching the same defensive pattern used for /api/wardrobe above.
    const outfits = Array.isArray(data) ? data : (data.outfits || data.items || []);

    if (outfits.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: rgba(4,93,93,0.5);">You haven\'t created any outfits yet.</div>';
      return;
    }

    grid.innerHTML = outfits.map(outfit => {
      const items = outfit.items || [];
      const previewItems = items.slice(0, 4);
      const collageHTML = previewItems.length === 0
        ? `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--interior); font-size:1.75rem;">👕</div>`
        : previewItems.map(item => `
            <div style="flex: 1; height: 100%; overflow: hidden; background: #fff;">
              ${item.image_path
                ? `<img src="${item.image_path}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name}">`
                : `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--interior); font-size:1.25rem;">${CATEGORY_EMOJI[item.category] || '👕'}</div>`
              }
            </div>
          `).join('');

      return `
      <div class="clothing-card" style="background: var(--interior-pale); border-radius: 12px; padding: 12px; position: relative; border: 1px solid rgba(4,93,93,0.1);">
        <div style="height: 130px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; display: flex; gap: 2px;">
          ${collageHTML}
        </div>

        <div style="font-weight: 600; color: var(--exterior); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 60px;">${outfit.name}</div>
        ${outfit.description ? `<div style="font-size: 0.75rem; color: rgba(4,93,93,0.7); margin-top: 2px;">${outfit.description}</div>` : ''}
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">
          ${items.length === 0
            ? '<span style="font-size: 0.7rem; color: rgba(4,93,93,0.5);">No items linked</span>'
            : items.map(item => `
                <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; background: rgba(4,93,93,0.08); border-radius: 999px; padding: 3px 9px 3px 3px; color: var(--exterior);">
                  <span style="width: 20px; height: 20px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #fff; display: flex; align-items: center; justify-content: center;">
                    ${item.image_path
                      ? `<img src="${item.image_path}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name}">`
                      : `<span style="font-size: 0.65rem;">${CATEGORY_EMOJI[item.category] || '👕'}</span>`
                    }
                  </span>
                  ${item.name}
                </span>
              `).join('')
          }
        </div>

        <button onclick="deleteAdminOutfit(${outfit.id})" style="position: absolute; top: 12px; right: 12px; background: rgba(192, 74, 58, 0.9); color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 0.7rem; cursor: pointer;">
          Delete
        </button>
      </div>
    `;
    }).join('');
  } catch (err) {
    console.error("Error loading outfits:", err);
  }
}

// Action handler to delete one of your own outfits
window.deleteAdminOutfit = async function(outfitId) {
  adminConfirm(
    'Delete Outfit',
    "Delete this outfit? This won't delete the individual clothing items.",
    async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      try {
        const response = await fetch(`/api/outfits/${outfitId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          showAdminToast('Outfit deleted.');
          loadAdminOutfits();
        } else {
          showAdminToast('Failed to delete outfit.', 'error');
        }
      } catch (err) {
        console.error('Error deleting outfit:', err);
        showAdminToast('Network error.', 'error');
      }
    }
  );
};

// Fetch and display global counters on the overview tab
async function loadRealDashboard() {
    const dashboardData = await apiGet('/dashboard');
    if (dashboardData && dashboardData.summary) {
        const s = dashboardData.summary;

        const totalUsersEl   = document.getElementById('statTotalUsers');
        const totalClothesEl = document.getElementById('statTotalClothes');
        const liveSessionsEl = document.getElementById('statLiveSessions');
        const newSignupsEl   = document.getElementById('statNewSignups');
        const engagementEl   = document.getElementById('statEngagementScore');

        if (totalUsersEl) {
            totalUsersEl.textContent = s.total_users;
            animateCountUp(totalUsersEl, s.total_users);
        }
        if (totalClothesEl) {
            totalClothesEl.textContent = s.total_wardrobe_items;
            animateCountUp(totalClothesEl, s.total_wardrobe_items);
        }
        if (liveSessionsEl) {
            liveSessionsEl.textContent = s.active_users;
            animateCountUp(liveSessionsEl, s.active_users);
        }
        if (engagementEl) {
            engagementEl.textContent = `${s.engagement_score || 0}%`;
            animateCountUp(engagementEl, `${s.engagement_score || 0}%`);
        }

        const signupsThisWeek  = s.signups_this_week  ?? 0;
        const signupsPriorWeek = s.signups_prior_week ?? 0;
        const itemsThisWeek    = s.items_added_this_week ?? 0;
        const signupsDelta     = signupsThisWeek - signupsPriorWeek;

        if (newSignupsEl) {
            newSignupsEl.textContent = signupsThisWeek;
            animateCountUp(newSignupsEl, signupsThisWeek);
        }

        renderTrendSpan(document.getElementById('statUsersTrend'), signupsThisWeek, '');
        renderTrendSpan(document.getElementById('statClothesTrend'), itemsThisWeek, '');
        renderTrendSpan(document.getElementById('statSignupsTrend'), signupsDelta, '');
    }
}


/**
 * Shared animated counter — used by both admin and user panels.
 * Animates el.textContent from 0 to target (number or '%' string).
 */
function animateCountUp(el, target, duration = 900) {
    if (!el) return;
    const isPercent = typeof target === 'string' && target.endsWith('%');
    const end = parseInt(target, 10) || 0;
    if (end === 0) return;
    const startTime = performance.now();
    (function tick(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = isPercent ? `${Math.round(eased * end)}%` : Math.round(eased * end);
        if (t < 1) requestAnimationFrame(tick);
    })(performance.now());
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
      // Track which users we've already seen to highlight new entries
      const prevUsers = new Set(
        Array.from(feed.querySelectorAll('.live-item')).map(el => el.dataset.user)
      );
      feed.innerHTML = activity.map((u, i) => {
        const avatarHtml = u.avatar
          ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
          : initials(u.username);
        return `
          <div class="live-item${!prevUsers.has(u.username) ? ' new-entry' : ''}" data-user="${u.username}" style="animation-delay:${i * 0.06}s">
            <div class="live-avatar" style="display:flex; align-items:center; justify-content:center; overflow:hidden;">${avatarHtml}</div>
            <div class="live-text"><b>${u.username}</b> logged in</div>
            <div class="live-time">${timeAgo(u.last_active)}</div>
          </div>
        `;
      }).join('');
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

// Populate the Settings form with the admin's current username/theme/avatar,
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

      if (s.theme) {
        localStorage.setItem('theme', s.theme);
        applyAdminTheme(s.theme);
      }

      if (s.avatar) {
        try {
          localStorage.setItem('profileAvatar', s.avatar);
        } catch (storageError) {
          console.warn('Could not cache avatar locally (likely too large for localStorage):', storageError);
        }
      } else {
        localStorage.removeItem('profileAvatar');
      }

      if (s.banner) {
        try {
          localStorage.setItem('profileBanner', s.banner);
        } catch (e) {
          console.warn(e);
        }
      } else {
        localStorage.removeItem('profileBanner');
      }

      usernameInput.value = currentUser.username || '';
      adminCurrentNotifPrefs = s.notifications || { email: false, push: false };

      const darkToggle = document.getElementById('admin-dark-mode-toggle');
      if (darkToggle) darkToggle.checked = s.theme === 'dark';

      // Set input fields for border customization
      const borderStyleSelect = document.getElementById('admin-border-style');
      const borderColorInput = document.getElementById('admin-border-color');
      const borderWidthSlider = document.getElementById('admin-border-width');
      const borderWidthValLabel = document.getElementById('border-width-val');

      if (s.border_style && borderStyleSelect) borderStyleSelect.value = s.border_style;
      if (s.border_color && borderColorInput) borderColorInput.value = s.border_color;
      if (borderWidthSlider) {
        const parsedWidth = parseInt(s.border_width, 10) || 0;
        borderWidthSlider.value = parsedWidth;
        if (borderWidthValLabel) borderWidthValLabel.textContent = `${parsedWidth}px`;
      }

      // Sync settings page profile card preview avatar
      const previewAvatarImg = document.getElementById('preview-avatar-img');
      const previewAvatarFallback = document.getElementById('preview-avatar-fallback');
      const name = currentUser.username || currentUser.email || 'Admin';
      const activeAvatar = s.avatar || localStorage.getItem('profileAvatar');

      if (activeAvatar) {
        if (previewAvatarImg) {
          previewAvatarImg.src = activeAvatar;
          previewAvatarImg.style.display = 'block';
        }
        if (previewAvatarFallback) previewAvatarFallback.style.display = 'none';
      } else {
        if (previewAvatarImg) previewAvatarImg.style.display = 'none';
        if (previewAvatarFallback) {
          previewAvatarFallback.style.display = 'flex';
          previewAvatarFallback.textContent = name.charAt(0).toUpperCase();
        }
      }

      // Sync settings page profile card preview username
      const previewUsername = document.getElementById('preview-username');
      if (previewUsername) {
        previewUsername.textContent = name;
      }

      // Sync settings page profile card preview banner
      const bannerPreview = document.getElementById('settings-banner-preview');
      if (bannerPreview) {
        if (s.banner) {
          bannerPreview.style.backgroundImage = `url(${s.banner})`;
        } else {
          bannerPreview.style.backgroundImage = '';
        }
      }

      // Update the live border preview
      if (typeof updateBorderPreview === 'function') updateBorderPreview();
    }
  } catch (err) {
    console.error('Failed to load admin settings:', err);
  }

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

// Global scope helper for live border preview updates
window.updateBorderPreview = function() {
  const borderStyleSelect = document.getElementById('admin-border-style');
  const borderColorInput = document.getElementById('admin-border-color');
  const borderWidthSlider = document.getElementById('admin-border-width');
  const borderWidthValLabel = document.getElementById('border-width-val');

  const style = borderStyleSelect ? borderStyleSelect.value : 'solid';
  const color = borderColorInput ? borderColorInput.value : '#81cdc6';
  const width = borderWidthSlider ? parseInt(borderWidthSlider.value, 10) : 0;

  if (borderWidthValLabel) {
    borderWidthValLabel.textContent = `${width}px`;
  }

  const avatarWrap = document.getElementById('preview-avatar-wrap');
  if (avatarWrap) {
    // Remove only border animation classes — keep profile-preview-avatar-wrap intact
    avatarWrap.classList.remove('avatar-container', 'border-glowing', 'border-neon-wave');
    avatarWrap.style.borderStyle = '';
    avatarWrap.style.borderWidth = '';
    avatarWrap.style.borderColor = '';
    avatarWrap.style.setProperty('--glow-color', '');

    if (width > 0 && style !== 'none') {
      if (style === 'glowing') {
        avatarWrap.classList.add('border-glowing');
        avatarWrap.style.border = `${width}px solid ${color}`;
        avatarWrap.style.setProperty('--glow-color', color);
      } else if (style === 'neon-wave') {
        avatarWrap.classList.add('border-neon-wave');
        avatarWrap.style.border = `${width}px solid #81cdc6`;
      } else {
        avatarWrap.style.border = `${width}px ${style} ${color}`;
      }
    } else {
      // Default overlap border style for card contrast
      avatarWrap.style.border = '3px solid #092323';
    }
  }
};

function setupAdminSettingsForm() {
  const form = document.getElementById('admin-settings-form');
  const usernameInput = document.getElementById('admin-settings-username');
  const uploadInput = document.getElementById('admin-profile-upload');
  const filenameLabel = document.getElementById('admin-profile-filename');
  const darkToggle = document.getElementById('admin-dark-mode-toggle');

  const bannerInput = document.getElementById('admin-banner-upload');
  const bannerFilenameLabel = document.getElementById('admin-banner-filename');
  
  const borderStyleSelect = document.getElementById('admin-border-style');
  const borderColorInput = document.getElementById('admin-border-color');
  const borderWidthSlider = document.getElementById('admin-border-width');

  let pendingAvatarBase64 = null;
  let pendingBannerBase64 = null;
  const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024; // 1.5MB
  const MAX_BANNER_BYTES = 2.5 * 1024 * 1024; // 2.5MB (allows slightly larger GIFs)

  if (uploadInput) {
    uploadInput.addEventListener('change', () => {
      const file = uploadInput.files && uploadInput.files[0];
      if (!file) {
        if (filenameLabel) filenameLabel.textContent = 'No file chosen';
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        if (typeof showToast === 'function') {
          showToast(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB — please use one under 1.5MB so it can be saved.`);
        }
        uploadInput.value = '';
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

        // Live preview sync
        const previewAvatarImg = document.getElementById('preview-avatar-img');
        const previewAvatarFallback = document.getElementById('preview-avatar-fallback');
        if (previewAvatarImg && previewAvatarFallback) {
          previewAvatarImg.src = pendingAvatarBase64;
          previewAvatarImg.style.display = 'block';
          previewAvatarFallback.style.display = 'none';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle banner upload
  if (bannerInput) {
    bannerInput.addEventListener('change', () => {
      const file = bannerInput.files && bannerInput.files[0];
      if (!file) {
        if (bannerFilenameLabel) bannerFilenameLabel.textContent = 'No file chosen';
        return;
      }
      if (file.size > MAX_BANNER_BYTES) {
        if (typeof showToast === 'function') {
          showToast(`That banner is ${(file.size / 1024 / 1024).toFixed(1)}MB — please use one under 2.5MB.`);
        }
        bannerInput.value = '';
        if (bannerFilenameLabel) bannerFilenameLabel.textContent = 'No file chosen';
        return;
      }
      if (bannerFilenameLabel) bannerFilenameLabel.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        pendingBannerBase64 = e.target.result;
        const bannerPreview = document.getElementById('settings-banner-preview');
        if (bannerPreview) {
          bannerPreview.style.backgroundImage = `url(${pendingBannerBase64})`;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Real-time border customization events
  if (borderStyleSelect) borderStyleSelect.addEventListener('change', window.updateBorderPreview);
  if (borderColorInput) borderColorInput.addEventListener('input', window.updateBorderPreview);
  if (borderWidthSlider) borderWidthSlider.addEventListener('input', window.updateBorderPreview);

  // Sync Username in Preview Card as user types
  if (usernameInput) {
    usernameInput.addEventListener('input', () => {
      const previewUsername = document.getElementById('preview-username');
      if (previewUsername) {
        previewUsername.textContent = usernameInput.value.trim() || 'Admin';
      }
    });
  }

  if (darkToggle) {
    darkToggle.addEventListener('change', () => {
      const theme = darkToggle.checked ? 'dark' : 'light';
      applyAdminTheme(theme);
      saveThemePreference(theme);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const theme = darkToggle && darkToggle.checked ? 'dark' : 'light';
      const payload = {
        username: usernameInput ? usernameInput.value.trim() : '',
        theme,
        border_color: borderColorInput ? borderColorInput.value : '#81cdc6',
        border_width: borderWidthSlider ? borderWidthSlider.value + 'px' : '0px',
        border_style: borderStyleSelect ? borderStyleSelect.value : 'solid',
        notifications: adminCurrentNotifPrefs
      };
      if (pendingAvatarBase64) payload.avatar = pendingAvatarBase64;
      if (pendingBannerBase64) payload.banner = pendingBannerBase64;

      let result;
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'Save failed');
        }
      } catch (err) {
        console.error('Failed to save admin settings:', err);
        if (typeof showToast === 'function') showToast(err.message || 'Failed to save settings.');
        return;
      }

      const savedUsername = (result.settings && result.settings.username) || payload.username;
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.username = savedUsername;
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('theme', theme);

      // Save custom fields locally for cache sync
      const s = result.settings || {};
      localStorage.setItem('borderColor', s.border_color || '#81cdc6');
      localStorage.setItem('borderWidth', s.border_width || '0px');
      localStorage.setItem('borderStyle', s.border_style || 'solid');

      if (pendingAvatarBase64) {
        try {
          localStorage.setItem('profileAvatar', pendingAvatarBase64);
        } catch (storageError) {
          console.warn('Could not cache avatar locally (likely too large for localStorage):', storageError);
        }
      }
      if (s.banner) {
        try {
          localStorage.setItem('profileBanner', s.banner);
        } catch (storageError) {
          console.warn(storageError);
        }
      }

      applyAdminTheme(theme);
      loadAdminProfile();
      refreshSettingsAvatarPreview();
      
      pendingAvatarBase64 = null;
      pendingBannerBase64 = null;
      
      if (typeof showToast === 'function') showToast('Settings saved.');
    });
  }
}

/* ============================================================
   NAVIGATION & INITIALIZATION PIPELINE
   ============================================================ */

// Populate the sidebar with the actual logged-in admin's name/avatar.
// Both come from /api/settings (server-persisted), not just localStorage -
// localStorage is only a fast local cache for instant re-renders, and gets
// wiped on logout, so treating it as the source of truth meant a saved
// username/avatar could appear to "not save" after logging back in.
async function loadAdminProfile() {
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    currentUser = {};
  }

  let displayName = currentUser.username || currentUser.email || 'Admin';
  let avatar = localStorage.getItem('profileAvatar');
  let banner = localStorage.getItem('profileBanner');
  let borderColor = localStorage.getItem('borderColor') || '#81cdc6';
  let borderWidth = localStorage.getItem('borderWidth') || '0px';
  let borderStyle = localStorage.getItem('borderStyle') || 'solid';

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const response = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.ok && data.settings) {
        const s = data.settings;
        if (s.username) displayName = s.username;
        if (s.avatar) {
          avatar = s.avatar;
          try {
            localStorage.setItem('profileAvatar', avatar);
          } catch (storageError) {
            console.warn('Could not cache avatar locally (likely too large for localStorage):', storageError);
          }
        }
        if (s.banner) {
          banner = s.banner;
          try {
            localStorage.setItem('profileBanner', banner);
          } catch (e) {
            console.warn(e);
          }
        } else {
          banner = null;
          localStorage.removeItem('profileBanner');
        }
        borderColor = s.border_color || '#81cdc6';
        borderWidth = s.border_width || '0px';
        borderStyle = s.border_style || 'solid';
        localStorage.setItem('borderColor', borderColor);
        localStorage.setItem('borderWidth', borderWidth);
        localStorage.setItem('borderStyle', borderStyle);
      }
    }
  } catch (err) {
    console.error('Error fetching profile settings:', err);
  }

  const savedAvatar = avatar;

  const nameEl = document.getElementById('sidebar-username');
  if (nameEl) nameEl.textContent = displayName;

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
      avatarFallback.textContent = displayName.charAt(0).toUpperCase();
    }
  }

  // Apply banner background to sidebar profile card
  const sidebarProfile = document.querySelector('.sidebar-profile');
  if (sidebarProfile) {
    if (banner) {
      sidebarProfile.style.backgroundImage = `url(${banner})`;
    } else {
      sidebarProfile.style.backgroundImage = '';
    }
  }

  // Apply custom border to sidebar avatar container
  const sidebarAvatarWrap = document.querySelector('.sidebar-profile-left .avatar-container');
  if (sidebarAvatarWrap) {
    const widthVal = parseInt(borderWidth, 10) || 0;
    sidebarAvatarWrap.className = 'avatar-container';
    sidebarAvatarWrap.style.borderStyle = '';
    sidebarAvatarWrap.style.borderWidth = '';
    sidebarAvatarWrap.style.borderColor = '';
    sidebarAvatarWrap.style.setProperty('--glow-color', '');

    if (widthVal > 0 && borderStyle !== 'none') {
      if (borderStyle === 'glowing') {
        sidebarAvatarWrap.classList.add('border-glowing');
        sidebarAvatarWrap.style.border = `${widthVal}px solid ${borderColor}`;
        sidebarAvatarWrap.style.setProperty('--glow-color', borderColor);
      } else if (borderStyle === 'neon-wave') {
        sidebarAvatarWrap.classList.add('border-neon-wave');
        sidebarAvatarWrap.style.border = `${widthVal}px solid #81cdc6`;
      } else {
        sidebarAvatarWrap.style.border = `${widthVal}px ${borderStyle} ${borderColor}`;
      }
    } else {
      sidebarAvatarWrap.style.border = '';
    }
  }
}

/* ============================================================
   ANALYTICS TAB (also powers the Overview tab's Category
   Breakdown, which shared the exact same "never implemented"
   problem)
   ============================================================ */

// Renders a category breakdown list into any container - reused by both
// the Overview tab's #categoryList and the Analytics tab's
// #categoryListAnalytics, since they show the same data.
function renderCategoryBreakdown(containerId, categories) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!categories || categories.length === 0) {
    container.innerHTML = '<div class="empty-state">No wardrobe items yet.</div>';
    return;
  }

  const maxCount = Math.max(...categories.map(c => c.count));
  container.innerHTML = categories.map(c => `
    <div class="cat-row">
      <span class="cat-emoji">${CATEGORY_EMOJI[c.category] || '👕'}</span>
      <span class="cat-name">${c.category || 'Uncategorized'}</span>
      <div class="cat-bar-wrap"><div class="cat-bar" style="width:${maxCount ? Math.round((c.count / maxCount) * 100) : 0}%"></div></div>
      <span class="cat-count">${c.count}</span>
    </div>
  `).join('');
}

async function loadAnalytics() {
  // Category Breakdown - shared between Overview and Analytics tabs
  const wardrobeStats = await apiGet('/stats/wardrobe');
  const categories = (wardrobeStats && wardrobeStats.categories) || [];
  renderCategoryBreakdown('categoryList', categories);
  renderCategoryBreakdown('categoryListAnalytics', categories);

  // Upcoming Calendar Events - real planned outfits across all users,
  // next 14 days
  const eventsList = document.getElementById('eventsList');
  if (eventsList) {
    eventsList.innerHTML = '<div class="empty-state">Loading…</div>';
    const data = await apiGet('/calendar/upcoming?limit=8');
    const events = (data && data.events) || [];
    eventsList.innerHTML = events.length === 0
      ? '<div class="empty-state">No outfits planned in the next two weeks.</div>'
      : events.map(e => `
          <div class="dropdown-row" style="cursor:default;">
            <div class="live-avatar">${initials(e.username)}</div>
            <div class="dropdown-row-text">
              <div class="dropdown-row-title">${e.outfit_name || 'No outfit chosen yet'}</div>
              <div class="dropdown-row-sub">${e.username} • ${formatDate(e.date)}</div>
            </div>
          </div>
        `).join('');
  }

  // All Outfit Usage - real outfits that have actually been marked worn
  // at least once (using the wear_count/last_worn fields), across all users
  const allUsageBody = document.getElementById('allUsageBody');
  const recentWornBody = document.getElementById('recentWornBody');
  if (allUsageBody || recentWornBody) {
    if (allUsageBody) allUsageBody.innerHTML = '<tr><td colspan="4" class="empty-state">Loading…</td></tr>';
    if (recentWornBody) recentWornBody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading…</td></tr>';

    const data = await apiGet('/outfits?per_page=50');
    const worn = ((data && data.outfits) || [])
      .filter(o => (o.wear_count || 0) > 0)
      .sort((a, b) => new Date(b.last_worn) - new Date(a.last_worn));

    if (allUsageBody) {
      allUsageBody.innerHTML = worn.length === 0
        ? '<tr><td colspan="4" class="empty-state">No outfits have been marked as worn yet.</td></tr>'
        : worn.map(o => `
            <tr>
              <td>${o.name}</td>
              <td>${o.username}</td>
              <td>${o.description || '—'}</td>
              <td>${o.last_worn ? formatDate(o.last_worn) : '—'}</td>
            </tr>
          `).join('');
    }

    // Overview tab's Recently Worn - same data, top 5, plus a Wear
    // Frequency column that Analytics doesn't show
    if (recentWornBody) {
      const recent = worn.slice(0, 5);
      recentWornBody.innerHTML = recent.length === 0
        ? '<tr><td colspan="5" class="empty-state">No outfits have been marked as worn yet.</td></tr>'
        : recent.map(o => `
            <tr>
              <td>${o.name}</td>
              <td>${o.username}</td>
              <td>${o.description || '—'}</td>
              <td>${o.last_worn ? formatDate(o.last_worn) : '—'}</td>
              <td>${o.wear_count} time${o.wear_count === 1 ? '' : 's'}</td>
            </tr>
          `).join('');
    }
  }
}

function switchView(name) {
  // Animate outgoing view
  const currentActive = document.querySelector('.view.active');
  if (currentActive && currentActive.id !== 'view-' + name) {
    currentActive.classList.add('exiting');
    currentActive.addEventListener('animationend', () => {
      currentActive.classList.remove('active', 'exiting');
    }, { once: true });
  }

  // Animate incoming view (slight delay so outgoing exits first)
  setTimeout(() => {
    const targetView = document.getElementById('view-' + name);
    if (targetView) {
      targetView.classList.add('active');
    }
  }, 80);

  document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  const titles = { overview: 'Overview', users: 'Users', clothes: 'Clothes', analytics: 'Analytics', settings: 'System Settings' };
  const topbar = document.getElementById('topbarTitle');
  if (topbar) {
    // Animate topbar title
    topbar.style.opacity = '0';
    topbar.style.transform = 'translateY(-6px)';
    topbar.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(() => {
      topbar.textContent = titles[name] || 'Overview';
      topbar.style.opacity = '1';
      topbar.style.transform = 'translateY(0)';
    }, 120);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Auth Guard: redirect to login if not authenticated
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  if (!token) {
    localStorage.clear();
    window.location.href = '/';
    return;
  }

  // Apply the admin's saved theme immediately, before anything else renders
  applyAdminTheme(localStorage.getItem('theme'));


  // Load initial data
  loadAdminProfile();
  loadAdminPersonalWardrobe();
  loadAdminOutfits();
  loadRealDashboard();
  loadLiveActivity();
  loadUsers();
  loadAdminSettingsForm();
  setupAdminSettingsForm();
  loadAnalytics();
  loadCurrentAnnouncement();


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
        loadAdminOutfits();
      }
      if (btn.dataset.view === 'users') {
        loadUsers();
      }
      if (btn.dataset.view === 'settings') {
        loadAdminSettingsForm();
      }
      if (btn.dataset.view === 'analytics') {
        loadAnalytics();
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

  // Create Outfit Modal Setup
  const createOutfitBtn = document.getElementById('createOutfitBtn');
  const outfitModal = document.getElementById('admin-create-outfit-modal');
  const closeOutfitBtn = document.getElementById('close-admin-create-outfit-modal');
  const outfitForm = document.getElementById('admin-create-outfit-form');
  const outfitItemsContainer = document.getElementById('admin-new-outfit-items');

  // Populate the item checklist from the admin's own wardrobe each time the modal opens
  async function populateOutfitItemChecklist() {
    if (!outfitItemsContainer) return;
    outfitItemsContainer.innerHTML = '<div class="empty-state">Loading your wardrobe…</div>';

    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    try {
      const response = await fetch('/api/wardrobe', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        outfitItemsContainer.innerHTML = '<div class="empty-state">Could not load wardrobe items.</div>';
        return;
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.items || []);

      outfitItemsContainer.innerHTML = items.length === 0
        ? '<div class="empty-state">Add some wardrobe items first.</div>'
        : items.map(item => `
            <label style="display: flex; align-items: center; gap: 8px; padding: 6px 4px; cursor: pointer; font-size: 0.85rem;">
              <input type="checkbox" class="outfit-item-checkbox" value="${item.id}">
              <span style="width: 24px; height: 24px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: #fff; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(4,93,93,0.1);">
                ${item.image_path
                  ? `<img src="${item.image_path}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name}">`
                  : `<span style="font-size: 0.8rem;">${CATEGORY_EMOJI[item.category] || '👕'}</span>`
                }
              </span>
              <span>${item.name} <span style="color: rgba(4,93,93,0.6);">(${item.category})</span></span>
            </label>
          `).join('');
    } catch (err) {
      console.error("Error loading items for outfit modal:", err);
      outfitItemsContainer.innerHTML = '<div class="empty-state">Could not load wardrobe items.</div>';
    }
  }

  if (createOutfitBtn && outfitModal) {
    createOutfitBtn.addEventListener('click', () => {
      outfitModal.classList.add('visible');
      populateOutfitItemChecklist();
    });
  }

  if (closeOutfitBtn && outfitModal) {
    closeOutfitBtn.addEventListener('click', () => {
      outfitModal.classList.remove('visible');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === outfitModal) {
      outfitModal.classList.remove('visible');
    }
  });

  if (outfitForm) {
    outfitForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const selectedIds = Array.from(
        outfitItemsContainer.querySelectorAll('.outfit-item-checkbox:checked')
      ).map(cb => parseInt(cb.value, 10));

      const payload = {
        name: document.getElementById('admin-new-outfit-name').value.trim(),
        description: document.getElementById('admin-new-outfit-description').value.trim(),
        item_ids: selectedIds
      };

      try {
        const activeToken = localStorage.getItem('token') || localStorage.getItem('access_token');
        const response = await fetch('/api/outfits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          if (typeof showToast === 'function') showToast("Outfit created!");
          outfitModal.classList.remove('visible');
          outfitForm.reset();
          loadAdminOutfits();
        } else {
          if (typeof showToast === 'function') showToast("Failed to save outfit.");
        }
      } catch (err) {
        console.error("Error saving outfit:", err);
        if (typeof showToast === 'function') showToast("Network error saving outfit.");
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
        <div class="live-avatar" style="overflow: hidden; background: #fff;">
          ${it.image_path
            ? `<img src="${it.image_path}" style="width: 100%; height: 100%; object-fit: cover;" alt="${it.name}">`
            : (CATEGORY_EMOJI[it.category] || '👕')
          }
        </div>
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

    const data = await apiGet('/activity/recent?limit=8&include_all=true');
    const activity = (data && data.recent_activity) || [];

    dropdown.innerHTML = '<div class="dropdown-header">Recent Activity</div>' + (
      activity.length === 0
        ? '<div class="dropdown-empty">No recent activity.</div>'
        : activity.map(a => {
            let title = '';
            let sub = '';
            if (a.type === 'item_added') {
              title = `${a.username} added <b>${a.item_name}</b>`;
              sub = `${a.category || 'Wardrobe item'} • ${timeAgo(a.timestamp)}`;
            } else if (a.type === 'outfit_created') {
              title = `${a.username} created outfit <b>${a.outfit_name}</b>`;
              sub = `New outfit • ${timeAgo(a.timestamp)}`;
            } else {
              title = `${a.username} logged in`;
              sub = timeAgo(a.timestamp || a.last_active);
            }
            return `
              <div class="dropdown-row">
                <div class="live-avatar">${initials(a.username)}</div>
                <div class="dropdown-row-text">
                  <div class="dropdown-row-title">${title}</div>
                  <div class="dropdown-row-sub">${sub}</div>
                </div>
              </div>
            `;
          }).join('')
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

  // Determine current admin's own user ID from JWT so we can mark that row
  let currentUserId = null;
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = parseInt(payload.sub || payload.identity || payload.user_id, 10);
    }
  } catch(e) {}

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
    const isSelf = currentUserId && u.id === currentUserId;

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

    const avatarHtml = u.avatar
      ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
      : initials(u.username || u.email || '?');

    const actionsHtml = isSelf
      ? `<span style="font-size:0.75rem; color:rgba(4,93,93,0.4); font-style:italic;">You</span>`
      : `<button class="row-action" title="${isEnabled ? 'Disable user' : 'Enable user'}" onclick="toggleUserActive(${u.id}, this)">
              <svg viewBox="0 0 24 24">${isEnabled
                ? '<circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line>'
                : '<circle cx="12" cy="12" r="10"></circle><polyline points="9 12 12 15 16 10"></polyline>'}</svg>
            </button>
            <button class="row-action del" title="Delete user" onclick="deleteUserAdmin(${u.id}, '${(u.username || '').replace(/'/g, "\\'")}')">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
            </button>`;

    return `
      <tr data-user-id="${u.id}"${isSelf ? ' style="opacity:0.75;"' : ''}>
        <td>
          <div class="item-cell">
            <div class="live-avatar" style="display:flex; align-items:center; justify-content:center; overflow:hidden;">${avatarHtml}</div>
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
            ${actionsHtml}
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
    showAdminToast(result.data.is_active ? 'User enabled.' : 'User disabled.');
    loadUsers();
  } else {
    const msg = (result && result.data && result.data.error) || "Couldn't update user.";
    showAdminToast(msg, 'error');
    if (btnEl) btnEl.disabled = false;
  }
};

// Delete a user and all their data
window.deleteUserAdmin = async function(userId, username) {
  adminConfirm(
    'Delete User',
    `Delete <strong>${username || 'this user'}</strong> and all their data? This cannot be undone.`,
    async () => {
      const result = await apiMutate(`/users/${userId}/delete`, 'DELETE');
      if (result && result.ok) {
        showAdminToast('User deleted.');
        loadUsers();
        loadRealDashboard();
      } else {
        const msg = (result && result.data && result.data.error) || "Couldn't delete user.";
        showAdminToast(msg, 'error');
      }
    }
  );
};

// ==========================================
// ADMIN ANNOUNCEMENT BROADCASTER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const announcementForm = document.getElementById('admin-announcement-form');
  const announcementClearBtn = document.getElementById('admin-announcement-clear-btn');
  const announcementInput = document.getElementById('admin-announcement-msg');

  if (announcementForm) {
    announcementForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = announcementInput.value.trim();
      if (!message) return;
      
      const res = await apiMutate('/announcement', 'POST', { message });
      if (res && res.ok) {
        if (typeof showToast === 'function') showToast('Announcement published successfully.');
      } else {
        const errorMsg = (res && res.data && res.data.error) || 'Failed to publish announcement.';
        if (typeof showToast === 'function') showToast(errorMsg);
      }
    });
  }

  if (announcementClearBtn) {
    announcementClearBtn.addEventListener('click', async () => {
      const res = await apiMutate('/announcement/clear', 'POST');
      if (res && res.ok) {
        if (typeof showToast === 'function') showToast('Announcement cleared.');
        if (announcementInput) announcementInput.value = '';
      } else {
        if (typeof showToast === 'function') showToast('Failed to clear announcement.');
      }
    });
  }
});

async function loadCurrentAnnouncement() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  try {
    const res = await fetch('/api/auth/announcement', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.ok && data.announcement) {
      const input = document.getElementById('admin-announcement-msg');
      if (input) input.value = data.announcement.message;
    }
  } catch (err) {
    console.error('Error fetching current announcement:', err);
  }
}
window.loadCurrentAnnouncement = loadCurrentAnnouncement;

/* ============================================================
   ADMIN TOAST & CONFIRM MODAL
   ============================================================ */

let _toastTimer = null;

function showAdminToast(message, type = 'success') {
  // Also feed window.showToast so any other caller works too
  let el = document.getElementById('admin-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'admin-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = type === 'error' ? 'error show' : 'show';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = el.className.replace(' show', '').replace('show', '').trim(); }, 3200);
}

// Make it available as the global showToast used throughout the file
window.showToast = showAdminToast;

let _confirmCallback = null;

function adminConfirm(title, body, onConfirm) {
  const overlay = document.getElementById('admin-confirm-overlay');
  const titleEl = document.getElementById('admin-confirm-title');
  const bodyEl  = document.getElementById('admin-confirm-body');
  if (!overlay || !titleEl || !bodyEl) {
    // Fallback if modal HTML missing
    if (confirm(title + '\n' + body.replace(/<[^>]+>/g, ''))) onConfirm();
    return;
  }
  titleEl.textContent = title;
  bodyEl.innerHTML = body;
  _confirmCallback = onConfirm;
  overlay.classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay   = document.getElementById('admin-confirm-overlay');
  const cancelBtn = document.getElementById('admin-confirm-cancel');
  const okBtn     = document.getElementById('admin-confirm-ok');

  function closeConfirm() {
    if (overlay) overlay.classList.remove('show');
    _confirmCallback = null;
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeConfirm);
  if (overlay)   overlay.addEventListener('click', e => { if (e.target === overlay) closeConfirm(); });
  if (okBtn) {
    okBtn.addEventListener('click', () => {
      const callback = _confirmCallback;
      closeConfirm();
      if (typeof callback === 'function') callback();
    });
  }
});