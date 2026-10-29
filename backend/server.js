import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";

import connectDB from "./config/db.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Render sits behind a proxy. Without this, every visitor shares one IP
// and one rate-limit counter.
app.set("trust proxy", 1);

// Allow only approved frontend origins.
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://arpanmaiti5820-creator.github.io"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.error("Rejected CORS origin:", origin);
        return callback(new Error("Origin not allowed by CORS"));
    }
}));

// Add security-related HTTP headers.
app.use(helmet());

// Limit incoming JSON request size.
app.use(express.json({ limit: "10kb" }));

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

// API health check.
app.get("/", (req, res) => {
    res.json({
        message: "Expense Tracker API is running"
    });
});

// Start only after MongoDB connects.
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
});