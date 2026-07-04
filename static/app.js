// ==========================================
// INITIALIZATION (Runs on every page load)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Core features
    if (typeof applyGlobalSettings === 'function') applyGlobalSettings();
    if (document.getElementById('username') && typeof initSettingsPage === 'function') initSettingsPage();
    if (typeof initGeneralFeatures === 'function') initGeneralFeatures();
    if (typeof highlightActiveLink === 'function') highlightActiveLink();
    
    let dashboardWardrobe = [];
    let dashboardOutfits = [];
    // Page: Dashboard (recent-additions-grid)
    if (document.getElementById("recent-additions-grid")) {
        renderDashboard();
        setupDashboardSearch();
    }

    // Page: Outfits (planner-grid & planner-wardrobe-grid)
    if (document.getElementById('planner-grid')) {
        renderPlannerWardrobe(); 
        renderSavedOutfits();    
    }

    // Page: Favorites (favorites-grid)
    if (document.getElementById('favorites-grid')) {
        renderFavorites();
    }

    // Page: Wardrobe (wardrobe-grid)
    if (document.getElementById('wardrobe-grid')) {
        if (typeof renderWardrobe === 'function') renderWardrobe();
        if (typeof initItemPhotoUpload === 'function') initItemPhotoUpload();
    }

    if (document.getElementById("settings-page")) {
    initSettingsPage();
    }
});

// ==========================================
// 1. DASHBOARD FUNCTIONS
// ==========================================
async function renderDashboard() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        // Fetch both Wardrobe and Outfits concurrently for speed
        const [wardrobeResponse, outfitResponse] = await Promise.all([
            fetch("/api/wardrobe", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/outfits", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        dashboardWardrobe = wardrobeResponse.ok
    ? await wardrobeResponse.json()
    : [];

dashboardOutfits = outfitResponse.ok
    ? await outfitResponse.json()
    : [];

const wardrobe = dashboardWardrobe;
const outfits = dashboardOutfits;
        // ----------------------------------------------------
        // A. Update Top Stats (With safety checks)
        // ----------------------------------------------------
        const totalItemsEl = document.getElementById("total-items");
        if (totalItemsEl) totalItemsEl.textContent = wardrobe.length || 0;

        const savedOutfitsEl = document.getElementById("saved-outfits");
        if (savedOutfitsEl) savedOutfitsEl.textContent = outfits.length || 0;
        
        const outfitsWornEl = document.getElementById("outfits-worn");
        if (outfitsWornEl) outfitsWornEl.textContent = outfits.length > 0 ? Math.floor(outfits.length * 2.5) : 0;
        
        const utilizationEl = document.getElementById("utilization-rate");
        if (utilizationEl) {
            const utilization = wardrobe.length > 0 ? Math.floor(Math.random() * 30 + 50) : 0; 
            utilizationEl.textContent = `${utilization}%`;
        }

        // ----------------------------------------------------
        // B. Update Recent Additions (Last 6 items)
        // ----------------------------------------------------
        const recentGrid = document.getElementById("recent-additions-grid");
        if (recentGrid) {
            recentGrid.innerHTML = '';
            // Reverse to get newest first, take top 6
            const recentItems = [...wardrobe].reverse().slice(0, 6);
            
            if (recentItems.length === 0) {
                recentGrid.innerHTML = '<p style="padding: 1rem; color: var(--text-muted);">No items in wardrobe yet.</p>';
            } else {
                recentItems.forEach((item, index) => {
                    const isNew = index < 2 ? '<span class="clothing-tag">New</span>' : '';
                    const imageHtml = item.image_path 
                        ? `<img src="${item.image_path}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                        : `<svg viewBox="0 0 24 24" class="clothing-img-placeholder"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>`;

                    recentGrid.innerHTML += `
                        <div class="clothing-card" onclick="window.location.href='/wardrobe'">
                            ${isNew}
                            <div class="clothing-img">${imageHtml}</div>
                            <div class="clothing-info">
                                <div class="clothing-name">${item.name}</div>
                                <div class="clothing-cat">${item.category}</div>
                            </div>
                        </div>
                    `;
                });
            }
        }

        // ----------------------------------------------------
        // C. Update Category Breakdown
        // ----------------------------------------------------
        const categoryList = document.getElementById("category-breakdown-list");
        if (categoryList) {
            categoryList.innerHTML = '';
            
            // Count items per category
            const categoryCounts = wardrobe.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + 1;
                return acc;
            }, {});

            const maxCount = Math.max(...Object.values(categoryCounts), 1);
            
            if (Object.keys(categoryCounts).length === 0) {
                categoryList.innerHTML = '<p style="padding: 1rem; color: var(--text-muted);">Add items to see categories.</p>';
            } else {
                const emojis = { 
                'tops': '👕', 'top': '👕', 'top wear': '👕',
                'bottoms': '👖', 'bottom': '👖', 'bottom wear': '👖', 
                'outerwear': '🧥', 
                'shoes': '👟', 'footwear': '👟', 
                'accessories': '🎒', 
                'dresses': '👗'
                };

                Object.entries(categoryCounts).forEach(([cat, count]) => {
                const width = (count / maxCount) * 100;
                const cleanKey = cat.trim().toLowerCase();
                const emoji = emojis[cleanKey] || '🏷️';
                    categoryList.innerHTML += `
                        <div class="cat-row">
                            <span class="cat-emoji">${emoji}</span>
                            <span class="cat-name">${cat}</span>
                            <div class="cat-bar-wrap"><div class="cat-bar" style="width:${width}%"></div></div>
                            <span class="cat-count">${count}</span>
                        </div>
                    `;
                });
            }
        }

        // ----------------------------------------------------
        // D. Update Outfit Suggestions
        // ----------------------------------------------------
        const suggestionsRow = document.getElementById("outfit-suggestions-row");
        if (suggestionsRow) {
            suggestionsRow.innerHTML = '';
            
            // Randomly pick up to 3 outfits for suggestions
            const suggestions = [...outfits].sort(() => 0.5 - Math.random()).slice(0, 3);
            const themes = ['cool', 'warm', 'mono'];
            
            if (suggestions.length === 0) {
                suggestionsRow.innerHTML = '<p style="color: var(--text-muted);">Create some outfits in the Outfit Planner to see suggestions!</p>';
            } else {
                suggestions.forEach((outfit, index) => {
                    const theme = themes[index % themes.length];
                    
                    // Render up to 4 mini thumbnails for the outfit pieces
                    const itemPreviews = (outfit.items || []).slice(0, 4).map(item => {
                        if (item.image_path) return `<div class="outfit-piece"><img src="${item.image_path}" title="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;"></div>`;
                        return `<div class="outfit-piece" title="${item.name}" style="background: var(--interior-pale);"></div>`;
                    }).join('');

                    suggestionsRow.innerHTML += `
                        <div class="outfit-card">
                            <div class="outfit-banner ${theme}"></div>
                            <div class="outfit-body">
                                <div class="outfit-occasion">Generated for you</div>
                                <div class="outfit-name">${outfit.name}</div>
                                <div class="outfit-pieces">${itemPreviews}</div>
                            </div>
                            <div class="outfit-footer">
                                <span class="outfit-weather">✨ Match</span>
                                <button class="outfit-save" onclick="window.location.href='/outfits'">View →</button>
                            </div>
                        </div>
                    `;
                });
            }
        }

        // ----------------------------------------------------
        // E. Update Recently Added History Table
        // ----------------------------------------------------
        const recentlyWornTbody = document.getElementById("recently-worn-tbody");
        if (recentlyWornTbody) {
            recentlyWornTbody.innerHTML = '';
            
            // Sort wardrobe items descending by database ID so the newest additions are strictly displayed first
            const historyItems = [...wardrobe].sort((a, b) => b.id - a.id).slice(0, 5); 
            
            if (historyItems.length === 0) {
                recentlyWornTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">No items added yet.</td></tr>';
            } else {
                historyItems.forEach((item) => {
                    // Extract date if provided by your backend model, fallback cleanly to standard ISO stamp formatting
                    let rawDate = item.created_at || item.date_added || new Date();
                    let formattedDate = new Date(rawDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    
                    let imageHtml = item.image_path || item.image
                        ? `<img src="${item.image_path || item.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` 
                        : `<span style="font-size: 1rem;">🏷️</span>`;

                    recentlyWornTbody.innerHTML += `
                        <tr>
                            <td>
                                <div class="item-cell">
                                    <div class="item-thumb">${imageHtml}</div>
                                    <span style="font-weight: 500; color: var(--text-main);">${item.name || 'Unnamed Item'}</span>
                                </div>
                            </td>
                            <td><span style="color: var(--interior-light); font-size: 0.9rem;">${item.category}</span></td>
                            <td><span style="font-family: monospace; color: var(--text-main); font-size: 0.85rem;">${formattedDate}</span></td>
                        </tr>
                    `;
                });
            }
        }

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

// ==========================================
// 2. OUTFIT PLANNER FUNCTIONS
// ==========================================

async function renderPlannerWardrobe() {
    const grid = document.getElementById('planner-wardrobe-grid');
    if (!grid) return;

    try {
        const response = await fetch('/api/wardrobe', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const items = await response.json();

        if (!response.ok) {
            grid.innerHTML = `<p class="wardrobe-error">Error: ${items.error || 'Could not load wardrobe.'}</p>`;
            return;
        }

        grid.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'clothing-card';
            card.style.cursor = 'pointer';
            
            card.onclick = (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = card.querySelector('.item-select');
                    checkbox.checked = !checkbox.checked;
                }
            };

            card.innerHTML = `
                <input type="checkbox" class="item-select" value="${item.id}">
                <div class="clothing-img">
                    ${item.image_path
                        ? `<img src="${item.image_path}" alt="${item.name}">`
                        : `<svg viewBox="0 0 24 24" class="clothing-img-placeholder"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>`
                    }
                </div>
                <div class="clothing-info">
                    <h3 style="color: var(--text-main);">${item.name}</h3>
                    <div style="margin: 4px 0; display: flex; gap: 4px; align-items: center;">
                        <span class="size-badge">📏 ${item.size || 'N/A'}</span>
                        <span class="color-badge" style="background: rgba(4, 93, 93, 0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">🎨 ${item.color || 'N/A'}</span>
                    </div>
                    <p style="margin-top: 4px;">${item.category}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = `<p class="wardrobe-error">Couldn't load items. Check connection.</p>`;
    }
}

async function renderSavedOutfits() {
    const plannerGrid = document.getElementById('planner-grid');
    if (!plannerGrid) return;
    
    plannerGrid.innerHTML = '<p style="padding: 20px;">Loading outfits...</p>';

    try {
        const response = await fetch('/api/outfits', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const outfits = await response.json();

        if (!response.ok) return;

        plannerGrid.innerHTML = '';
        if (outfits.length === 0) {
            plannerGrid.innerHTML = '<p style="padding: 20px;">No outfits saved yet. Create one above!</p>';
            return;
        }

        outfits.forEach((outfit) => {
            const outfitElement = document.createElement('div');
            outfitElement.className = 'outfit-card';
            
            const itemPreviews = (outfit.items || []).map(item => {
                if (item.image_path) return `<img src="${item.image_path}" class="outfit-item-img" title="${item.name}">`;
                return `<div class="outfit-item-img" style="display: flex; align-items: center; justify-content: center; background: var(--interior-pale);" title="${item.name}">
                            <svg viewBox="0 0 24 24" class="clothing-img-placeholder" style="width: 24px; height: 24px;"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
                        </div>`;
            }).join('');

            outfitElement.innerHTML = `
                <div class="outfit-banner ${['warm', 'cool', 'mono'][Math.floor(Math.random()*3)]}">
                    <button class="favorite-btn" onclick="toggleFavorite(${outfit.id})" style="position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer;">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="${outfit.is_favorite ? '#e74c3c' : 'none'}" stroke="${outfit.is_favorite ? '#e74c3c' : '#ffffff'}" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="outfit-body">
                    <h3>${outfit.name}</h3>
                    <div class="outfit-image-gallery">
                        ${itemPreviews}
                    </div>
                    <button class="aesthetic-remove-btn" onclick="removeOutfit(${outfit.id})">Delete</button>
                </div>
            `;
            plannerGrid.appendChild(outfitElement);
        });
    } catch (err) {
        console.error("Error loading outfits:", err);
    }
}

window.createOutfit = async function() {
    const outfitNameInput = document.getElementById('outfit-name-input');
    const outfitName = outfitNameInput.value.trim();
    if (!outfitName) return alert("Please enter an outfit name!");

    const checkedItems = document.querySelectorAll('.item-select:checked');
    if (checkedItems.length === 0) return alert("Please select at least one item!");

    const itemIds = Array.from(checkedItems).map(item => parseInt(item.value, 10));

    try {
        const response = await fetch('/api/outfits', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: outfitName, item_ids: itemIds })
        });

        if (response.ok) {
            outfitNameInput.value = '';
            checkedItems.forEach(item => item.checked = false);
            renderSavedOutfits();
        }
    } catch (err) {
        console.error("Error saving outfit:", err);
    }
};

window.removeOutfit = async function(outfitId) {
    if (!confirm("Are you sure you want to delete this outfit?")) return;

    try {
        const response = await fetch(`/api/outfits/${outfitId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) renderSavedOutfits(); 
    } catch (err) {
        console.error("Error deleting outfit:", err);
    }
};

// ==========================================
// 3. FAVORITES FUNCTIONS
// ==========================================

window.toggleFavorite = async function(outfitId) {
    try {
        const response = await fetch(`/api/outfits/${outfitId}/favorite`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            // Refresh whichever page we are currently on
            if (document.getElementById('planner-grid')) renderSavedOutfits();
            if (document.getElementById('favorites-grid')) renderFavorites();
        }
    } catch (err) {
        console.error("Error toggling favorite:", err);
    }
};

async function renderFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (!favoritesGrid) return;
    
    favoritesGrid.innerHTML = '<p style="padding: 20px;">Loading favorites...</p>';

    try {
        const response = await fetch('/api/outfits', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const outfits = await response.json();
        const favoriteOutfits = outfits.filter(outfit => outfit.is_favorite);

        favoritesGrid.innerHTML = '';
        if (favoriteOutfits.length === 0) {
            favoritesGrid.innerHTML = '<p style="padding: 20px;">No favorites yet. Go to the Outfit Planner to heart some outfits!</p>';
            return;
        }

        favoriteOutfits.forEach((outfit) => {
            const outfitElement = document.createElement('div');
            outfitElement.className = 'outfit-card';
            
            const itemPreviews = (outfit.items || []).map(item => {
                if (item.image_path) return `<img src="${item.image_path}" class="outfit-item-img" title="${item.name}">`;
                return `<div class="outfit-item-img" style="display: flex; align-items: center; justify-content: center; background: var(--interior-pale);" title="${item.name}">
                            <svg viewBox="0 0 24 24" class="clothing-img-placeholder" style="width: 24px; height: 24px;"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
                        </div>`;
            }).join('');

            outfitElement.innerHTML = `
                <div class="outfit-banner ${['warm', 'cool', 'mono'][Math.floor(Math.random()*3)]}">
                    <button class="favorite-btn" onclick="toggleFavorite(${outfit.id})" style="position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer;">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#e74c3c" stroke="#e74c3c" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="outfit-body">
                    <h3>${outfit.name}</h3>
                    <div class="outfit-image-gallery">
                        ${itemPreviews}
                    </div>
                </div>
            `;
            favoritesGrid.appendChild(outfitElement);
        });
    } catch (err) {
        console.error("Error loading favorites:", err);
    }
}

function applyGlobalSettings() {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const savedName =
    currentUser.username ||
    localStorage.getItem("username") ||
    "User";

    const savedEmail =
    currentUser.email ||
    localStorage.getItem("email") ||
    "";
    const savedAvatar = localStorage.getItem('profileAvatar');
    const savedTheme = localStorage.getItem('theme') || 'default';

    // Apply Global Dark/Light Theme Settings Configuration
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    // Sync Global Sidebar Username Display
    const sidebarUsername = document.getElementById('sidebar-username');
    if (sidebarUsername) {
        sidebarUsername.textContent = savedName;
    }

    // Sync Profile Picture Avatar / Initial Text Fallback Badge
    const sidebarAvatarImg = document.getElementById('sidebar-avatar-img');
    const sidebarAvatarFallback = document.getElementById('sidebar-avatar');

    if (sidebarAvatarImg && sidebarAvatarFallback) {
        if (savedAvatar) {
            sidebarAvatarImg.src = savedAvatar;
            sidebarAvatarImg.style.display = 'block';
            sidebarAvatarFallback.style.display = 'none';
        } else {
            sidebarAvatarImg.style.display = 'none';
            sidebarAvatarFallback.style.display = 'flex';
            sidebarAvatarFallback.textContent = savedName.charAt(0).toUpperCase();
        }
    }
}

/**
 * Log the current user out.
 *
 * IMPORTANT: this app currently caches a lot of per-user data in
 * localStorage (token, username, avatar, theme, email, even password).
 * Because localStorage is shared by every account that ever logs in on
 * the same browser, simply clearing the 'token' is not enough - any
 * leftover cached fields (username, avatar, etc.) will keep leaking into
 * whichever account logs in/registers next on this device. Logout wipes
 * the whole thing so the next login/register starts from a clean slate.
 */
function logoutUser() {
    localStorage.clear();
    window.location.href = '/';
}

/**
 * Set up settings configuration forms, load stored records from API, and capture actions.
 */
async function initSettingsPage() {
    const usernameInput = document.getElementById('username');
    const profileUpload = document.getElementById('profile-upload');
    const fileChosenLabel = document.getElementById('file-chosen');
    const themeSelect = document.getElementById('theme');
    const emailNotif = document.getElementById('emailNotif');
    const pushNotif = document.getElementById('pushNotif');
    
    const userPrefForm = usernameInput ? usernameInput.closest('form') : null;

    // 1. Fetch settings from the Python Blueprint API on load
    try {
        const response = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.ok) {

    const apiSettings = data.settings;

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    currentUser.username = apiSettings.username || currentUser.username;
    currentUser.email = apiSettings.email || currentUser.email;

    localStorage.setItem("user", JSON.stringify(currentUser));

    if (usernameInput)
        usernameInput.value = currentUser.username || "";

    if (emailInput)
        emailInput.value = currentUser.email || "";

    if (themeSelect)
        themeSelect.value = apiSettings.theme || "light";

    if (emailNotif)
        emailNotif.checked = apiSettings.notifications.email;

    if (pushNotif)
        pushNotif.checked = apiSettings.notifications.push;
}
    } catch (error) {
        console.error("Failed to load settings from backend API:", error);
    }

    let loadedAvatarBase64 = localStorage.getItem('profileAvatar') || '';

    // Monitor custom file upload
    if (profileUpload) {
        profileUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (fileChosenLabel) fileChosenLabel.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function(event) {
                    loadedAvatarBase64 = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                if (fileChosenLabel) fileChosenLabel.textContent = 'No file chosen';
            }
        });
    }

    // 2. Send Data back to Python Backend on Submit
    if (userPrefForm) {
        userPrefForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Prepare payload for the API
            const payload = {
                username: usernameInput ? usernameInput.value.trim() : '',
                theme: themeSelect ? themeSelect.value : 'default',
                notifications: {
                    email: emailNotif ? emailNotif.checked : false,
                    push: pushNotif ? pushNotif.checked : false
                }
            };

            // Send to Flask Blueprint Backend
            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                console.error("Failed to save settings to backend:", error);
            }

            // Sync with local storage for instant frontend rendering
            const currentUser =
             JSON.parse(localStorage.getItem("user") || "{}");

            currentUser.username = payload.username;

            if (emailInput)
               currentUser.email = emailInput.value.trim();

            localStorage.setItem("user", JSON.stringify(currentUser));
            localStorage.setItem("username", currentUser.username);
            localStorage.setItem("email", currentUser.email);
            localStorage.setItem("theme", payload.theme);
            localStorage.setItem("emailNotif", payload.notifications.email);
            localStorage.setItem("pushNotif", payload.notifications.push);

            if (loadedAvatarBase64) {
            localStorage.setItem("profileAvatar", loadedAvatarBase64);
            }

            applyGlobalSettings();
            alert('User preferences saved successfully to server!');
        });
    }

    // Privacy & Security forms remain unchanged (saving to local storage for now)
    const emailInput = document.getElementById('email');
    if (emailInput) {

    const currentUser =
        JSON.parse(localStorage.getItem("user") || "{}");

    currentUser.email = emailInput.value.trim();

    localStorage.setItem("user", JSON.stringify(currentUser));
    localStorage.setItem("email", currentUser.email);

    }

    const privacyForm = emailInput ? emailInput.closest('form') : null;
    if (privacyForm) {
        privacyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const passwordInput = document.getElementById('password');
            if (passwordInput && passwordInput.value) {
                localStorage.setItem('password', passwordInput.value);
                passwordInput.value = ''; 
            }
            if (emailInput) {
                localStorage.setItem('email', emailInput.value.trim());
            }
            alert('Account security data updated successfully!');
        });
    }
}

/**
 * Handles structural user experience interface controllers (Modals, Panels, Overlays)
 */
function initGeneralFeatures() {
    const filterBtn = document.getElementById('open-filter-modal');
    const notifBtn = document.getElementById('open-notif-modal');
    const addBtn = document.getElementById('open-add-modal');

    const filterModal = document.getElementById('filter-modal');
    const notifModal = document.getElementById('notif-modal');
    const addModal = document.getElementById('add-item-modal');
    const closeModalBtn = document.getElementById('close-add-modal');

    if (filterBtn && filterModal) filterBtn.addEventListener('click', () => filterModal.classList.add('active'));
    if (notifBtn && notifModal) notifBtn.addEventListener('click', () => notifModal.classList.add('active'));
    if (addBtn && addModal) addBtn.addEventListener('click', () => addModal.classList.add('active'));
    if (closeModalBtn && addModal) closeModalBtn.addEventListener('click', () => addModal.classList.remove('active'));

    // Logout button (present in the sidebar on every page)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

    // The form was never being submitted via JS before - clicking "Add to
    // Wardrobe" just triggered the browser's default form submission (a
    // full-page reload), so saveNewItem() never actually ran.
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveNewItem();
        });
    }

    // Automatically collapse and slide active windows down if user clicks target container overlay regions
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
        }
    });
}

// --- CALENDAR LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // Only run this if we are on the page with the calendar
    if (document.getElementById('calendar-grid')) {
        let currentWeekStart = getStartOfWeek(new Date());
        renderCalendar(currentWeekStart);

        document.getElementById('prev-week-btn').addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            renderCalendar(currentWeekStart);
        });

        document.getElementById('next-week-btn').addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            renderCalendar(currentWeekStart);
        });
    }
});

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
}

function renderCalendar(startOfWeek) {
    const grid = document.getElementById('calendar-grid');
    const rangeLabel = document.getElementById('current-week-range');
    grid.innerHTML = ''; 

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    let firstDayStr = "";
    let lastDayStr = "";

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);

        const monthOpt = { month: 'short', day: 'numeric' };
        if (i === 0) firstDayStr = currentDay.toLocaleDateString('en-US', monthOpt);
        if (i === 6) lastDayStr = currentDay.toLocaleDateString('en-US', monthOpt);

        const isToday = currentDay.toDateString() === today.toDateString() ? 'today' : '';
        const dayCard = document.createElement('div');
        dayCard.className = `calendar-day-card ${isToday}`;
        
        // Mock data: Puts a fake outfit image on Tuesday just so you can see what it looks like
        const hasOutfit = i === 1; 
        const slotHTML = hasOutfit 
            ? `<div class="outfit-slot assigned" style="background-image: url('/static/assets/images/linen-slip-dress.png');" title="View Outfit Details"></div>`
            : `<div class="outfit-slot" onclick="alert('Open outfit selector modal for: ${currentDay.toDateString()}')">
                <span>+ Plan</span>
               </div>`;

        dayCard.innerHTML = `
            <span class="day-name">${daysOfWeek[i]}</span>
            <span class="day-number">${currentDay.getDate()}</span>
            ${slotHTML}
        `;
        grid.appendChild(dayCard);
    }
    rangeLabel.textContent = `${firstDayStr} - ${lastDayStr}`;
}

async function savePlannedOutfit(date, outfitId) {
    const response = await fetch('/api/calendar', {
        method: 'POST', // You'll need to add a POST route in your Python file for this
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: date, // format: 'YYYY-MM-DD'
            outfit_id: outfitId
        })
    });
    return response.json();
}

// --- WARDROBE LOGIC --- //
// Store the full list of items globally so we can filter them
let allWardrobeItems = []; 

async function renderWardrobe(filterCategory = 'All') {
    const grid = document.getElementById('wardrobe-grid');
    if (!grid) return;

    // Fetch if empty
    if (allWardrobeItems.length === 0) {
        try {
            const headers = {};
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch('/api/wardrobe', { headers: headers });
            const data = await response.json();

            if (!response.ok || !Array.isArray(data)) {
                // Backend returned an error object like {error: "..."} rather
                // than an item array (e.g. 401/422 from a missing/invalid
                // JWT). Show that instead of crashing on .filter/.forEach.
                grid.innerHTML = `<p class="wardrobe-error">Couldn't load your wardrobe: ${data.error || response.statusText || 'unknown error'}. Make sure you're logged in.</p>`;
                return;
            }

            allWardrobeItems = data;
        } catch (err) {
            console.error('Error fetching wardrobe:', err);
            grid.innerHTML = `<p class="wardrobe-error">Couldn't load your wardrobe. Please check your connection and try again.</p>`;
            return;
        }
    }

    grid.innerHTML = ''; 

    // Filter items
    const filtered = filterCategory === 'All' 
        ? allWardrobeItems 
        : allWardrobeItems.filter(i => i.category === filterCategory);

    // Render items with the click handler included
    filtered.forEach((item, index) => {
        // Find the original index in the global array to ensure the modal opens correctly
        const originalIndex = allWardrobeItems.indexOf(item);
        
        const card = document.createElement('div');
        card.className = 'clothing-card';
        card.style.cursor = 'pointer';
        // Use the originalIndex to open the correct item details
        card.setAttribute('onclick', `openItemDetails(${originalIndex})`);
        
        card.innerHTML = `
            <div class="clothing-img">
                ${item.image_path
                    ? `<img src="${item.image_path}" alt="${item.name}">`
                    : `<svg viewBox="0 0 24 24" class="clothing-img-placeholder"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>`
                }
            </div>
            <div class="clothing-info">
                <h3 style="color: ${item.color}">${item.name}</h3>
                <span class="size-badge">${item.size}</span>
                <p>${item.category}</p>
            </div>
            <button onclick="event.stopPropagation(); deleteItem('${item.id}')" class="btn-danger">Remove</button>
        `;
        grid.appendChild(card);
    });
}

/**
 * Wires up the "Add Item" photo picker: clicking the custom button opens
 * the hidden file input, and selecting a file updates both the filename
 * label and the thumbnail preview. Also resets both when the form clears.
 */
function initItemPhotoUpload() {
    const photoInput = document.getElementById('new-item-photo');
    const preview = document.getElementById('new-item-photo-preview');
    const filenameLabel = document.getElementById('new-item-photo-filename');
    if (!photoInput || !preview || !filenameLabel) return;

    const defaultPreviewHTML = preview.innerHTML;

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
            preview.innerHTML = `<img src="${e.target.result}" alt="Item photo preview">`;
        };
        reader.readAsDataURL(file);
    });

    // Reset the photo field whenever the Add Item form is reset (e.g. modal closed/reopened)
    const addForm = document.getElementById('add-item-form');
    if (addForm) {
        addForm.addEventListener('reset', function () {
            filenameLabel.textContent = 'No file chosen';
            preview.innerHTML = defaultPreviewHTML;
        });
    }
}

/**
 * Reads a File as a base64 data URL (used for the item photo preview/upload).
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

window.saveNewItem = async function() {
    const nameInput = document.getElementById('new-item-name');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
        alert('Please enter an item name.');
        return;
    }

    const photoInput = document.getElementById('new-item-photo');
    const photoFile = photoInput && photoInput.files && photoInput.files[0];

    let imagePath = null; // null = no photo chosen, card/modal will fall back to an icon
    if (photoFile) {
        imagePath = await readFileAsDataURL(photoFile);
    }

    const itemData = {
        name: name,
        category: document.getElementById('new-item-category').value,
        size: document.getElementById('new-item-size').value.trim(),
        color: document.getElementById('new-item-color').value.trim(),
        description: document.getElementById('new-item-description').value.trim(),
        image_path: imagePath
    };

    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/wardrobe', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(itemData)
        });

        if (response.ok) {
            alert("Item Added!");
            location.reload();
        } else {
            const err = await response.json().catch(() => ({}));
            alert(`Failed to add item: ${err.error || response.statusText}`);
        }
    } catch (err) {
        console.error("Error adding item:", err);
        alert("Failed to add item. Please check your connection and try again.");
    }
};

window.deleteItem = async function(itemId) {
    if (!confirm("Are you sure you want to remove this item?")) return;

    try {
        const response = await fetch(`/api/wardrobe/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            alert("Item removed!");
            location.reload(); // Refresh to see the update
        } else {
            alert("Failed to delete item.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
};

// 1. Function to open the details
window.openItemDetails = function(index) {
    const item = allWardrobeItems[index]; // Uses the global list from earlier
    
    // Fill the modal content
    document.getElementById('modal-name').textContent = item.name;
    document.getElementById('modal-category').textContent = item.category;
    document.getElementById('modal-size').textContent = item.size;
    document.getElementById('modal-color').textContent = item.color;
    document.getElementById('modal-description').textContent = item.description;

    // Show the photo if one was uploaded, otherwise the placeholder icon
    const modalImage = document.getElementById('modal-image');
    const modalImagePlaceholder = document.getElementById('modal-image-placeholder');
    if (item.image_path) {
        modalImage.src = item.image_path;
        modalImage.alt = item.name;
        modalImage.style.display = 'block';
        modalImagePlaceholder.style.display = 'none';
    } else {
        modalImage.style.display = 'none';
        modalImagePlaceholder.style.display = 'block';
    }

    // Show the modal
    document.getElementById('detail-modal').classList.add('active');
};

// 2. Function to close the modal
document.getElementById('close-detail-modal').addEventListener('click', () => {
    document.getElementById('detail-modal').classList.remove('active');
});

/**Automatically highlights the sidebar link for the current page**/
function highlightActiveLink() {
    // Get the current path (e.g., "/dashboard" or "/wardrobe")
    const currentPath = window.location.pathname; 
    const navLinks = document.querySelectorAll('.sidebar .nav-item');

    navLinks.forEach(link => {
        // We compare the 'href' attribute of the link to our current path
        // We use .includes to handle cases like 'dashboard.html' vs '/dashboard'
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function setupDashboardSearch() {

    const input = document.getElementById("dashboard-search");

    if (!input) return;

    input.addEventListener("input", function () {

        const keyword = this.value.toLowerCase().trim();

        const cards = document.querySelectorAll("#recent-additions-grid .clothing-card");

        cards.forEach(card => {

            const text = card.textContent.toLowerCase();

            card.style.display =
                text.includes(keyword)
                    ? ""
                    : "none";

        });

    });

}