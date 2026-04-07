

// ========== SYSTÈME DE RAPPELS DE TRANSACTIONS ==========
// Gère les rappels pour inciter l'utilisateur à ajouter des transactions

(function () {
    // Small helper: format Date to YYYY-MM-DD
    function toISODate(d) {
        const dt = new Date(d);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Return most recent transaction date (ISO yyyy-mm-dd) or null
    async function getMostRecentTransactionDate() {
        try {
            const response = await fetch('./php/transactions/list.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status !== 'success' || !Array.isArray(data.data) || data.data.length === 0) return null;
            let latest = null;
            for (const t of data.data) {
                if (!t || !t.transaction_date) continue;
                const d = new Date(t.transaction_date + 'T00:00:00');
                if (isNaN(d)) continue;
                if (!latest || d.getTime() > latest.getTime()) latest = d;
            }
            if (!latest) return null;
            return toISODate(latest);
        } catch (e) {
            return null;
        }
    }

    // Check reminders for transactions
    async function checkTransactionReminder() {
        try {
            const enabled = localStorage.getItem('notificationsRappel');
            if (enabled !== 'true') return;
            const today = toISODate(new Date());
            const lastShown = localStorage.getItem('lastReminderDate');
            if (lastShown === today) return;
            const latestISO = await getMostRecentTransactionDate();
            const now = new Date();
            const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let daysSince = Infinity;
            if (latestISO) {
                const parts = latestISO.split('-');
                const d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
                const diffMs = todayDate.getTime() - d.getTime();
                daysSince = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            }
            if (latestISO === today) return;
            
            // Récupérer la langue courante et les traductions
            const currentLang = localStorage.getItem('appLanguage') || 'fr';
            const t = window.translations?.[currentLang] || window.translations?.fr || {};
            
            let message = null;
            if (latestISO === null || daysSince >= 7) {
                message = t.notificationNoTransactionWeek || "Aucune transaction enregistrée depuis plus de 7 jours. Pensez à suivre vos dépenses.";
            } else if (daysSince >= 1) {
                message = t.notificationNoTransactionToday || "Aucune transaction enregistrée aujourd'hui. N'oubliez pas d'ajouter vos dépenses.";
            }
            if (message) {
                const buttonLabel = t.notificationTransactionButton || 'Saisir';
                createToast(message, buttonLabel, 'transaction.html');
                localStorage.setItem('lastReminderDate', today);
            }
        } catch (e) {
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

    // Run on load only if enabled
    document.addEventListener('DOMContentLoaded', function () {
        try {
            if (localStorage.getItem('notificationsRappel') === 'true') {
                setTimeout(checkTransactionReminder, 400);
            }
        } catch (e) {}
    });
})();

// ========== SYSTÈME DE BUDGET DÉPASSEMENT DÉSACTIVÉ ==========
// Les notifications de budget sont maintenant créées côté serveur
// et affichées dans le système de notifications principal

(function () {
    // Garde seulement un système passif pour afficher l'indicateur rouge
    // mais sans créer de toast (les notifications viennent du serveur)
    
    function showBudgetIndicator(color = '#ef4444') {
        // Find Budget link in sidebar and add a static red dot
        const budgetLink = document.querySelector('aside a[href="./budget.html"]');
        if (!budgetLink) return;

        // Remove old indicator if exists
        const oldIndicator = budgetLink.querySelector('.budget-alert-dot');
        if (oldIndicator) oldIndicator.remove();

        // Add dot indicator with specified color
        const dot = document.createElement('span');
        dot.className = 'budget-alert-dot';
        dot.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 50%;
            top: 6px;
            right: 6px;
        `;

        // Ensure the link has relative positioning to anchor the dot correctly
        const computed = window.getComputedStyle(budgetLink).position;
        if (!computed || computed === 'static') budgetLink.style.position = 'relative';

        budgetLink.appendChild(dot);
    }

    function removeBudgetIndicator() {
        const budgetLink = document.querySelector('aside a[href="./budget.html"]');
        if (!budgetLink) return;
        const oldIndicator = budgetLink.querySelector('.budget-alert-dot');
        if (oldIndicator) oldIndicator.remove();
    }

    // Fonction principale pour vérifier et mettre à jour le statut du budget
    async function checkAndUpdateBudgetStatus() {
        try {
            const response = await fetch('./php/budgets/check_status.php');
            const data = await response.json();
            if (data.status === 'success') {
                if (data.budget_status === 'error') {
                    // Point rouge pour budget dépassé
                    showBudgetIndicator('#ef4444');
                } else if (data.budget_status === 'warning') {
                    // Point jaune pour budget presque atteint (80%+)
                    showBudgetIndicator('#f59e0b');
                } else {
                    // Aucun indicateur si tout va bien
                    removeBudgetIndicator();
                }
            }
        } catch (e) {
            console.log('Budget status check error:', e);
        }
    }

    // Expose public API
    window.checkBudgetOverrun = function() {};
    window.checkAndUpdateBudgetStatus = checkAndUpdateBudgetStatus;

    // Update indicator on page load based on actual budget status
    document.addEventListener('DOMContentLoaded', function () {
        try {
            checkAndUpdateBudgetStatus();
        } catch (e) {}
    });
})();

