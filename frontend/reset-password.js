const resetPasswordForm = document.getElementById("resetPasswordForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

const params = new URLSearchParams(window.location.search);
const resetToken = params.get("token");

if (!resetToken) {
    message.textContent =
        "Reset token is missing. Please request a new password-reset link.";
    message.style.color = "red";
    submitBtn.disabled = true;
}

resetPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!resetToken) {
        return;
    }

    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password.length < 8) {
        message.textContent =
            "Password must contain at least 8 characters.";
        message.style.color = "red";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.style.color = "red";
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Updating...";
    message.textContent = "";

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/reset-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: resetToken,
                    password
                })
            }
        );

        const data = await response.json();

        message.textContent = data.message ||
            "Unable to reset your password. Please try again.";
        message.style.color = response.ok ? "green" : "red";

        if (response.ok) {
            message.textContent =
                "Password reset successful! Redirecting to login...";

            message.style.color = "green";

            resetPasswordForm.querySelectorAll("input").forEach((input) => {
                input.disabled = true;
            });

            submitBtn.textContent = "Password Updated";

            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = "Update Password";
        }
    } catch (error) {
        message.textContent =
            "Cannot connect to the server. Please try again.";
        message.style.color = "red";
        submitBtn.disabled = false;
        submitBtn.textContent = "Update Password";
    }
});