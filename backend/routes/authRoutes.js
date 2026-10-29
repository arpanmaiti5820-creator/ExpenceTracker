import express from "express";
import rateLimit from "express-rate-limit";

import {
    registerUser,
    loginUser,
    googleLogin,
    forgotPassword,
    resetPassword
} from "../controllers/authController.js";

const router = express.Router();

// Sign-in endpoints: only FAILED attempts count, so normal logins never get blocked.
const signInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many failed attempts. Please wait 15 minutes and try again."
    }
});

// Register, forgot and reset: every request counts (stops email and account spam).
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please wait 15 minutes and try again."
    }
});

router.post("/register", authLimiter, registerUser);
router.post("/login", signInLimiter, loginUser);
router.post("/google", signInLimiter, googleLogin);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;