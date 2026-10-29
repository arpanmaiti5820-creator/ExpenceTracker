let editingTransactionId = null;
const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");
const transactionMessage = document.getElementById("transactionMessage");

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");

const transactionCount = document.getElementById("transactionCount");
const searchInput = document.getElementById("searchTransactions");
const filterType = document.getElementById("filterType");

const transactionTitle = document.getElementById("transactionTitle");
const transactionAmount = document.getElementById("transactionAmount");
const transactionCategory = document.getElementById("transactionCategory");
const transactionDate = document.getElementById("transactionDate");
const transactionDescription = document.getElementById("transactionDescription");

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const logoutButton = document.getElementById("logoutButton");

const trashNavLink = document.getElementById("trashNavLink");
const trashSection = document.getElementById("trashSection");
const trashList = document.getElementById("trashList");
const trashCount = document.getElementById("trashCount");
const emptyTrashBtn = document.getElementById("emptyTrashBtn");


const API_BASE_URL = "https://expencetracker-8lb7.onrender.com/api/transactions";
const authUser = JSON.parse(
    sessionStorage.getItem("authUser") || "null"
);

if (authUser) {
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    const profileAvatar = document.querySelector(".profile-avatar");

    if (profileName) {
        profileName.textContent = authUser.name;
    }

    if (profileEmail) {
        profileEmail.textContent = authUser.email;
    }

    if (profileAvatar) {
        profileAvatar.textContent = authUser.name
            .trim()
            .charAt(0)
            .toUpperCase();
    }
}



let transactions = [];
// Reusable helper for backend API requests

async function apiRequest(endpoint = "", options = {}) {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        sessionStorage.clear();
        window.location.replace("index.html");
        throw new Error("Please log in to continue.");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        sessionStorage.clear();
        window.location.replace("index.html");
        throw new Error("Your session has expired. Please log in again.");
    }

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.message || "API request failed.");
    }

    return result;



}


// ===== Date and currency helpers =====

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ===== API data loading =====


async function loadTransactionsFromAPI() {
    try {
        const result = await apiRequest();

        transactions = result.data.map((item) => ({
            ...item,
            id: item._id,
            createdAt: new Date(item.createdAt).getTime()
        }));

        updateSummary();
        renderTransactions();
        updateAnalytics();
    } catch (error) {
        console.error("Failed to load transactions:", error);
        showMessage("Could not load transactions from the server.", true);
    }
}



// ===== Messages =====

function showMessage(message, isError = false) {
    transactionMessage.textContent = message;
    transactionMessage.style.color = isError ? "#bd354e" : "#11865f";
}

// ===== Summary cards =====

function updateSummary() {
    const income = transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const expenses = transactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    totalIncome.textContent = formatCurrency(income);
    totalExpenses.textContent = formatCurrency(expenses);
    totalBalance.textContent = formatCurrency(income - expenses);
}

// ===== Transaction rendering =====

function getTransactionIcon(category) {
    const icons = {
        Salary: "₹",
        Freelance: "💻",
        Food: "🍽",
        Travel: "✈",
        Shopping: "🛍",
        Bills: "🧾",
        Education: "📚",
        Healthcare: "✚",
        Entertainment: "🎬",
        Other: "•"
    };

    return icons[category] || "•";
}

function createCell(text, className = "") {
    const cell = document.createElement("td");
    cell.textContent = text;

    if (className) {
        cell.className = className;
    }

    return cell;
}


function createTransactionRow(transaction) {
    const row = document.createElement("tr");

    // Transaction title and category
    const nameCell = document.createElement("td");
    const nameWrapper = document.createElement("div");
    nameWrapper.className = "transaction-name";

    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.textContent = getTransactionIcon(transaction.category);
    icon.setAttribute("aria-hidden", "true");

    const details = document.createElement("div");

    const title = document.createElement("div");
    title.className = "transaction-title";
    title.textContent = transaction.title;

    const category = document.createElement("span");
    category.className = "transaction-category";
    category.textContent = transaction.category;

    details.append(title, category);
    nameWrapper.append(icon, details);
    nameCell.appendChild(nameWrapper);

    // Date
    const dateCell = createCell(formatDate(transaction.date));

    // Amount
    const amountPrefix = transaction.type === "income" ? "+" : "−";
    const amountClass =
        transaction.type === "income" ? "amount-income" : "amount-expense";

    const amountCell = createCell(
        `${amountPrefix}${formatCurrency(transaction.amount)}`,
        amountClass
    );

    // Action buttons
    const actionCell = document.createElement("td");
    actionCell.className = "transaction-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";
    editButton.setAttribute(
        "aria-label",
        `Edit transaction ${transaction.title}`
    );

    editButton.addEventListener("click", () => {
        editTransaction(transaction);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
        "aria-label",
        `Delete transaction ${transaction.title}`
    );

    deleteButton.addEventListener("click", () => {
        deleteTransaction(transaction.id);
    });

    actionCell.append(editButton, deleteButton);

    row.append(nameCell, dateCell, amountCell, actionCell);

    return row;
}


function renderTransactions() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedType = filterType.value;

    const filteredTransactions = transactions
        .filter((transaction) => {
            const matchesSearch =
                transaction.title.toLowerCase().includes(query) ||
                transaction.category.toLowerCase().includes(query) ||
                (transaction.description || "").toLowerCase().includes(query);

            const matchesType =
                selectedType === "all" || transaction.type === selectedType;

            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            return b.date.localeCompare(a.date) ||
                b.createdAt - a.createdAt;
        });

    transactionList.replaceChildren();

    if (filteredTransactions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-state";
        cell.textContent = transactions.length === 0
            ? "No transactions yet. Add your first transaction."
            : "No transactions match your search.";

        row.appendChild(cell);
        transactionList.appendChild(row);
    } else {
        filteredTransactions.forEach((transaction) => {
            transactionList.appendChild(createTransactionRow(transaction));
        });
    }

    transactionCount.textContent =
        `${transactions.length} ${transactions.length === 1 ? "record" : "records"}`;

    document.getElementById("historySummary").textContent =
        `Showing ${filteredTransactions.length} of ${transactions.length} transactions`;
}

// ===== Add transaction =====



transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    const title = transactionTitle.value.trim();
    const amount = Number(transactionAmount.value);
    const type = transactionForm.querySelector(
        'input[name="type"]:checked'
    )?.value;

    const category = transactionCategory.value;
    const date = transactionDate.value;
    const description = transactionDescription.value.trim();

    if (title.length < 1 || title.length > 100) {
        showMessage("Enter a transaction name of up to 100 characters.", true);
        transactionTitle.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
        showMessage("Enter a valid positive amount.", true);
        transactionAmount.focus();
        return;
    }

    if (!["income", "expense"].includes(type)) {
        showMessage("Choose income or expense.", true);
        return;
    }

    const allowedCategories = [
        "Salary", "Freelance", "Food", "Travel", "Shopping",
        "Bills", "Education", "Healthcare", "Entertainment", "Other"
    ];

    if (!allowedCategories.includes(category)) {
        showMessage("Please select a valid category.", true);
        transactionCategory.focus();
        return;
    }

    if (!date || date > getLocalDate()) {
        showMessage("Choose a valid date that is not in the future.", true);
        transactionDate.focus();
        return;
    }

    if (description.length > 500) {
        showMessage("Description must be 500 characters or fewer.", true);
        transactionDescription.focus();
        return;
    }

    const transaction = {
        title,
        amount,
        type,
        category,
        date,
        description
    };

    const submitButton = transactionForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;

    try {
        if (editingTransactionId) {
            // Update the existing transaction
            const result = await apiRequest(`/${editingTransactionId}`, {
                method: "PUT",
                body: JSON.stringify(transaction)
            });

            const updatedData = result.data;

            const updatedTransaction = {
                ...updatedData,
                id: updatedData._id || updatedData.id || editingTransactionId,
                createdAt: new Date(updatedData.createdAt).getTime()
            };

            transactions = transactions.map((item) =>
                item.id === editingTransactionId
                    ? updatedTransaction
                    : item
            );

            editingTransactionId = null;

            showMessage("Transaction updated successfully.");
        } else {
            // Create a new transaction
            const result = await apiRequest("", {
                method: "POST",
                body: JSON.stringify(transaction)
            });

            const savedTransaction = {
                ...result.data,
                id: result.data._id || result.data.id,
                createdAt: new Date(result.data.createdAt).getTime()
            };

            transactions.push(savedTransaction);

            showMessage("Transaction added successfully.");
        }

        updateSummary();
        renderTransactions();
        updateAnalytics();

        transactionForm.reset();
        transactionDate.value = getLocalDate();

        document.querySelector("#add-transaction .panel-heading h2")
            .textContent = "Add Transaction";

        submitButton.textContent = "＋ Save Transaction";
        transactionTitle.focus();
    } catch (error) {
        console.error("Failed to save transaction:", error);
        showMessage(error.message || "Could not save transaction.", true);
    } finally {
        submitButton.disabled = false;
    }
});



// ===== Delete transaction =====

function deleteTransaction(id) {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    openConfirmModal(
        `Move "${transaction.title}" to Trash? You can restore it later.`,
        () => moveTransactionToTrash(id)
    );
}

// ===== Search and filter =====

searchInput.addEventListener("input", renderTransactions);
filterType.addEventListener("change", renderTransactions);

document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = "";
    filterType.value = "all";
    renderTransactions();
});

// ===== Mobile navigation =====

menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
});



document.querySelectorAll(".sidebar-nav .nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();

        document.querySelectorAll(".sidebar-nav .nav-link")
            .forEach((item) => item.classList.remove("active"));

        link.classList.add("active");

        sidebar.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");

        const overviewSections = [
            document.querySelector(".welcome-banner"),
            document.querySelector(".summary-section"),
            document.querySelector(".dashboard-footer")
        ];

        const analyticsSection = document.getElementById("analytics");

        const addTransactionSection =
            document.getElementById("add-transaction");

        const transactionsSection =
            document.getElementById("transactions");

        // Hide all main content sections first.
        overviewSections.forEach((section) => {
            if (section) section.hidden = true;
        });
        if (analyticsSection) {
            analyticsSection.hidden = true;
        }
        if (addTransactionSection) {
            addTransactionSection.hidden = true;
        }

        if (transactionsSection) {
            transactionsSection.hidden = true;
        }

        if (trashSection) {
            trashSection.hidden = true;
        }

        const target = link.getAttribute("href");


        if (target === "#overview") {
            overviewSections.forEach((section) => {
                if (section) section.hidden = false;
            });

            if (addTransactionSection) {
                addTransactionSection.hidden = false;
            }

            if (transactionsSection) {
                transactionsSection.hidden = false;
            }

            if (trashSection) {
                trashSection.hidden = true;
            }
        }
        else if (target === "#transactions") {
            if (transactionsSection) {
                transactionsSection.hidden = false;
            }
        }
        else if (target === "#analytics") {
            if (analyticsSection) {
                analyticsSection.hidden = false;
                updateAnalytics();
            }
        }
        else if (target === "#add-transaction") {
            if (addTransactionSection) {
                addTransactionSection.hidden = false;
            }
        } else if (link.id === "trashNavLink") {
            if (trashSection) {
                trashSection.hidden = false;
                renderTrash();
            }
        }
    });
});



// ===== Demo profile and sign out =====

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });



logoutButton.addEventListener("click", () => {
    const logoutModal = document.getElementById("logoutModal");

    if (logoutModal) {
        logoutModal.classList.add("active");
        logoutModal.setAttribute("aria-hidden", "false");
    }
});

const logoutModal = document.getElementById("logoutModal");
const cancelLogoutButton = document.getElementById("cancelLogout");
const confirmLogoutButton = document.getElementById("confirmLogout");

function closeLogoutModal() {
    if (!logoutModal) return;

    logoutModal.classList.remove("active");
    logoutModal.setAttribute("aria-hidden", "true");
}

if (cancelLogoutButton) {
    cancelLogoutButton.addEventListener("click", closeLogoutModal);
}

if (confirmLogoutButton) {
    confirmLogoutButton.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.replace("index.html");
    });
}

if (logoutModal) {
    logoutModal.addEventListener("click", (event) => {
        if (event.target === logoutModal) {
            closeLogoutModal();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeLogoutModal();
    }
});



// ===== Initial setup =====

transactionDate.value = getLocalDate();
loadTransactionsFromAPI();


document.addEventListener("click", (event) => {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");

    if (!sidebar || !menuToggle) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const clickedOutside =
        !sidebar.contains(event.target) &&
        !menuToggle.contains(event.target);

    if (
        isMobile &&
        sidebar.classList.contains("open") &&
        clickedOutside
    ) {
        sidebar.classList.remove("open");
    }
});




async function getTrashTransactions() {
    try {
        const result = await apiRequest("/trash");

        return result.data.map((item) => ({
            ...item,
            id: item._id,
            createdAt: new Date(item.createdAt).getTime()
        }));
    } catch (error) {
        console.error("Failed to load Trash:", error);
        showMessage("Could not load Trash from the server.", true);
        return [];
    }
}



async function renderTrash() {
    if (!trashList) return;

    trashList.replaceChildren();

    const loadingRow = document.createElement("tr");
    const loadingCell = document.createElement("td");
    loadingCell.colSpan = 4;
    loadingCell.className = "empty-state";
    loadingCell.textContent = "Loading Trash...";
    loadingRow.appendChild(loadingCell);
    trashList.appendChild(loadingRow);

    const trash = await getTrashTransactions();

    if (emptyTrashBtn) {
        emptyTrashBtn.disabled = trash.length === 0;
        emptyTrashBtn.title = trash.length === 0
            ? "Trash is already empty"
            : "Permanently delete all trashed transactions";
    }

    if (trashCount) {
        trashCount.textContent = trash.length;
    }

    trashList.replaceChildren();

    if (trash.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-state";
        cell.textContent = "Trash is empty.";

        row.appendChild(cell);
        trashList.appendChild(row);
        return;
    }

    trash.forEach((transaction) => {
        const row = document.createElement("tr");

        const titleCell = document.createElement("td");
        titleCell.textContent = transaction.title;

        const dateCell = document.createElement("td");
        dateCell.textContent = transaction.date;

        const amountCell = document.createElement("td");
        amountCell.textContent =
            `${transaction.type === "income" ? "+" : "-"}₹${Number(transaction.amount).toLocaleString("en-IN")}`;

        const actionCell = document.createElement("td");

        const restoreButton = document.createElement("button");
        restoreButton.type = "button";
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => {
            restoreTransaction(transaction.id);
        });

        const permanentDeleteButton = document.createElement("button");
        permanentDeleteButton.type = "button";
        permanentDeleteButton.textContent = "Delete permanently";
        permanentDeleteButton.addEventListener("click", () => {
            permanentlyDeleteTransaction(transaction.id);
        });

        actionCell.append(restoreButton, permanentDeleteButton);
        row.append(titleCell, dateCell, amountCell, actionCell);
        trashList.appendChild(row);
    });
}



async function restoreTransaction(id) {
    try {
        await apiRequest(`/${encodeURIComponent(id)}/restore`, {
            method: "PATCH"
        });

        await loadTransactionsFromAPI();
        await renderTrash();

        showMessage("Transaction restored successfully.");
    } catch (error) {
        console.error("Failed to restore transaction:", error);
        showMessage(
            error.message || "Could not restore transaction.",
            true
        );
    }
}



function permanentlyDeleteTransaction(id) {
    openConfirmModal(
        "Permanently delete this transaction? This action cannot be undone.",
        () => permanentlyDeleteTransactionConfirmed(id)
    );
}


/* ===== Professional Confirmation Modal ===== */
const confirmModal = document.getElementById("confirmModal");
const confirmModalMessage = document.getElementById("confirmModalMessage");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let pendingConfirmationAction = null;


function openConfirmModal(message, onConfirm) {
    if (!confirmModal) return;

    const isPermanentDelete = message.toLowerCase().includes("permanently delete");

    document.getElementById("confirmModalTitle").textContent =
        isPermanentDelete ? "Delete Permanently?" : "Move to Trash?";

    confirmModalMessage.textContent = message;

    confirmDeleteBtn.textContent =
        isPermanentDelete ? "Delete Permanently" : "Move to Trash";

    if (isPermanentDelete) {
        confirmDeleteBtn.style.background = "#dc3545";
        confirmDeleteBtn.style.boxShadow = "0 5px 14px rgba(220,53,69,0.2)";
    } else {
        confirmDeleteBtn.style.background = "";
        confirmDeleteBtn.style.boxShadow = "";
    }

    pendingConfirmationAction = onConfirm;
    confirmModal.hidden = false;
    cancelDeleteBtn.focus();
}


function closeConfirmModal() {
    confirmModal.hidden = true;
    pendingConfirmationAction = null;
}

cancelDeleteBtn.addEventListener("click", closeConfirmModal);


confirmDeleteBtn.addEventListener("click", () => {
    const action = pendingConfirmationAction;

    if (typeof action !== "function") {
        console.error("No delete action is pending.");
        return;
    }

    closeConfirmModal();

    try {
        action();
    } catch (error) {
        console.error("Failed to move transaction to Trash:", error);
    }
});


confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !confirmModal.hidden) {
        closeConfirmModal();
    }
});

/* Move a transaction to Trash after confirmation */

async function moveTransactionToTrash(id) {
    try {
        await apiRequest(`/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        await loadTransactionsFromAPI();
        await renderTrash();

        showMessage("Transaction moved to Trash.");
    } catch (error) {
        console.error("Failed to move transaction to Trash:", error);
        showMessage(
            error.message || "Could not move transaction to Trash.",
            true
        );
    }
}



async function permanentlyDeleteTransactionConfirmed(id) {
    try {
        await apiRequest(`/${encodeURIComponent(id)}/permanent`, {
            method: "DELETE"
        });

        await renderTrash();

        showMessage("Transaction permanently deleted.");
    } catch (error) {
        console.error("Failed to permanently delete transaction:", error);
        showMessage(
            error.message || "Could not permanently delete transaction.",
            true
        );
    }
}


/* ===== Empty Trash ===== */



if (emptyTrashBtn) {
    emptyTrashBtn.addEventListener("click", async () => {
        const trash = await getTrashTransactions();

        if (trash.length === 0) {
            showMessage("Trash is already empty.");
            return;
        }

        openConfirmModal(
            `Permanently delete all ${trash.length} trashed transaction(s)? This action cannot be undone.`,
            emptyTrashPermanently
        );
    });
}



async function emptyTrashPermanently() {
    try {
        const result = await apiRequest("/trash/empty", {
            method: "DELETE"
        });

        await renderTrash();

        showMessage(
            result.message || "Trash emptied successfully."
        );
    } catch (error) {
        console.error("Failed to empty Trash:", error);
        showMessage(
            error.message || "Could not empty Trash.",
            true
        );
    }
}

function editTransaction(transaction) {
    // Fill the existing form with the transaction's current data
    document.getElementById("transactionTitle").value = transaction.title;
    document.getElementById("transactionAmount").value = transaction.amount;
    document.getElementById("transactionCategory").value = transaction.category;
    document.getElementById("transactionDate").value = transaction.date;
    document.getElementById("transactionDescription").value =
        transaction.description || "";

    // Select the existing transaction type
    const typeInput = document.querySelector(
        `input[name="type"][value="${transaction.type}"]`
    );

    if (typeInput) {
        typeInput.checked = true;
    }

    // Remember which transaction is being edited
    editingTransactionId = transaction.id;

    // Update the form heading and button
    document.querySelector("#add-transaction .panel-heading h2").textContent =
        "Edit Transaction";

    document.querySelector("#transactionForm button[type='submit']").textContent =
        "Save Changes";

    // Scroll to the form
    document.getElementById("add-transaction").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}



/* ===== Expense Analytics ===== */

let monthlyAnalyticsChart = null;
let categoryAnalyticsChart = null;
let savingsAnalyticsChart = null;


function updateAnalytics() {
    const periodSelect = document.getElementById("analyticsPeriod");

    const incomeElement = document.getElementById("analyticsIncome");
    const expensesElement = document.getElementById("analyticsExpenses");
    const savingsElement = document.getElementById("analyticsSavingsRate");

    const monthlyCanvas = document.getElementById("monthlyAnalyticsChart");
    const categoryCanvas = document.getElementById("categoryAnalyticsChart");
    const categoryEmpty = document.getElementById("categoryAnalyticsEmpty");
    const savingsCanvas = document.getElementById("savingsAnalyticsChart");

    if (
        !periodSelect ||
        !incomeElement ||
        !expensesElement ||
        !savingsElement ||
        !monthlyCanvas ||
        !categoryCanvas
    ) {
        return;
    }

    const period = periodSelect.value;
    const now = new Date();

    let filtered = transactions.filter((transaction) => {
        if (period === "all") return true;

        const transactionDate = new Date(`${transaction.date}T00:00:00`);
        if (Number.isNaN(transactionDate.getTime())) return false;

        const monthsAgo = Number(period);
        const startDate = new Date(
            now.getFullYear(),
            now.getMonth() - monthsAgo + 1,
            1
        );

        return transactionDate >= startDate &&
            transactionDate <= new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                23, 59, 59, 999
            );
    });

    const income = filtered
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const expenses = filtered
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const savingsRate = income > 0
        ? ((income - expenses) / income) * 100
        : 0;


    // Calculate the highest-spending category
    const categorySpending = {};

    filtered
        .filter((item) => item.type === "expense")
        .forEach((item) => {
            const category = item.category || "Uncategorized";
            categorySpending[category] =
                (categorySpending[category] || 0) + Number(item.amount);
        });

    const topCategoryEntry = Object.entries(categorySpending)
        .sort((a, b) => b[1] - a[1])[0];

    const topCategoryElement =
        document.getElementById("analyticsTopCategory");

    if (topCategoryElement) {
        topCategoryElement.textContent = topCategoryEntry
            ? topCategoryEntry[0]
            : "No expenses";
    }

    // Calculate average monthly expenses for the selected period
    const averageExpensesElement =
        document.getElementById("analyticsAverageExpenses");

    let monthsForAverage;

    if (period === "all") {
        const expenseDates = filtered
            .filter((item) => item.type === "expense")
            .map((item) => new Date(`${item.date}T00:00:00`))
            .filter((date) => !Number.isNaN(date.getTime()));

        if (expenseDates.length > 0) {
            const earliest = expenseDates.reduce(
                (min, date) => date < min ? date : min
            );

            monthsForAverage = Math.max(
                1,
                (now.getFullYear() - earliest.getFullYear()) * 12 +
                now.getMonth() - earliest.getMonth() + 1
            );
        } else {
            monthsForAverage = 1;
        }
    } else {
        monthsForAverage = Number(period);
    }

    if (averageExpensesElement) {
        averageExpensesElement.textContent = formatCurrency(
            expenses / monthsForAverage
        );
    }


    incomeElement.textContent = formatCurrency(income);
    expensesElement.textContent = formatCurrency(expenses);
    savingsElement.textContent = `${savingsRate.toFixed(1)}%`;

    if (typeof Chart === "undefined") {
        console.error("Chart.js has not loaded.");
        return;
    }

    // Prepare monthly totals
    const monthLabels = [];
    const monthlyIncome = [];
    const monthlyExpenses = [];

    const monthCount = period === "all"
        ? Math.max(
            12,
            (now.getFullYear() - Math.min(
                ...filtered.map(item => new Date(item.date + "T00:00:00").getFullYear()),
                now.getFullYear()
            )) * 12 +
            now.getMonth() -
            Math.min(
                ...filtered.map(item => new Date(item.date + "T00:00:00").getFullYear()),
                now.getFullYear()
            ) * 12
        )
        : Number(period);

    for (let i = monthCount - 1; i >= 0; i--) {
        const monthDate = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );

        monthLabels.push(
            monthDate.toLocaleDateString("en-IN", {
                month: "short",
                year: "2-digit"
            })
        );

        const monthKey = `${monthDate.getFullYear()}-${String(
            monthDate.getMonth() + 1
        ).padStart(2, "0")}`;

        const monthTransactions = filtered.filter(
            (item) => item.date.startsWith(monthKey)
        );

        monthlyIncome.push(
            monthTransactions
                .filter((item) => item.type === "income")
                .reduce((sum, item) => sum + Number(item.amount), 0)
        );

        monthlyExpenses.push(
            monthTransactions
                .filter((item) => item.type === "expense")
                .reduce((sum, item) => sum + Number(item.amount), 0)
        );
    }

    if (monthlyAnalyticsChart) {
        monthlyAnalyticsChart.destroy();
    }

    monthlyAnalyticsChart = new Chart(monthlyCanvas, {
        type: "bar",
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: "Income",
                    data: monthlyIncome,
                    backgroundColor: "#12a36b",
                    borderRadius: 5
                },
                {
                    label: "Expenses",
                    data: monthlyExpenses,
                    backgroundColor: "#e85d75",
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) =>
                            `${context.dataset.label}: ${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => `₹${value.toLocaleString("en-IN")}`
                    }
                }
            }
        }
    });


    // Monthly net savings = income minus expenses
    if (savingsAnalyticsChart) {
        savingsAnalyticsChart.destroy();
    }

    const monthlySavings = monthlyIncome.map(
        (amount, index) => amount - monthlyExpenses[index]
    );

    savingsAnalyticsChart = new Chart(savingsCanvas, {
        type: "line",
        data: {
            labels: monthLabels,
            datasets: [{
                label: "Net Savings",
                data: monthlySavings,
                borderColor: "#0e8a8a",
                backgroundColor: "rgba(14, 138, 138, 0.14)",
                fill: true,
                tension: 0.3,
                pointRadius: (context) => context.raw === 0 ? 0 : 5,
                pointHoverRadius: 7,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) =>
                            `Net Savings: ${formatCurrency(context.raw)}`
                    }
                }
            },

            scales: {
                y: {
                    ticks: {
                        callback: (value) =>
                            `₹${value.toLocaleString("en-IN")}`
                    }
                }
            }
        }
    });


    // Prepare category-wise expenses
    const categoryTotals = {};

    filtered
        .filter((item) => item.type === "expense")
        .forEach((item) => {
            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0) + Number(item.amount);
        });


    console.table(
        filtered
            .filter((item) => item.type === "expense")
            .map((item) => ({
                title: item.title,
                category: item.category,
                amount: item.amount,
                date: item.date
            }))
    );
    const categoryLabels = Object.keys(categoryTotals);
    const categoryValues = Object.values(categoryTotals);

    if (categoryAnalyticsChart) {
        categoryAnalyticsChart.destroy();
        categoryAnalyticsChart = null;
    }

    categoryEmpty.hidden = categoryLabels.length > 0;
    categoryCanvas.hidden = categoryLabels.length === 0;

    if (categoryLabels.length > 0) {
        categoryAnalyticsChart = new Chart(categoryCanvas, {
            type: "doughnut",
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryValues,
                    backgroundColor: [
                        "#0e8a8a", "#f2b84b", "#e0566b", "#3b82c4", "#12a36b",
                        "#7c8fd6", "#5eead4", "#f08a4b", "#64748b", "#c46a9b"
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) =>
                                `${context.label}: ${formatCurrency(context.raw)}`
                        }
                    }
                }
            }
        });
    }
}

document.getElementById("analyticsPeriod")?.addEventListener(
    "change",
    updateAnalytics
);