document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const submitBtn = form.querySelector("button[type='submit']");
  const emailLabel = document.getElementById("resetEmailLabel");
  const resendBtn = document.getElementById("resendCodeBtn");
  const alertContainer = document.getElementById("alert-container");

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

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

  if (!email) {
    showAlert("Missing email. Redirecting to forgot password page...");
    setTimeout(() => {
      window.location.href = "/forgot-password";
    }, 2000);
    return;
  }

  if (emailLabel) emailLabel.textContent = `Enter the 6-digit code sent to ${email}`;

  // Toggle password visibility logic
  const toggleNewPasswordBtn = document.getElementById("toggle-new-password");
  if (toggleNewPasswordBtn) {
      const passwordInput = document.getElementById("newPassword");
      const eyeIcon = document.getElementById("new-eye-icon");
      const eyeOffIcon = document.getElementById("new-eye-off-icon");
      
      toggleNewPasswordBtn.addEventListener("click", () => {
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

  const toggleConfirmPasswordBtn = document.getElementById("toggle-confirm-password");
  if (toggleConfirmPasswordBtn) {
      const confirmPasswordInput = document.getElementById("confirmPassword");
      const confirmEyeIcon = document.getElementById("confirm-eye-icon");
      const confirmEyeOffIcon = document.getElementById("confirm-eye-off-icon");
      
      toggleConfirmPasswordBtn.addEventListener("click", () => {
          if (confirmPasswordInput.type === "password") {
              confirmPasswordInput.type = "text";
              confirmEyeIcon.classList.add("hidden");
              confirmEyeOffIcon.classList.remove("hidden");
          } else {
              confirmPasswordInput.type = "password";
              confirmEyeIcon.classList.remove("hidden");
              confirmEyeOffIcon.classList.add("hidden");
          }
      });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAlert();

    const code = document.getElementById("resetCode").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!/^\d{6}$/.test(code)) {
      showAlert("Enter the 6-digit code from your email.");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Passwords do not match.");
      return;
    }

    submitBtn.disabled = true;
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Changing...</span>
    `;

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
        showAlert(data.error || "Could not reset password.");
        return;
      }

      showAlert("Password changed successfully. Redirecting to login...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      console.error("Reset password error:", error);
      showAlert("Could not reach the server.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  });

  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      resendBtn.disabled = true;
      const originalText = resendBtn.textContent;
      resendBtn.textContent = "Sending...";
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await response.json().catch(() => ({}));
        showAlert(data.message || "If that email exists, a new code has been sent.", "success");
      } catch (err) {
        console.error("Resend code error:", err);
        showAlert("Could not reach the server.");
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = originalText;
      }
    });
  }
});