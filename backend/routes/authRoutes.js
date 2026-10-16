
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

// Limit repeated authentication requests.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please wait 15 minutes and try again."
    }
});

// Apply rate limiting to all authentication endpoints.
router.use(authLimiter);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
