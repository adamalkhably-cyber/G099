// Change this if your Flask API runs on a different host/port
const API_BASE_URL = "http://localhost:5000/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const submitBtn = forgotPasswordForm.querySelector(".submit-btn");

    forgotPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = forgotPasswordForm.querySelector('input[type="email"]').value.trim();

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Something went wrong. Please try again.");
                return;
            }

            alert(data.message || "If that email exists, a reset link has been sent.");
            forgotPasswordForm.reset();
        } catch (err) {
            console.error("Forgot password error:", err);
            alert("Could not reach the server. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Reset Link";
        }
    });
});