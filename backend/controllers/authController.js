
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
// Register a new user
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (typeof name !== "string" || !name.trim() ||
            typeof email !== "string" ||
            typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Please enter valid registration details."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured."
            });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password
        });
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to register. Please try again."
        });
    }
};

// Log in an existing user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (
            !user ||
            !user.password ||
            !(await user.comparePassword(password))
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured."
            });
        }
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to log in. Please try again."
        });
    }
};


// Google Sign-In

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required."
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Google authentication is not configured."
            });
        }

        // Verify the credential with Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                success: false,
                message: "Unable to verify your Google account."
            });
        }

        const email = payload.email.trim().toLowerCase();
        const googleId = payload.sub;

        // Find an account already linked to this Google ID
        let user = await User.findOne({ googleId });

        if (!user) {
            // Avoid automatically linking an existing password account
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message:
                        "An account with this email already exists. Please log in with your password first."
                });
            }

            user = await User.create({
                name: payload.name || email.split("@")[0],
                email,
                googleId
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            success: true,
            message: "Google sign-in successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Google login error:", error);

        return res.status(401).json({
            success: false,
            message: "Google sign-in failed. Please try again."
        });
    }
};

// Request a password-reset link
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your registered email address."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        // Return a generic response for unknown or Google-only accounts.
        // This avoids revealing which email addresses have accounts.
        if (user && user.password) {
            const resetToken = crypto.randomBytes(32).toString("hex");

            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            user.passwordResetToken = hashedToken;
            user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

            await user.save();

            const sendResetEmail = async (to, resetLink) => {
                const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "accept": "application/json",
                        "api-key": process.env.BREVO_API_KEY,
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        sender: {
                            name: "ExpenseTracker",
                            email: process.env.SMTP_FROM
                        },
                        to: [{ email: to }],
                        subject: "Reset Your ExpenseTracker Password",
                        htmlContent: `
                <h2>Password Reset</h2>
                <p>We received a request to reset your password.</p>
                <p>
                    <a href="${resetLink}">Reset Password</a>
                </p>
                <p>If you did not request this, you can ignore this email.</p>
            `
                    })
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Brevo API error (${response.status}): ${error}`);
                }
            };

            const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");

            if (!frontendUrl) {
                throw new Error("FRONTEND_URL is not configured.");
            }

            const resetLink =
                `${frontendUrl}/reset-password.html?token=${resetToken}`;


            try {
                await sendResetEmail(user.email, resetLink);
            } catch (emailError) {
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                await user.save();

                throw emailError;
            }

        }

        return res.status(200).json({
            success: true,
            message:
                "If a password-based account exists for this email, password-reset instructions will be sent."
        });
    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process your request. Please try again."
        });
    }
};

// Reset an Expense Tracker password
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (
            typeof token !== "string" ||
            !token ||
            typeof password !== "string" ||
            password.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid reset token and a password of at least 8 characters are required."
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select("+passwordResetToken +passwordResetExpires +password");

        if (!user || !user.password) {
            return res.status(400).json({
                success: false,
                message:
                    "This reset link is invalid or expired. Please request a new one."
            });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. Please log in with your new password."
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset your password. Please try again."
        });
    }
};