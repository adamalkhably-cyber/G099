document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const submitBtn = form.querySelector(".submit-btn");
  const emailLabel = document.getElementById("resetEmailLabel");
  const resendBtn = document.getElementById("resendCodeBtn");

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  if (!email) {
    alert("Missing email. Please request a new password reset code.");
    window.location.href = "/forgot-password";
    return;
  }

  if (emailLabel) emailLabel.textContent = `Enter the 6-digit code we sent to ${email}.`;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = document.getElementById("resetCode").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!/^\d{6}$/.test(code)) {
      alert("Enter the 6-digit code from your email.");
      return;
    }

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
          email: email,
          code: code,
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

  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await response.json().catch(() => ({}));
        alert(data.message || "If that email exists, a new code has been sent.");
      } catch (err) {
        console.error("Resend code error:", err);
        alert("Could not reach the server.");
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend code";
      }
    });
  }
});