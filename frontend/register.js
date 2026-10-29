const API_BASE_URL = "https://expencetracker-8lb7.onrender.com/api/auth";
const registerForm = document.getElementById("registerForm");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const togglePassword = document.getElementById("togglePassword");
const registerMessage = document.getElementById("registerMessage");
const googleRegisterButton = document.getElementById("googleRegisterButton");

function showMessage(message, isError = true) {
    registerMessage.textContent = message;
    registerMessage.style.color = isError ? "#b42318" : "#15803d";
}

togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "Hide" : "Show";

    togglePassword.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
    );
});

confirmPasswordInput.addEventListener("input", () => {
    confirmPasswordInput.setCustomValidity("");
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const acceptedTerms = document.getElementById("acceptTerms").checked;

    if (fullName.length < 2 || fullName.length > 100) {
        showMessage("Name must be between 2 and 100 characters.");
        fullNameInput.focus();
        return;
    }

    if (!emailInput.validity.valid || !email) {
        showMessage("Please enter a valid email address.");
        emailInput.focus();
        return;
    }

    if (password.length < 8) {
        showMessage("Your password must contain at least 8 characters.");
        passwordInput.focus();
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Your passwords do not match.");
        confirmPasswordInput.focus();
        return;
    }

    if (!acceptedTerms) {
        showMessage("Please accept the Terms of Service and Privacy Policy.");
        return;
    }

    const submitButton = registerForm.querySelector('[type="submit"]');

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: fullName,
                email,
                password
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Registration failed.");
        }

        showMessage(
            "Account created successfully! Redirecting to login...",
            false
        );

        registerForm.reset();
        passwordInput.type = "password";
        togglePassword.textContent = "Show";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);

    } catch (error) {
        console.error("Registration error:", error);

        if (error instanceof TypeError) {
            showMessage(
                "Cannot connect to the server. Make sure your backend is running."
            );
        } else {
            showMessage(error.message || "Registration failed. Please try again.");
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

googleRegisterButton.addEventListener("click", () => {
    showMessage(
        "Google Sign-In is not configured yet. Please register using your email."
    );
});

document.getElementById("termsLink").addEventListener("click", (event) => {
    event.preventDefault();
    showMessage("Terms of Service will be available soon.", false);
});

document.getElementById("privacyLink").addEventListener("click", (event) => {
    event.preventDefault();
    showMessage("Privacy Policy will be available soon.", false);
});



function initializeGoogleRegister() {
    const buttonContainer = document.getElementById("googleRegisterButton");

    if (!buttonContainer || !window.google?.accounts?.id) {
        return;
    }

    google.accounts.id.initialize({
        client_id: "319001575860-6jdvg9jk06jholj5o6maqlc7nevrk1lh.apps.googleusercontent.com",
        callback: handleGoogleRegister
    });

    google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        text: "signup_with",
        shape: "rectangular",
        width: 280
    });
}

async function handleGoogleRegister(response) {
    try {
        const result = await fetch("https://expencetracker-8lb7.onrender.com/api/auth/google", {
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
            alert(data.message || "Google sign-up failed.");
            return;
        }

        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("authUser", JSON.stringify(data.user));

        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Google sign-up error:", error);
        alert("Unable to connect to the server. Please check that your backend is running.");
    }
}

window.addEventListener("load", () => {
    if (window.google?.accounts?.id) {
        initializeGoogleRegister();
    } else {
        const googleScript = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (googleScript) {
            googleScript.addEventListener("load", initializeGoogleRegister, { once: true });
        }
    }
});