document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme and Settings
    applyGlobalSettings();
    if (document.getElementById('username')) initSettingsPage();
    initGeneralFeatures();
    
    // 2. Load Outfits for the Planner
    if (document.getElementById('planner-grid')) {
        renderSavedOutfits();
    }
});

function renderSavedOutfits() {
    const plannerGrid = document.getElementById('planner-grid');
    if (!plannerGrid) return;

    const savedOutfits = JSON.parse(localStorage.getItem('myOutfits') || '[]');
    plannerGrid.innerHTML = '';

    savedOutfits.forEach((outfit, index) => {
        const outfitElement = document.createElement('div');
        outfitElement.className = 'outfit-card';
        outfitElement.innerHTML = `
            <div class="outfit-banner"></div>
            <h3>${outfit.name}</h3>
            <div class="outfit-items">${outfit.items.join(', ')}</div>
            <button onclick="removeOutfit(${index})">Remove</button>
        `;
        plannerGrid.appendChild(outfitElement);
    });
}

window.createOutfit = function() {
    const outfitNameInput = document.getElementById('outfit-name-input');
    const outfitName = outfitNameInput.value.trim();
    
    if (!outfitName) {
        alert("Please enter an outfit name!");
        return;
    }

    // 1. Find all checkboxes that are checked
    const checkedItems = document.querySelectorAll('.item-select:checked');
    if (checkedItems.length === 0) {
        alert("Please select at least one item for your outfit!");
        return;
    }

    // 2. Extract the values from those checkboxes
    const items = Array.from(checkedItems).map(item => item.value);

    // 3. Save to localStorage
    const savedOutfits = JSON.parse(localStorage.getItem('myOutfits') || '[]');
    savedOutfits.push({ name: outfitName, items: items });
    localStorage.setItem('myOutfits', JSON.stringify(savedOutfits));

    // 4. Success feedback
    alert(`Outfit "${outfitName}" saved successfully!`);
    
    // Clear input and uncheck boxes
    outfitNameInput.value = '';
    checkedItems.forEach(item => item.checked = false);
};

window.removeOutfit = function(index) {
    const savedOutfits = JSON.parse(localStorage.getItem('myOutfits') || '[]');
    savedOutfits.splice(index, 1);
    localStorage.setItem('myOutfits', JSON.stringify(savedOutfits));
    renderSavedOutfits();
};

function applyGlobalSettings() {
    const savedName = localStorage.getItem('username') || 'Haziq';
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
 * Set up settings configuration forms, load stored records, and capture actions.
 */
function initSettingsPage() {
    const usernameInput = document.getElementById('username');
    const profileUpload = document.getElementById('profile-upload');
    const fileChosenLabel = document.getElementById('file-chosen');
    const themeSelect = document.getElementById('theme');
    const emailNotif = document.getElementById('emailNotif');
    const pushNotif = document.getElementById('pushNotif');
    
    // Target the specific User Preferences container form element
    const userPrefForm = usernameInput ? usernameInput.closest('form') : null;

    // Pre-populate input entries with previously recorded localStorage parameters
    if (usernameInput) usernameInput.value = localStorage.getItem('username') || 'Haziq';
    if (themeSelect) themeSelect.value = localStorage.getItem('theme') || 'default';
    if (emailNotif) emailNotif.checked = localStorage.getItem('emailNotif') === 'true';
    if (pushNotif) pushNotif.checked = localStorage.getItem('pushNotif') === 'true';

    // Staging variable to host base64 binary image upload stream
    let loadedAvatarBase64 = localStorage.getItem('profileAvatar') || '';

    // Monitor custom file upload selector field changes
    if (profileUpload) {
        profileUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (fileChosenLabel) fileChosenLabel.textContent = file.name;
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    loadedAvatarBase64 = event.target.result; // Saves uploaded graphic as data string format
                };
                reader.readAsDataURL(file);
            } else {
                if (fileChosenLabel) fileChosenLabel.textContent = 'No file chosen';
            }
        });
    }

    // Intercept User Settings Submission Event 
    if (userPrefForm) {
        userPrefForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (usernameInput) localStorage.setItem('username', usernameInput.value.trim() || 'Haziq');
            if (themeSelect) localStorage.setItem('theme', themeSelect.value);
            if (emailNotif) localStorage.setItem('emailNotif', emailNotif.checked);
            if (pushNotif) localStorage.setItem('pushNotif', pushNotif.checked);
            if (loadedAvatarBase64) localStorage.setItem('profileAvatar', loadedAvatarBase64);

            // Re-render layout parameters immediately without refreshing browser
            applyGlobalSettings();
            alert('User preferences saved successfully!');
        });
    }

    // Monitor and maintain Account Privacy & Security inputs
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = localStorage.getItem('email') || '';

    const privacyForm = emailInput ? emailInput.closest('form') : null;
    if (privacyForm) {
        privacyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const passwordInput = document.getElementById('password');
            
            if (passwordInput && passwordInput.value) {
                localStorage.setItem('password', passwordInput.value);
                passwordInput.value = ''; // Clean up clear-text entries for security
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
    const closeModalBtn = document.getElementById('close-modal');

    if (filterBtn && filterModal) filterBtn.addEventListener('click', () => filterModal.classList.add('active'));
    if (notifBtn && notifModal) notifBtn.addEventListener('click', () => notifModal.classList.add('active'));
    if (addBtn && addModal) addBtn.addEventListener('click', () => addModal.classList.add('active'));
    if (closeModalBtn && addModal) closeModalBtn.addEventListener('click', () => addModal.classList.remove('active'));

    // Automatically collapse and slide active windows down if user clicks target container overlay regions
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
        }
    });
}