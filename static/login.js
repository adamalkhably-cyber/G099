// Change this if your Flask API runs on a different host/port
const API_BASE_URL = "/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const submitBtn = loginForm.querySelector("button[type='submit']");
    const alertContainer = document.getElementById("alert-container");

    // Helper to show/hide custom alerts
    function showAlert(message, type = "error") {
        if (!alertContainer) return;
        alertContainer.classList.remove("hidden");
        const isError = type === "error";
        alertContainer.innerHTML = `
            <div class="flex items-start gap-2.5 p-3 rounded-md border text-sm animate-in fade-in duration-200 ${
                isError 
                    ? 'bg-red-50 text-red-800 border-red-200' 
                    : 'bg-teal-50 text-teal-800 border-teal-200'
            }">
                <svg class="h-5 w-5 shrink-0 ${isError ? 'text-red-500' : 'text-teal-600'} mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    ${isError
                        ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>'
                        : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>'
                    }
                </svg>
                <div class="font-medium flex-1">${message}</div>
            </div>
        `;
    }

    function hideAlert() {
        if (alertContainer) {
            alertContainer.classList.add("hidden");
            alertContainer.innerHTML = "";
        }
    }

    // Password show/hide toggle logic
    const togglePasswordBtn = document.getElementById("toggle-password");
    if (togglePasswordBtn) {
        const passwordInput = document.getElementById("login-password");
        const eyeIcon = document.getElementById("eye-icon");
        const eyeOffIcon = document.getElementById("eye-off-icon");
        
        togglePasswordBtn.addEventListener("click", () => {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                eyeIcon.classList.add("hidden");
                eyeOffIcon.classList.remove("hidden");
            } else {
                passwordInput.type = "password";
                eyeIcon.classList.remove("hidden");
                eyeOffIcon.classList.add("hidden");
            }
        });
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideAlert();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        submitBtn.disabled = true;
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Logging in...</span>
        `;

        try {
            const response = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showAlert(data.error || "Login failed. Please check your credentials.");
                return;
            }

            // Wipe any leftover data from a previous account on this browser
            localStorage.clear();

            // Store the JWT so other pages/requests can use it.
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);

            // Fetch per-user settings immediately after login
            try {
                const settingsResponse = await fetch('/api/settings', {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                const settingsData = await settingsResponse.json();
                if (settingsResponse.ok && settingsData.ok) {
                    const settings = settingsData.settings || {};
                    if (settings.theme) {
                        localStorage.setItem('theme', settings.theme);
                    }
                    if (settings.avatar) {
                        localStorage.setItem('profileAvatar', settings.avatar);
                    }
                    if (settings.notifications) {
                        localStorage.setItem('emailNotif', settings.notifications.email);
                        localStorage.setItem('pushNotif', settings.notifications.push);
                    }
                    if (settings.username) {
                        localStorage.setItem('username', settings.username);
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        currentUser.username = settings.username;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                }
            } catch (err) {
                console.warn('Could not restore saved user settings after login:', err);
            }

            // Redirect
            if (data.user.is_admin) {
                window.location.href = "/admin";
            } else {
                window.location.href = "/dashboard";
            }
        } catch (err) {
            console.error("Login error:", err);
            showAlert("Could not reach the server. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
        }
    });
});
