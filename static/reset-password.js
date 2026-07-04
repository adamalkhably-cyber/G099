document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const submitBtn = form.querySelector(".submit-btn");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    alert("Missing reset token. Please request a new password reset link.");
    window.location.href = "/forgot-password";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Changing...";

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not reset password.");
        return;
      }

      alert("Password changed successfully. Please log in.");
      window.location.href = "/";
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Could not reach the server.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Change Password";
    }
  });
});