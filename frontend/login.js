
const API_BASE_URL = "http://localhost:5000/api/auth";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");
const forgotPassword = document.getElementById("forgotPassword");

function showMessage(message, isError = true) {
    loginMessage.textContent = message;
    loginMessage.style.color = isError ? "#b91c1c" : "#15803d";
}

togglePassword.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";
    togglePassword.textContent = isPasswordHidden ? "Hide" : "Show";

    togglePassword.setAttribute(
        "aria-label",
        isPasswordHidden ? "Hide password" : "Show password"
    );
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    showMessage("");

    if (!email || !password) {
        showMessage("Please enter your email and password.");
        return;
    }

    const submitButton = loginForm.querySelector('[type="submit"]');

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Login failed.");
        }

        if (!result.token || !result.user) {
            throw new Error("The server returned an incomplete login response.");
        }

        // Store the authentication token and basic user information.
        sessionStorage.setItem("authToken", result.token);
        sessionStorage.setItem("authUser", JSON.stringify(result.user));

        showMessage("Login successful! Opening dashboard...", false);

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Login error:", error);

        if (error instanceof TypeError) {
            showMessage(
                "Cannot connect to the server. Make sure your backend is running."
            );
        } else {
            showMessage(error.message || "Login failed. Please try again.");
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});





function initializeGoogleLogin() {
    const buttonContainer = document.getElementById("googleLoginButton");

    if (!buttonContainer || !window.google?.accounts?.id) {
        return;
    }

    google.accounts.id.initialize({
        client_id: "319001575860-6jdvg9jk06jholj5o6maqlc7nevrk1lh.apps.googleusercontent.com",
        callback: handleGoogleLogin
    });

    google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 280
    });
}

async function handleGoogleLogin(response) {
    try {
        const result = await fetch("http://localhost:5000/api/auth/google", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });

        const data = await result.json();

        if (!result.ok || !data.success) {
            showGoogleAuthMessage(
                data.message || "Google sign-in failed. Please try again.",
                "Sign-in unsuccessful"
            );
            return;
        }

        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("authUser", JSON.stringify(data.user));

        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Google sign-in error:", error);
        showGoogleAuthMessage(
            "We couldn't connect to the server. Please check your connection and try again.",
            "Connection problem"
        );
    }
}

window.addEventListener("load", () => {
    if (window.google?.accounts?.id) {
        initializeGoogleLogin();
    } else {
        const googleScript = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (googleScript) {
            googleScript.addEventListener("load", initializeGoogleLogin, { once: true });
        }
    }
});



function showGoogleAuthMessage(message, title = "Unable to sign in") {
    const box = document.getElementById("googleAuthMessage");
    const titleElement = document.getElementById("googleAuthMessageTitle");
    const textElement = document.getElementById("googleAuthMessageText");
    const link = document.getElementById("googleAuthMessageLink");

    if (!box || !titleElement || !textElement) {
        alert(message);
        return;
    }

    titleElement.textContent = title;
    textElement.textContent = message;
    link.hidden = true;
    box.hidden = false;
}

document.getElementById("googleAuthMessageClose")?.addEventListener("click", () => {
    document.getElementById("googleAuthMessage").hidden = true;
});

// Clear login fields whenever the login page opens
window.addEventListener("pageshow", () => {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
});