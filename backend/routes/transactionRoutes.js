
import express from "express";
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    moveTransactionToTrash,
    getTrashedTransactions,
    restoreTransaction,
    permanentlyDeleteTransaction,
    emptyTrash



} from "../controllers/transactionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();


router.get("/trash", authMiddleware, getTrashedTransactions);
router.get("/", authMiddleware, getTransactions);
router.post("/", authMiddleware, createTransaction);
router.put("/:id", authMiddleware, updateTransaction);
router.delete("/trash/empty", authMiddleware, emptyTrash);
router.delete("/:id", authMiddleware, moveTransactionToTrash);
router.patch("/:id/restore", authMiddleware, restoreTransaction);
router.delete("/:id/permanent", authMiddleware, permanentlyDeleteTransaction);



export default router;
