// ==========================================
// INITIALIZATION (Runs on every page load)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Load per-user settings from the backend when authenticated.
    if (typeof loadSavedUserSettings === 'function') await loadSavedUserSettings();

    // Core features
    if (typeof applyGlobalSettings === 'function') applyGlobalSettings();
    if (document.getElementById('username') && typeof initSettingsPage === 'function') initSettingsPage();
    if (typeof initGeneralFeatures === 'function') initGeneralFeatures();
    if (typeof highlightActiveLink === 'function') highlightActiveLink();

    // Page: Dashboard (recent-additions-grid)
    if (document.getElementById("recent-additions-grid")) {
    renderDashboard();
   }
    if (document.getElementById('dashboard-search-input')) {
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
});

// ==========================================
// DASHBOARD SEARCH BAR
// ==========================================
let dashboardWardrobeCache = [];
let dashboardOutfitsCache = [];

function setupDashboardSearch() {
    const input = document.getElementById('dashboard-search-input');
    const bar = input && input.closest('.search-bar');
    if (!input || !bar) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'dashboard-search-dropdown';
    bar.appendChild(dropdown);

    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim().toLowerCase();
        if (!query) {
            dropdown.classList.remove('show');
            dropdown.innerHTML = '';
            return;
        }
        debounceTimer = setTimeout(() => runDashboardSearch(query, dropdown), 200);
    });

    input.addEventListener('focus', () => {
        if (dropdown.innerHTML && input.value.trim()) dropdown.classList.add('show');
    });

    document.addEventListener('click', (e) => {
        if (!bar.contains(e.target)) dropdown.classList.remove('show');
    });
}

async function runDashboardSearch(query, dropdown) {
    let items = dashboardWardrobeCache;

    // Fall back to a fresh fetch if the dashboard hasn't loaded yet
    if (!items || items.length === 0) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/wardrobe', { headers: { Authorization: `Bearer ${token}` } });
            const data = res.ok ? await res.json() : [];
            items = Array.isArray(data) ? data : [];
            dashboardWardrobeCache = items;
        } catch (err) {
            items = [];
        }
    }

    const matches = items.filter(item =>
        (item.name || '').toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query) ||
        (item.color || '').toLowerCase().includes(query)
    ).slice(0, 6);

    dropdown.classList.add('show');

    if (matches.length === 0) {
        dropdown.innerHTML = `<div class="dashboard-search-empty">No items match "${query}"</div>`;
        return;
    }

    dropdown.innerHTML = matches.map(item => `
        <div class="dashboard-search-row" data-id="${item.id}">
            <div class="dashboard-search-thumb">
                ${item.image_path ? `<img src="${item.image_path}" alt="${item.name}">` : '🏷️'}
            </div>
            <div>
                <div class="dashboard-search-title">${item.name}</div>
                <div class="dashboard-search-sub">${item.category}${item.color ? ' • ' + item.color : ''}</div>
            </div>
        </div>
    `).join('');

    dropdown.querySelectorAll('.dashboard-search-row').forEach(row => {
        row.addEventListener('click', () => {
            window.location.href = '/wardrobe';
        });
    });
}

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

        const wardrobe = wardrobeResponse.ok ? await wardrobeResponse.json() : [];
        const outfits = outfitResponse.ok ? await outfitResponse.json() : [];

        // Cache for the topbar search bar so it doesn't need its own fetch
        if (Array.isArray(wardrobe)) dashboardWardrobeCache = wardrobe;

        // Cache for the notification panel
        if (Array.isArray(outfits)) dashboardOutfitsCache = outfits;

        // ----------------------------------------------------
        // A. Update Top Stats (With safety checks)
        // ----------------------------------------------------
        const totalItemsEl = document.getElementById("total-items");
        if (totalItemsEl) totalItemsEl.textContent = wardrobe.length || 0;

        const savedOutfitsEl = document.getElementById("saved-outfits");
        if (savedOutfitsEl) savedOutfitsEl.textContent = outfits.length || 0;
        
        const outfitsWornEl = document.getElementById("outfits-worn");
        const outfitsWornSub = document.getElementById("outfits-worn-sub");
        if (outfitsWornEl) {
            // Total times any outfit has actually been marked worn (real
            // wear_count from the backend), not an arbitrary multiplier.
            const totalWearEvents = outfits.reduce((sum, o) => sum + (o.wear_count || 0), 0);
            outfitsWornEl.textContent = totalWearEvents;

            if (outfitsWornSub) {
                const now = Date.now();
                const weekMs = 7 * 24 * 60 * 60 * 1000;
                const wornThisWeek = outfits.filter(o => o.last_worn && (now - new Date(o.last_worn).getTime()) < weekMs).length;
                const wornPriorWeek = outfits.filter(o => o.last_worn && (now - new Date(o.last_worn).getTime()) >= weekMs && (now - new Date(o.last_worn).getTime()) < weekMs * 2).length;
                const delta = wornThisWeek - wornPriorWeek;

                if (totalWearEvents === 0) {
                    outfitsWornSub.textContent = 'No wear history yet';
                } else if (delta > 0) {
                    outfitsWornSub.innerHTML = `<span class="up">↑ ${delta}</span> vs last week`;
                } else if (delta < 0) {
                    outfitsWornSub.innerHTML = `<span class="down">↓ ${Math.abs(delta)}</span> vs last week`;
                } else {
                    outfitsWornSub.textContent = 'Same as last week';
                }
            }
        }

        const utilizationEl = document.getElementById("utilization-rate");
        const utilizationSub = document.getElementById("utilization-sub");
        if (utilizationEl) {
            // Real utilization: % of wardrobe items that appear in at least
            // one saved outfit - not a random number on every page load.
            if (wardrobe.length === 0) {
                utilizationEl.textContent = '0%';
                if (utilizationSub) utilizationSub.textContent = 'Add items to see usage';
            } else {
                const usedItemIds = new Set();
                outfits.forEach(o => (o.items || []).forEach(item => usedItemIds.add(item.id)));
                const utilization = Math.round((usedItemIds.size / wardrobe.length) * 100);
                utilizationEl.textContent = `${utilization}%`;
                if (utilizationSub) utilizationSub.textContent = `${usedItemIds.size} of ${wardrobe.length} items used in outfits`;
            }
        }

        // B. Update Recent Additions (Last 6 items)
        renderRecentAdditionsGrid(wardrobe);

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

        // E. Update Recently Added History Table
        renderRecentHistoryTable(wardrobe);

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

function renderRecentAdditionsGrid(itemsToRender) {
    itemsToRender = itemsToRender || [];
    const recentGrid = document.getElementById("recent-additions-grid");
    if (!recentGrid) return;
    
    recentGrid.innerHTML = '';
    const recentItems = [...itemsToRender].reverse().slice(0, 6);
    
    if (recentItems.length === 0) {
        recentGrid.innerHTML = '<p style="padding: 1rem; color: var(--text-muted);">No items found.</p>';
        return;
    } 
    
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

function renderRecentHistoryTable(itemsToRender) {
    itemsToRender = itemsToRender || [];
    const recentlyWornTbody = document.getElementById("recently-worn-tbody");
    if (!recentlyWornTbody) return;
    
    recentlyWornTbody.innerHTML = '';
    const historyItems = [...itemsToRender].sort((a, b) => b.id - a.id).slice(0, 5); 
    
    if (historyItems.length === 0) {
        recentlyWornTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">No items found.</td></tr>';
        return;
    } 
    
    historyItems.forEach((item) => {
        let rawDate = item.created_at || item.date_added || new Date();
        let formattedDate = new Date(rawDate).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
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

function applyDashboardFilters() {
    const categorySelect = document.getElementById('filter-category-select');
    if (!categorySelect) return;

    // Safely pull data from your existing dashboard cache
    const wardrobeData = dashboardWardrobeCache || [];
    const selectedCategory = categorySelect.value;
    
    let filteredItems = wardrobeData;
    if (selectedCategory !== 'All') {
        filteredItems = wardrobeData.filter(
            item => (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
        );
    }

    renderRecentAdditionsGrid(filteredItems);
    renderRecentHistoryTable(filteredItems);

    document.getElementById('filter-modal').classList.remove('active');
}

// Lightweight "x minutes/hours/days ago" formatter for the notification panel
function notifTimeAgo(isoString) {
    if (!isoString) return '';
    const then = new Date(isoString).getTime();
    if (isNaN(then)) return '';
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

async function generateNotifications() {
    const notifContainer = document.getElementById('notif-container');
    if (!notifContainer) return;

    notifContainer.innerHTML = '<div class="notif-item"><span>Loading…</span></div>';

    const token = localStorage.getItem('token');
    let wardrobeData = dashboardWardrobeCache;
    let outfitsData = dashboardOutfitsCache;

    // The caches are only populated on the dashboard page - fetch fresh
    // if this is being opened from anywhere else (wardrobe, outfits, etc.)
    if ((!wardrobeData || wardrobeData.length === 0) || (!outfitsData || outfitsData.length === 0)) {
        try {
            const [wardrobeResponse, outfitResponse] = await Promise.all([
                fetch("/api/wardrobe", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/outfits", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const freshWardrobe = wardrobeResponse.ok ? await wardrobeResponse.json() : [];
            const freshOutfits = outfitResponse.ok ? await outfitResponse.json() : [];
            wardrobeData = Array.isArray(freshWardrobe) ? freshWardrobe : (wardrobeData || []);
            outfitsData = Array.isArray(freshOutfits) ? freshOutfits : (outfitsData || []);
        } catch (err) {
            console.error("Error loading notification data:", err);
            wardrobeData = wardrobeData || [];
            outfitsData = outfitsData || [];
        }
    }

    const events = [];

    wardrobeData.forEach(item => {
        if (item.created_at) {
            events.push({
                timestamp: item.created_at,
                html: `<span>You added <b>${item.name}</b> to your wardrobe</span><small>${notifTimeAgo(item.created_at)}</small>`
            });
        }
    });

    outfitsData.forEach(outfit => {
        if (outfit.created_at) {
            events.push({
                timestamp: outfit.created_at,
                html: `<span>You created outfit <b>${outfit.name}</b></span><small>${notifTimeAgo(outfit.created_at)}</small>`
            });
        }
    });

    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentEvents = events.slice(0, 8);

    notifContainer.innerHTML = recentEvents.length === 0
        ? '<div class="notif-item"><span>Welcome to your digital closet! Start adding items.</span><small>System</small></div>'
        : recentEvents.map(e => `<div class="notif-item">${e.html}</div>`).join('');
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

        if (!response.ok || !Array.isArray(outfits)) {
            plannerGrid.innerHTML = `<p style="padding: 20px; color: var(--bad, #c04a3a);">Couldn't load outfits: ${(outfits && outfits.error) || response.statusText || 'unknown error'}.</p>`;
            return;
        }

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
                    <div style="font-size:0.75rem; color:var(--text-muted); margin: 6px 0;">
                        ${outfit.wear_count > 0 ? `Worn ${outfit.wear_count}× · last ${new Date(outfit.last_worn).toLocaleDateString(undefined, {month:'short', day:'numeric'})}` : 'Not worn yet'}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="aesthetic-remove-btn" style="background: var(--interior); color: var(--exterior-dark, #033f3f); border-color: transparent;" onclick="markOutfitWorn(${outfit.id})">Mark as Worn</button>
                        <button class="aesthetic-remove-btn" onclick="removeOutfit(${outfit.id})">Delete</button>
                    </div>
                </div>
            `;
            plannerGrid.appendChild(outfitElement);
        });
    } catch (err) {
        console.error("Error loading outfits:", err);
        plannerGrid.innerHTML = `<p style="padding: 20px; color: var(--bad, #c04a3a);">Couldn't load outfits. Check your connection and try again.</p>`;
    }
}

window.markOutfitWorn = async function(outfitId) {
    try {
        const response = await fetch(`/api/outfits/${outfitId}/wear`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            renderSavedOutfits();
        } else {
            console.error('Failed to mark outfit as worn:', await response.text());
        }
    } catch (err) {
        console.error('Error marking outfit as worn:', err);
    }
};

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

        if (!response.ok || !Array.isArray(outfits)) {
            favoritesGrid.innerHTML = `<p style="padding: 20px; color: var(--bad, #c04a3a);">Couldn't load favorites: ${(outfits && outfits.error) || response.statusText || 'unknown error'}.</p>`;
            return;
        }

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
        favoritesGrid.innerHTML = `<p style="padding: 20px; color: var(--bad, #c04a3a);">Couldn't load favorites. Check your connection and try again.</p>`;
    }
}

async function loadSavedUserSettings() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok || !data.ok) return;

        const settings = data.settings || {};
        if (settings.theme) {
            localStorage.setItem('theme', settings.theme);
        }
        if (settings.avatar) {
            localStorage.setItem('profileAvatar', settings.avatar);
        }
        if (settings.username) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.username = settings.username;
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('username', settings.username);
        }
        if (settings.notifications) {
            localStorage.setItem('emailNotif', settings.notifications.email);
            localStorage.setItem('pushNotif', settings.notifications.push);
        }
    } catch (err) {
        console.error('Failed to load saved user settings:', err);
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
    const savedTheme = localStorage.getItem('theme') || 'light';

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
 * localStorage (token, username, avatar, theme, email). Because
 * localStorage is shared by every account that ever logs in on the same
 * browser, simply clearing the 'token' is not enough - any leftover
 * cached fields (username, avatar, etc.) will keep leaking into
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
    const emailInput = document.getElementById('email');
    
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

    if (themeSelect) {
        const localTheme = localStorage.getItem('theme');
        if (localTheme) {
            themeSelect.value = localTheme;
        } else {
            const serverTheme = apiSettings.theme || 'light';
            themeSelect.value = serverTheme;
            localStorage.setItem('theme', serverTheme);
            applyGlobalSettings();
        }
    }

    if (!localStorage.getItem('profileAvatar') && apiSettings.avatar) {
        localStorage.setItem('profileAvatar', apiSettings.avatar);
        applyGlobalSettings();
    }

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
                theme: themeSelect ? themeSelect.value : 'light',
                avatar: loadedAvatarBase64 || undefined,
                notifications: {
                    email: emailNotif ? emailNotif.checked : false,
                    push: pushNotif ? pushNotif.checked : false
                }
            };

            // Send to Flask Blueprint Backend
            let saveSucceeded = false;
            try {
                const response = await fetch('/api/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(payload)
                });
                saveSucceeded = response.ok;
                if (!response.ok) {
                    console.error("Server rejected settings save:", response.status, await response.text());
                }
            } catch (error) {
                console.error("Failed to save settings to backend:", error);
            }

            if (!saveSucceeded) {
                alert("Couldn't save your settings to the server. Please check your connection and try again.");
                return;
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
    const privacyForm = emailInput ? emailInput.closest('form') : null;
    if (privacyForm) {
        privacyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const currentPasswordInput = document.getElementById('current-password');
            const passwordInput = document.getElementById('password');
            const submitBtn = privacyForm.querySelector('button[type="submit"]');

            // Only attempt a password change if they actually typed a new one
            if (passwordInput && passwordInput.value) {
                if (!currentPasswordInput || !currentPasswordInput.value) {
                    alert('Enter your current password to set a new one.');
                    return;
                }

                if (submitBtn) submitBtn.disabled = true;
                try {
                    const response = await fetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            current_password: currentPasswordInput.value,
                            new_password: passwordInput.value
                        })
                    });
                    const result = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        alert(result.error || 'Could not change your password. Please try again.');
                        if (submitBtn) submitBtn.disabled = false;
                        return;
                    }

                    // Never keep the password around client-side, not even
                    // briefly - clear both fields immediately on success
                    currentPasswordInput.value = '';
                    passwordInput.value = '';
                } catch (err) {
                    console.error('Error changing password:', err);
                    alert('Network error changing your password. Please try again.');
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                }
                if (submitBtn) submitBtn.disabled = false;
            }

            if (emailInput) {
                localStorage.setItem('email', emailInput.value.trim());
            }
            alert('Account security data updated successfully!');
        });
    }
}

function initGeneralFeatures() {
    const filterBtn = document.getElementById('open-filter-modal');
    const notifBtn = document.getElementById('open-notif-modal');
    const addBtn = document.getElementById('open-add-modal');
    const applyFilterBtn = document.getElementById('apply-filters-btn');

    const filterModal = document.getElementById('filter-modal');
    const notifModal = document.getElementById('notif-modal');
    const addModal = document.getElementById('add-item-modal');
    const closeModalBtn = document.getElementById('close-add-modal');

    // Filter Modal Triggers
    if (filterBtn && filterModal) filterBtn.addEventListener('click', () => filterModal.classList.add('active'));
    if (applyFilterBtn) applyFilterBtn.addEventListener('click', applyDashboardFilters);

    // Notification Modal Triggers
    if (notifBtn && notifModal) {
        notifBtn.addEventListener('click', () => {
            notifModal.classList.add('active'); // Opens the window immediately
            generateNotifications(); // Fills it in (shows a brief loading state first)
        });
    }

    // Add Item Modal Triggers
    if (addBtn && addModal) addBtn.addEventListener('click', () => addModal.classList.add('active'));
    if (closeModalBtn && addModal) closeModalBtn.addEventListener('click', () => addModal.classList.remove('active'));

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

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
let currentWeekStart = null;
let plannedOutfitsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    // Only run this if we are on the page with the calendar
    if (document.getElementById('calendar-grid')) {
        currentWeekStart = getStartOfWeek(new Date());
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

    // "+ Log Outfit" button in the topbar - defaults to today's date
    const openAddModalBtn = document.getElementById('open-add-modal');
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => openLogOutfitModal());
    }

    const logModal = document.getElementById('log-outfit-modal');
    const closeLogModalBtn = document.getElementById('close-log-outfit-modal');
    if (closeLogModalBtn && logModal) {
        closeLogModalBtn.addEventListener('click', () => logModal.classList.remove('active'));
    }
    if (logModal) {
        window.addEventListener('click', (e) => {
            if (e.target === logModal) logModal.classList.remove('active');
        });
    }

    const saveLogBtn = document.getElementById('save-log-outfit-btn');
    if (saveLogBtn) {
        saveLogBtn.addEventListener('click', saveLoggedOutfit);
    }
});

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
}

// Format a Date as YYYY-MM-DD using local time (not UTC) so it lines up
// with the day actually shown on screen, avoiding an off-by-one from
// toISOString() shifting across midnight in the user's timezone.
function formatDateYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchPlannedOutfits() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/calendar', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        plannedOutfitsCache = Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Error fetching planned outfits:', err);
        plannedOutfitsCache = [];
    }
}

async function renderCalendar(startOfWeek) {
    const grid = document.getElementById('calendar-grid');
    const rangeLabel = document.getElementById('current-week-range');
    if (!grid) return;

    grid.innerHTML = '<p style="padding: 1rem; color: var(--text-muted);">Loading your week...</p>';
    await fetchPlannedOutfits();
    grid.innerHTML = '';

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    let firstDayStr = "";
    let lastDayStr = "";

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const dateStr = formatDateYMD(currentDay);

        const monthOpt = { month: 'short', day: 'numeric' };
        if (i === 0) firstDayStr = currentDay.toLocaleDateString('en-US', monthOpt);
        if (i === 6) lastDayStr = currentDay.toLocaleDateString('en-US', monthOpt);

        const isToday = currentDay.toDateString() === today.toDateString() ? 'today' : '';
        const dayCard = document.createElement('div');
        dayCard.className = `calendar-day-card ${isToday}`;

        // Real planned outfit for this date, if one exists
        const planned = plannedOutfitsCache.find(p => p.date === dateStr);
        const outfit = planned && planned.outfit;

        let slotHTML;
        if (outfit) {
            const thumb = outfit.items && outfit.items[0] && outfit.items[0].image_path;
            slotHTML = `
                <div class="outfit-slot assigned" style="position: relative; ${thumb ? `background-image: url('${thumb}');` : 'background: var(--interior-pale); display:flex; align-items:center; justify-content:center;'}" title="${outfit.name}">
                    ${thumb ? '' : `<span style="font-size:0.7rem; color:var(--text-main); padding:4px; text-align:center;">${outfit.name}</span>`}
                    <button onclick="event.stopPropagation(); removePlannedOutfit('${dateStr}')" title="Remove" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.55); border:none; color:#fff; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:0.7rem; line-height:1;">&times;</button>
                </div>
            `;
        } else {
            slotHTML = `<div class="outfit-slot" onclick="openLogOutfitModal('${dateStr}')"><span>+ Plan</span></div>`;
        }

        dayCard.innerHTML = `
            <span class="day-name">${daysOfWeek[i]}</span>
            <span class="day-number">${currentDay.getDate()}</span>
            ${slotHTML}
        `;
        grid.appendChild(dayCard);
    }
    if (rangeLabel) rangeLabel.textContent = `${firstDayStr} - ${lastDayStr}`;
}

// Opens the Log Outfit modal, optionally pre-filled with a specific date
// (used when clicking "+ Plan" on a day card). No date = defaults to today,
// which is how the topbar "+ Log Outfit" button uses it.
window.openLogOutfitModal = async function(presetDate) {
    const modal = document.getElementById('log-outfit-modal');
    const dateInput = document.getElementById('log-outfit-date');
    const select = document.getElementById('log-outfit-select');
    if (!modal || !dateInput || !select) return;

    dateInput.value = presetDate || formatDateYMD(new Date());

    select.innerHTML = '<option>Loading…</option>';
    modal.classList.add('active');

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/outfits', { headers: { Authorization: `Bearer ${token}` } });
        const outfits = res.ok ? await res.json() : [];
        const list = Array.isArray(outfits) ? outfits : [];

        select.innerHTML = list.length === 0
            ? '<option value="">No saved outfits yet - create one in Outfit Planner</option>'
            : list.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
    } catch (err) {
        console.error('Error loading outfits for calendar:', err);
        select.innerHTML = '<option value="">Couldn\'t load outfits</option>';
    }
};

async function saveLoggedOutfit() {
    const dateInput = document.getElementById('log-outfit-date');
    const select = document.getElementById('log-outfit-select');
    if (!dateInput.value || !select.value) {
        if (typeof showToast === 'function') showToast('Pick a date and an outfit first.');
        return;
    }

    const token = localStorage.getItem('token');
    const payload = { date: dateInput.value, outfit_id: parseInt(select.value, 10) };

    try {
        let response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        // The backend rejects a second outfit on an already-planned date
        // with a 400 - if that's why it failed, update the existing entry
        // instead of just giving up.
        if (response.status === 400) {
            const errData = await response.json().catch(() => ({}));
            if ((errData.error || '').toLowerCase().includes('already planned')) {
                response = await fetch(`/api/calendar/${dateInput.value}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ outfit_id: payload.outfit_id })
                });
            }
        }

        if (response.ok) {
            document.getElementById('log-outfit-modal').classList.remove('active');
            if (typeof showToast === 'function') showToast('Outfit logged!');
            if (currentWeekStart) renderCalendar(currentWeekStart);
        } else {
            const errData = await response.json().catch(() => ({}));
            if (typeof showToast === 'function') showToast(errData.error || 'Could not log outfit.');
        }
    } catch (err) {
        console.error('Error logging outfit:', err);
        if (typeof showToast === 'function') showToast('Network error logging outfit.');
    }
}

window.removePlannedOutfit = async function(dateStr) {
    if (!confirm('Remove the outfit planned for this day?')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/calendar/${dateStr}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok && currentWeekStart) renderCalendar(currentWeekStart);
    } catch (err) {
        console.error('Error removing planned outfit:', err);
    }
};

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

window.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("loaded");
});