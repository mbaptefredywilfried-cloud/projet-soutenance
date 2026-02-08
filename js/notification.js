// notification.js

// Reminder system for transactions
// - Respects localStorage.notificationsRappel ("true" or "false")
// - Exposes checkTransactionReminder() to check reminders on-demand
// - Non-blocking toast-style UI, max one reminder per day
// - Uses transaction.date values from localStorage.transactions (not save time)

(function () {
    // Small helper: format Date to YYYY-MM-DD
    function toISODate(d) {
        const dt = new Date(d);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Inject minimal styles for non-blocking reminder toast
    function ensureStyles() {
        if (document.getElementById('reminder-styles')) return;
        const style = document.createElement('style');
        style.id = 'reminder-styles';
        style.innerHTML = `
            .reminder-toast {
                position: fixed;
                top: 16px;
                right: 16px;
                min-width: 260px;
                max-width: 360px;
                background: #111827;
                color: #fff;
                padding: 10px 14px;
                border-radius: 10px;
                box-shadow: 0 6px 20px rgba(2,6,23,0.4);
                z-index: 99999;
                display: flex;
                gap: 10px;
                align-items: center;
                font-family: inherit;
                opacity: 0;
                transform: translateY(-8px);
                transition: opacity 220ms ease, transform 220ms ease;
            }
            .reminder-toast.show { opacity: 1; transform: translateY(0); }
            .reminder-toast .reminder-msg { flex: 1; font-size: 13px; line-height: 1.2; }
            .reminder-toast .reminder-actions { display:flex; gap:8px; }
            .reminder-toast button { background: transparent; border: 1px solid rgba(255,255,255,0.12); color: #fff; padding:6px 8px; border-radius:6px; cursor:pointer; font-weight:600; }
            .reminder-toast .reminder-close { background: none; border: none; color: rgba(255,255,255,0.7); font-size:16px; padding:4px; cursor:pointer; }
        `;
        document.head.appendChild(style);
    }

    // Create a non-blocking toast. Returns the element.
    function createToast(message, actionLabel, actionHref) {
        ensureStyles();
        const toast = document.createElement('div');
        toast.className = 'reminder-toast';

        const msg = document.createElement('div');
        msg.className = 'reminder-msg';
        msg.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'reminder-actions';

        if (actionLabel && actionHref) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = actionLabel;
            btn.addEventListener('click', () => {
                window.location.href = actionHref;
            });
            actions.appendChild(btn);
        }

        const close = document.createElement('button');
        close.className = 'reminder-close';
        close.innerHTML = '';
        close.title = 'Fermer';
        close.addEventListener('click', () => {
            removeToast(toast);
        });

        toast.appendChild(msg);
        toast.appendChild(actions);
        toast.appendChild(close);

        document.body.appendChild(toast);
        // show with animation
        requestAnimationFrame(() => toast.classList.add('show'));

        // auto-hide after 7s
        const timeout = setTimeout(() => removeToast(toast), 7000);
        toast._timeout = timeout;

        return toast;
    }

    function removeToast(el) {
        if (!el) return;
        clearTimeout(el._timeout);
        el.classList.remove('show');
        setTimeout(() => { try { el.remove(); } catch (e) {} }, 260);
    }

    // Return most recent transaction date (ISO yyyy-mm-dd) or null
    function getMostRecentTransactionDate() {
        try {
            const raw = localStorage.getItem('transactions');
            if (!raw) return null;
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr) || arr.length === 0) return null;

            // We expect transaction.date to be a string like 'YYYY-MM-DD' or similar.
            // Convert to Date and pick the most recent by comparing time.
            let latest = null;
            for (const t of arr) {
                if (!t || !t.date) continue;
                const d = new Date(t.date + 'T00:00:00');
                if (isNaN(d)) continue;
                if (!latest || d.getTime() > latest.getTime()) latest = d;
            }
            if (!latest) return null;
            return toISODate(latest);
        } catch (e) {
            return null;
        }
    }

    // Main exported function
    function checkTransactionReminder() {
        try {
            // Respect user's choice: default = false (do not notify)
            const enabled = localStorage.getItem('notificationsRappel');
            if (enabled !== 'true') return; // explicit opt-in required

            // Enforce one reminder per day
            const today = toISODate(new Date());
            const lastShown = localStorage.getItem('lastReminderDate');
            if (lastShown === today) return;

            const latestISO = getMostRecentTransactionDate();
            const now = new Date();
            const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let daysSince = Infinity;
            if (latestISO) {
                const parts = latestISO.split('-');
                const d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
                const diffMs = todayDate.getTime() - d.getTime();
                daysSince = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            }

            // Conditions:
            // - if no transaction today -> notify (daysSince >= 0 and not 0)
            // - if no transaction in last 7 days -> notify (daysSince >= 7) or no transactions at all
            // Prefer to show the "today" reminder if daysSince >=1 and <7, otherwise weekly message.

            if (latestISO === today) {
                // transaction today exists -> nothing to do
                return;
            }

            let message = null;
            if (latestISO === null || daysSince >= 7) {
                message = "Aucune transaction enregistrée depuis plus de 7 jours. Pensez à suivre vos dépenses.";
            } else if (daysSince >= 1) {
                message = "Aucune transaction enregistrée aujourd'hui. N'oubliez pas d'ajouter vos dépenses.";
            }

            if (message) {
                // Show non-blocking toast; action goes to transaction page
                createToast(message, 'Saisir', 'transaction.html');
                localStorage.setItem('lastReminderDate', today);
            }
        } catch (e) {
            // fail silently
            console.error('Reminder check failed', e);
        }
    }

    // Helper to toggle setting programmatically
    function setNotificationRappel(enabled) {
        try {
            if (enabled) localStorage.setItem('notificationsRappel', 'true');
            else localStorage.setItem('notificationsRappel', 'false');
        } catch (e) {}
    }

    // Expose public API
    window.checkTransactionReminder = checkTransactionReminder;
    window.setNotificationRappel = setNotificationRappel;

    // Run on load only if enabled (and script is loaded): non-intrusive
    document.addEventListener('DOMContentLoaded', function () {
        try {
            if (localStorage.getItem('notificationsRappel') === 'true') {
                // allow other scripts to finish first
                setTimeout(checkTransactionReminder, 400);
            }
        } catch (e) {}
    });
})();

// Budget Overrun Notification System
(function () {
    // Check if a budget is overrun and show notification if enabled
    function checkBudgetOverrun(categoryName) {
        try {
            const enabled = localStorage.getItem('budgetOverrunNotification');
            if (enabled !== 'true') return; // explicit opt-in required

            const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

            // Find budget matching the category
            const budget = budgets.find(b => b.category === categoryName);
            if (!budget) return;

            // Calculate total spent in this category
            const spent = transactions
                .filter(t => t.category === categoryName && t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            // Check if overrun
            if (spent > budget.amount) {
                // Only notify once per overrun (use sessionStorage flag)
                const flagKey = `budgetOverrun_${budget.id}`;
                if (sessionStorage.getItem(flagKey) === 'notified') {
                    return; // Already notified this session
                }

                const excess = (spent - budget.amount).toFixed(2);
                const currencySymbol = localStorage.getItem('appCurrency') || '€';
                
                // Show toast notification
                showBudgetOverrunToast(
                    `⚠️ Dépassement de budget: ${budget.name}`,
                    `Vous avez dépassé de ${excess} ${currencySymbol}`,
                    'budget.html'
                );

                // Set flag so we don't spam
                sessionStorage.setItem(flagKey, 'notified');

                // Show red indicator on Budget tab
                showBudgetIndicator();
            }
        } catch (e) {
            console.error('Budget overrun check failed', e);
        }
    }

    function showBudgetOverrunToast(title, message, href) {
        const toast = document.createElement('div');
        toast.style = `
            position: fixed;
            top: 16px;
            right: 16px;
            min-width: 280px;
            max-width: 380px;
            background: #1e293b;
            color: #fff;
            padding: 14px 16px;
            border-radius: 10px;
            box-shadow: 0 6px 20px rgba(2,6,23,0.4);
            z-index: 99999;
            display: flex;
            gap: 12px;
            align-items: flex-start;
            font-family: inherit;
            opacity: 0;
            transform: translateY(-8px);
            transition: opacity 220ms ease, transform 220ms ease;
            border-left: 4px solid #ef4444;
        `;

        const content = document.createElement('div');
        content.style = 'flex: 1;';
        content.innerHTML = `
            <div style="font-weight: 600; font-size: 13px; color: #ef4444;">${title}</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">${message}</div>
        `;

        const btnClose = document.createElement('button');
        btnClose.innerHTML = '✕';
        btnClose.style = `
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            line-height: 1;
        `;
        btnClose.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-8px)';
            setTimeout(() => toast.remove(), 220);
        });

        toast.appendChild(content);
        toast.appendChild(btnClose);
        document.body.appendChild(toast);

        // Show with animation
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Auto hide after 6s
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-8px)';
                setTimeout(() => toast.remove(), 220);
            }
        }, 6000);
    }

    function showBudgetIndicator() {
        // Find Budget link in sidebar and add a static red dot
        const budgetLink = document.querySelector('aside a[href="./budget.html"]');
        if (!budgetLink) return;

        // Remove old indicator if exists
        const oldIndicator = budgetLink.querySelector('.budget-alert-dot');
        if (oldIndicator) oldIndicator.remove();

        // Add red dot indicator (static, no animation)
        const dot = document.createElement('span');
        dot.className = 'budget-alert-dot';
        dot.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            top: 6px;
            right: 6px;
        `;

        // Ensure the link has relative positioning to anchor the dot correctly
        const computed = window.getComputedStyle(budgetLink).position;
        if (!computed || computed === 'static') budgetLink.style.position = 'relative';

        budgetLink.appendChild(dot);
    }

    // Expose public API
    window.checkBudgetOverrun = checkBudgetOverrun;

    // Update indicator on page load
    document.addEventListener('DOMContentLoaded', function () {
        try {
            if (localStorage.getItem('budgetOverrunNotification') === 'true') {
                // Check all budgets
                const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
                const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
                
                for (const budget of budgets) {
                    const spent = transactions
                        .filter(t => t.category === budget.category && t.type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
                    
                    if (spent > budget.amount) {
                        showBudgetIndicator();
                        break;
                    }
                }
            }
        } catch (e) {}
    });
})();
