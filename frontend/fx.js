/* Presentation-only effects. Reads the DOM; never changes data or calls the API. */
(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Chart look (colours per dataset are set in dashboard.js)
    if (window.Chart) {
        Chart.defaults.font.family = "'Manrope', sans-serif";
        Chart.defaults.color = "#6b7f93";
        Chart.defaults.animation.duration = reduce ? 0 : 900;
        Chart.defaults.animation.easing = "easeOutCubic";
    }

    // 1) Smooth page-change: animate each section as it becomes visible
    const sections = [".welcome-banner", ".summary-section", "#add-transaction", "#transactions",
        "#analytics", "#trashSection", ".dashboard-footer"].map(s => document.querySelector(s)).filter(Boolean);
    const known = new Set(sections);
    new MutationObserver(records => {
        const shown = [...new Set(records.map(r => r.target))].filter(el => known.has(el) && !el.hidden);
        shown.forEach((el, i) => {
            el.style.setProperty("--i", i);
            el.classList.remove("view-enter");
            void el.offsetWidth;
            el.classList.add("view-enter");
        });
    }).observe(document.body, { attributes: true, attributeFilter: ["hidden"], subtree: true });
    document.addEventListener("animationend", e => {
        if (e.animationName === "viewIn") e.target.classList.remove("view-enter");
    });

    // 2) Breadcrumb + title follow the selected page
    const titles = {
        "#overview": "Overview", "#transactions": "Transactions", "#analytics": "Analytics",
        "#add-transaction": "Add Transaction"
    };
    document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
        link.addEventListener("click", () => {
            const name = titles[link.getAttribute("href")] || "Trash";
            const bar = document.querySelector(".topbar");
            const crumb = document.querySelector(".breadcrumb");
            const h1 = document.querySelector(".topbar h1");
            bar.classList.add("swap");
            setTimeout(() => {
                crumb.textContent = `Workspace / ${name}`;
                h1.textContent = name === "Overview" ? "Financial Overview" : name;
                bar.classList.remove("swap");
            }, reduce ? 0 : 200);
        });
    });

    // 3) Count-up on money figures whenever dashboard.js updates them
    const fmt = new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR",
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
    const num = t => parseFloat(t.replace(/[^\d.-]/g, ""));
    if (!reduce) {
        ["totalBalance", "totalIncome", "totalExpenses", "analyticsIncome",
            "analyticsExpenses", "analyticsAverageExpenses"].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                let shown = num(el.textContent) || 0, raf = 0;
                const cfg = { childList: true, characterData: true, subtree: true };
                const obs = new MutationObserver(() => {
                    const finalText = el.textContent, target = num(finalText);
                    if (Number.isNaN(target) || target === shown) return;
                    const from = shown, t0 = performance.now();
                    shown = target;
                    cancelAnimationFrame(raf);
                    const step = now => {
                        const p = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - p, 3);
                        obs.disconnect();
                        el.textContent = p < 1 ? fmt.format(from + (target - from) * e) : finalText;
                        obs.observe(el, cfg);
                        if (p < 1) raf = requestAnimationFrame(step);
                    };
                    raf = requestAnimationFrame(step);
                });
                obs.observe(el, cfg);
            });
    }
})();