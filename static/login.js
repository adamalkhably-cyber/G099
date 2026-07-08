// Change this if your Flask API runs on a different host/port
const API_BASE_URL = "/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const submitBtn = loginForm.querySelector(".submit-btn");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = loginForm.querySelector('input[type="email"]').value.trim();
        const password = loginForm.querySelector('input[type="password"]').value;

        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";

        try {
            const response = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Login failed. Please check your credentials.");
                return;
            }

            // Wipe any leftover data from a previous account on this browser
            // (token, username, avatar, theme, etc.) before storing the new
            // session, so nothing from the old account can bleed through.
            localStorage.clear();

            // Store the JWT so other pages/requests can use it.
            // NOTE: app.js reads this back via localStorage.getItem('token'),
            // so the key here must match exactly.
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);

            // Fetch per-user settings immediately after login so theme/avatar
            // are available before redirecting.
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

            // Redirect to wherever your logged-in landing page is
            if (data.user.is_admin) {
                window.location.href = "/admin"; // Change this to your desired landing page for admin user
            } else {
                window.location.href = "/dashboard";  // Change this to your desired landing page for regular user
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Could not reach the server. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    });
});