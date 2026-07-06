// Change this if your Flask API runs on a different host/port
const API_BASE_URL = "http://localhost:5000/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const submitBtn = registerForm.querySelector(".submit-btn");

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = registerForm.querySelectorAll('input')[0].value.trim();
        const email = registerForm.querySelectorAll('input')[1].value.trim();
        const password = registerForm.querySelectorAll('input')[2].value;
        const confirmPassword = registerForm.querySelectorAll('input')[3].value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Registering...";

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Registration failed. Please try again.");
                return;
            }

            // Wipe any leftover data from a previous account on this browser
            // (token, username, avatar, theme, etc.) before storing the new
            // session, so nothing from the old account can bleed through.
            localStorage.clear();

            // Store the JWT so the user is logged in right after registering.
            // NOTE: must be the key "token" - app.js reads it back via
            // localStorage.getItem('token'). It was previously being saved
            // as "access_token", which meant the rest of the app kept using
            // whatever token was already sitting in localStorage from the
            // last logged-in user instead of this new account's token.
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);

            // Fetch default settings for the new user before redirecting.
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
                console.warn('Could not restore saved user settings after registration:', err);
            }

            alert("Registration successful!");
            window.location.href = "/dashboard"; // Redirect to dashboard or another page after successful registration
        } catch (err) {
            console.error("Registration error:", err);
            alert("Could not reach the server. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Register";
        }
    });
});