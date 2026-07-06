// Relative path so this keeps working regardless of host/port -
// hardcoding http://localhost:5000 broke as soon as this was served
// from anywhere else.
const API_BASE_URL = "/api/auth";

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

            alert(data.message || "If that email exists, a verification code has been sent.");
            // Take the user straight to the code + new-password step
            // instead of leaving them here with nothing to click.
            window.location.href = `/reset-password?email=${encodeURIComponent(email)}`;
        } catch (err) {
            console.error("Forgot password error:", err);
            alert("Could not reach the server. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Reset Link";
        }
    });
});