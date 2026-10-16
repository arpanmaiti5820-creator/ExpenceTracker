
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        type: {
            type: String,
            required: true,
            enum: ["income", "expense"]
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Salary",
                "Freelance",
                "Food",
                "Travel",
                "Shopping",
                "Bills",
                "Education",
                "Healthcare",
                "Entertainment",
                "Other"
            ]
        },
        date: {
            type: String,
            required: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
