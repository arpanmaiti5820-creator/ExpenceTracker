
import Transaction from "../models/Transaction.js";



const getTodayDateString = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
    );

    return `${values.year}-${values.month}-${values.day}`;
};


// GET /api/transactions
export const getTransactions = async (req, res) => {
    try {

        const transactions = await Transaction.find({
            user: req.user._id,
            deletedAt: null
        }).sort({
            date: -1,
            createdAt: -1
        });


        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch transactions."
        });
    }
};

// POST /api/transactions
export const createTransaction = async (req, res) => {
    try {
        const {
            title,
            amount,
            type,
            category,
            date,
            description = ""
        } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid transaction title."
            });
        }

        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 1_000_000_000
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid positive amount."
            });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Transaction type must be income or expense."
            });
        }

        const allowedCategories = [
            "Salary", "Freelance", "Food", "Travel", "Shopping",
            "Bills", "Education", "Healthcare", "Entertainment", "Other"
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Select a valid transaction category."
            });
        }

        const isValidDateFormat =
            typeof date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(date);

        const [year, month, day] = isValidDateFormat
            ? date.split("-").map(Number)
            : [];

        const parsedDate = isValidDateFormat
            ? new Date(Date.UTC(year, month - 1, day))
            : null;

        const isRealDate =
            parsedDate !== null &&
            parsedDate.getUTCFullYear() === year &&
            parsedDate.getUTCMonth() === month - 1 &&
            parsedDate.getUTCDate() === day;

        const todayString = getTodayDateString();

        if (!isValidDateFormat || !isRealDate || date > todayString) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid transaction date that is not in the future."
            });
        }

        if (
            typeof description !== "string" ||
            description.length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be 500 characters or fewer."
            });
        }


        const transaction = await Transaction.create({
            user: req.user._id,
            title: title.trim(),
            amount,
            type,
            category,
            date,
            description: description.trim()
        });


        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error("Create transaction error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create transaction."
        });
    }
};

/* PUT /api/transactions/:id */
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = [
            "title",
            "amount",
            "type",
            "category",
            "date",
            "description"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.hasOwn(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update."
            });
        }

        if (updates.title !== undefined) {
            if (
                typeof updates.title !== "string" ||
                !updates.title.trim() ||
                updates.title.trim().length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid transaction title."
                });
            }

            updates.title = updates.title.trim();
        }

        if (updates.amount !== undefined) {
            if (
                typeof updates.amount !== "number" ||
                !Number.isFinite(updates.amount) ||
                updates.amount <= 0 ||
                updates.amount > 1_000_000_000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid positive amount."
                });
            }
        }

        if (
            updates.type !== undefined &&
            !["income", "expense"].includes(updates.type)
        ) {
            return res.status(400).json({
                success: false,
                message: "Choose income or expense."
            });
        }

        const allowedCategories = [
            "Salary", "Freelance", "Food", "Travel", "Shopping",
            "Bills", "Education", "Healthcare", "Entertainment", "Other"
        ];

        if (
            updates.category !== undefined &&
            !allowedCategories.includes(updates.category)
        ) {
            return res.status(400).json({
                success: false,
                message: "Select a valid category."
            });
        }


        if (updates.date !== undefined) {
            const date = updates.date;

            const isValidDateFormat =
                typeof date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(date);

            let isRealDate = false;

            if (isValidDateFormat) {
                const [year, month, day] = date.split("-").map(Number);
                const parsedDate = new Date(Date.UTC(year, month - 1, day));

                isRealDate =
                    parsedDate.getUTCFullYear() === year &&
                    parsedDate.getUTCMonth() === month - 1 &&
                    parsedDate.getUTCDate() === day;
            }

            const todayString = getTodayDateString();

            if (
                !isValidDateFormat ||
                !isRealDate ||
                date > todayString
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid date that is not in the future."
                });
            }
        }


        if (updates.description !== undefined) {
            if (
                typeof updates.description !== "string" ||
                updates.description.length > 500
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Description must be 500 characters or fewer."
                });
            }

            updates.description = updates.description.trim();
        }


        const transaction = await Transaction.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                deletedAt: null
            },
            { $set: updates },
            { new: true, runValidators: true }
        );


        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Active transaction not found."
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        if (error.name === "CastError" || error.name === "BSONError") {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID."
            });
        }

        console.error("Update transaction error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update transaction."
        });
    }
};


/* DELETE /api/transactions/:id */

export const moveTransactionToTrash = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                deletedAt: null
            },
            {
                $set: { deletedAt: new Date() }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Active transaction not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transaction moved to Trash.",
            data: transaction
        });
    } catch (error) {
        if (
            error.name === "CastError" ||
            error.name === "BSONError"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID."
            });
        }

        console.error("Move to Trash error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to move transaction to Trash."
        });
    }
};



/* GET /api/transactions/trash */
export const getTrashedTransactions = async (req, res) => {
    try {

        const transactions = await Transaction.find({
            user: req.user._id,
            deletedAt: { $ne: null }
        }).sort({ deletedAt: -1 });


        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error("Fetch Trash error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch trashed transactions."
        });
    }
};

/* PATCH /api/transactions/:id/restore */
export const restoreTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findOneAndUpdate(

            {
                _id: id,
                user: req.user._id,
                deletedAt: { $ne: null }
            },

            {
                $set: { deletedAt: null }
            },
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Trashed transaction not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Transaction restored successfully.",
            data: transaction
        });
    } catch (error) {
        if (error.name === "CastError" || error.name === "BSONError") {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID."
            });
        }

        console.error("Restore transaction error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to restore transaction."
        });
    }
};

/* DELETE /api/transactions/:id/permanent */
export const permanentlyDeleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findOneAndDelete({
            _id: id,
            user: req.user._id,
            deletedAt: { $ne: null }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Trashed transaction not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Transaction permanently deleted."
        });
    } catch (error) {
        if (error.name === "CastError" || error.name === "BSONError") {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID."
            });
        }

        console.error("Permanent delete error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to permanently delete transaction."
        });
    }
};

/* DELETE /api/transactions/trash/empty */
export const emptyTrash = async (req, res) => {
    try {


        const result = await Transaction.deleteMany({
            user: req.user._id,
            deletedAt: { $ne: null }
        });


        res.status(200).json({
            success: true,
            message: "Trash emptied successfully.",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Empty Trash error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to empty Trash."
        });
    }
};
