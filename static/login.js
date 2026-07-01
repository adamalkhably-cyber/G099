// Change this if your Flask API runs on a different host/port
const API_BASE_URL = "http://localhost:5000/api/auth";

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
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Login failed. Please check your credentials.");
                return;
            }

            // Store the JWT so other pages/requests can use it
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect to wherever your logged-in landing page is
          if (data.user.is_admin) {
    window.location.href = "admin-dashboard.html";
} else {
    window.location.href = "dashboard.html";
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