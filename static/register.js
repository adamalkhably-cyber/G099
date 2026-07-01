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

            // Store the JWT so the user is logged in right after registering
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Registration successful!");
            window.location.href = "dashboard.html";
        } catch (err) {
            console.error("Registration error:", err);
            alert("Could not reach the server. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Register";
        }
    });
});