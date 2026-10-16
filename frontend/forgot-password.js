const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    message.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            }
        );

        const data = await response.json();

        message.textContent = data.message ||
            "Unable to process your request. Please try again.";

        message.style.color = response.ok ? "green" : "red";
    } catch (error) {
        message.textContent =
            "Cannot connect to the server. Please try again.";
        message.style.color = "red";
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Reset Link";
    }
});