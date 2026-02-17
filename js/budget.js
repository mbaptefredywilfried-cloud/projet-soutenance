class BudgetManager {
    constructor() {
        this.budgets = [];
        this.categories = [];
        // Les transactions doivent être récupérées depuis le backend si besoin
        this.transactions = [];
        this.budgetIdToDelete = null; 
        this.init();
    }

    async init() {
        await this.fetchCategories();
        this.setupEventListeners();
        this.populateCategorySelect();
        this.fetchAndRenderBudgets();
    }
    async fetchCategories() {
        try {
            const response = await fetch('php/categories/get_categories.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success' && Array.isArray(data.categories)) {
                this.categories = data.categories.filter(c => c.type === 'expense');
            } else {
                this.categories = [];
            }
        } catch (e) {
            this.categories = [];
        }
    }

    populateCategorySelect() {
        const select = document.getElementById('budgetCategory');
        if (!select) return;
        select.innerHTML = '<option value="">Sélectionnez une catégorie</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        const budgetForm = document.getElementById('budgetForm');
        budgetForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        const editForm = document.getElementById('editForm');
        editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));

        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());

        document.getElementById('cancelDelete').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.executeDelete());

        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.closeModal();
        });

        document.getElementById('filterBtn').addEventListener('click', () => {
            this.showNotification('Fonction de filtrage à implémenter', 'info');
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllBudgets());
    }

    openConfirmModal(message) {
        const modal = document.getElementById('confirmModal');
        if (message) modal.querySelector('p').textContent = message;
        modal.classList.add('show');
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').classList.remove('show');
        this.budgetIdToDelete = null;
    }

    executeDelete() {
        if (this.budgetIdToDelete === 'all') {
            this.budgets = [];
            this.showNotification('Tout a été supprimé', 'success');
        } else {
            this.budgets = this.budgets.filter(b => b.id !== this.budgetIdToDelete);
            this.showNotification('Budget supprimé', 'success');
        }
        this.saveBudgets();
        this.renderBudgets();
        this.updateSummary();
        this.closeConfirmModal();
    }



    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        if (!this.validateForm(form)) return;

        const formData = new FormData(form);
        const name = formData.get('budgetName').trim();
        const amount = parseFloat(formData.get('budgetAmount'));
        const categoryName = formData.get('budgetCategory');
        const period = formData.get('budgetPeriod');
        const month = this.getCurrentMonth();
        // Récupérer l'ID de la catégorie côté serveur
        const categoryId = await this.getCategoryIdByName(categoryName, 'expense');
        if (!categoryId) {
            this.showNotification('Catégorie invalide.', 'error');
            return;
        }
        try {
            const response = await fetch('php/budgets/set_budget.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ category_id: categoryId, amount, month })
            });
            const data = await response.json();
            if (data.status === 'success') {
                this.showNotification('Budget créé avec succès !', 'success');
                form.reset();
                await this.fetchAndRenderBudgets();
            } else {
                this.showNotification(data.message || 'Erreur lors de la création.', 'error');
            }
        } catch (err) {
            this.showNotification('Erreur réseau ou serveur.', 'error');
        }
    }

    async fetchAndRenderBudgets() {
        try {
            const response = await fetch('php/budgets/get_budgets.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success') {
                this.budgets = data.budgets;
                this.renderBudgets();
                this.updateSummary();
            } else {
                this.budgets = [];
                this.renderBudgets();
                this.updateSummary();
            }
        } catch (e) {
            this.budgets = [];
            this.renderBudgets();
            this.updateSummary();
        }
    }

    async getCategoryIdByName(name, type) {
        try {
            const response = await fetch('php/categories/get_categories.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success' && Array.isArray(data.categories)) {
                const found = data.categories.find(cat => cat.name === name && cat.type === type);
                return found ? found.id : null;
            }
        } catch (e) {}
        return null;
    }

    getCurrentMonth() {
        const now = new Date();
        return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, 'Ce champ est requis');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });
        const amount = form.querySelector('#budgetAmount');
        if (amount && amount.value && parseFloat(amount.value) <= 0) {
            this.showFieldError(amount, 'Le montant doit être positif');
            isValid = false;
        }
        return isValid;
    }

    showFieldError(input, message) {
        input.style.borderColor = '#ef4444';
        let errorEl = input.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('small');
            errorEl.className = 'field-error';
            errorEl.style.color = '#ef4444';
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    clearFieldError(input) {
        input.style.borderColor = '#e2e8f0';
        const errorEl = input.parentElement.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    }

    handleEditSubmit(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('editBudgetId').value);
        const name = document.getElementById('editBudgetName').value.trim();
        const amount = parseFloat(document.getElementById('editBudgetAmount').value);

        if (!name || amount <= 0) {
            this.showNotification('Veuillez saisir des valeurs valides', 'error');
            return;
        }

        const budget = this.budgets.find(b => b.id === id);
        if (budget) {
            budget.name = name;
            budget.amount = amount;
            this.saveBudgets();
            this.renderBudgets();
            this.updateSummary(); // Met à jour les compteurs après modification
            this.closeModal();
            this.showNotification('Budget modifié avec succès !', 'success');
        }
    }

    editBudget(id) {
        const budget = this.budgets.find(b => b.id === id);
        if (!budget) return;
        document.getElementById('editBudgetId').value = budget.id;
        document.getElementById('editBudgetName').value = budget.name;
        document.getElementById('editBudgetAmount').value = budget.amount;
        this.openModal();
    }

    deleteBudget(id) {
        this.budgetIdToDelete = id;
        this.openConfirmModal('Êtes-vous sûr de vouloir supprimer ce budget ?');
    }

    openModal() { document.getElementById('editModal').classList.add('show'); }
    closeModal() { document.getElementById('editModal').classList.remove('show'); }

    renderBudgets() {
        const container = document.getElementById('budgetsContainer');
        const noData = document.getElementById('noBudgetsMessage');
        if (this.budgets.length === 0) {
            container.innerHTML = '';
            noData.style.display = 'block';
            return;
        }
        noData.style.display = 'none';
        container.innerHTML = this.budgets.map(budget => this.createBudgetCard(budget)).join('');
    }

    createBudgetCard(budget) {
        // Récupérer la devise depuis le backend ou une variable globale
        const currencySymbol = window.appCurrency || '€';
        const spent = this.calculateSpent(budget);
        const rawRemaining = budget.amount - spent;
        const remaining = Math.max(0, rawRemaining); 
        const rawPercentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const displayPercentage = Math.min(100, rawPercentage);
        
        let progressBarColor = rawPercentage >= 100 ? '#ef4444' : (rawPercentage >= 80 ? '#f59e0b' : '#10b981');
        const categoryIcon = this.getCategoryIcon(budget.category);

        return `
            <article class="budget-card">
                <div class="card-header-solid" style="background-color: #2563eb;">
                    <div class="header-main">
                        <i class="${categoryIcon}"></i>
                        <h3>${this.escapeHtml(budget.name)}</h3>
                    </div>
                    <span class="badge-period">${budget.period}</span>
                </div>
                <div class="card-body">
                    <div class="stats-row">
                        <div class="stat-unit">
                            <span class="stat-label">Budgétisé</span>
                            <span class="stat-val">${budget.amount.toLocaleString()} ${currencySymbol}</span>
                        </div>
                        <div class="stat-unit">
                            <span class="stat-label">Dépensé</span>
                            <span class="stat-val">${spent.toLocaleString()} ${currencySymbol}</span>
                        </div>
                        <div class="stat-unit">
                            <span class="stat-label">Restant</span>
                            <span class="stat-val highlight" style="color: ${rawRemaining < 0 ? '#ef4444' : '#2563eb'}">
                                ${remaining.toLocaleString()} ${currencySymbol}
                            </span>
                        </div>
                    </div>
                    <div class="progress-area">
                        <div class="progress-labels">
                            <span>Utilisation</span>
                            <span style="color: ${progressBarColor}; font-weight: bold;">
                                ${displayPercentage.toFixed(1)}%
                            </span>
                        </div>
                        <div class="progress-track-bg">
                            <div class="progress-bar-inner" style="width: ${displayPercentage}%; background-color: ${progressBarColor}"></div>
                        </div>
                    </div>
                    <div class="card-btns">
                        <button class="btn-edit-green" onclick="budgetManager.editBudget(${budget.id})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-delete-red" onclick="budgetManager.deleteBudget(${budget.id})">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    calculateSpent(budget) {
        return this.transactions
            .filter(t => t.category === budget.category && t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    }

    getCategoryIcon(category) {
        const icons = {
            alimentation: 'fas fa-utensils', transport: 'fas fa-car',
            loisirs: 'fas fa-gamepad', sante: 'fas fa-heartbeat',
            logement: 'fas fa-home', education: 'fas fa-graduation-cap',
            autre: 'fas fa-ellipsis-h'
        };
        return icons[category] || 'fas fa-question';
    }

    // --- SECTION MISE À JOUR : CALCUL AUTO DES 6 COMPTEURS ---
    updateSummary() {
        // 1. Calculs des montants (Rangée 1)
        const totalBudgeted = this.budgets.reduce((sum, b) => sum + b.amount, 0);
        const totalSpent = this.budgets.reduce((sum, b) => sum + this.calculateSpent(b), 0);
        const balance = totalBudgeted - totalSpent;

        // 2. Calculs des statistiques (Rangée 2 - Cartes type photo)
        const totalBudgetsCount = this.budgets.length;
        const overspentBudgetsCount = this.budgets.filter(b => this.calculateSpent(b) > b.amount).length;
        const activeBudgetsCount = totalBudgetsCount - overspentBudgetsCount;

        // Mise à jour de l'affichage HTML - Rangée 1
        const elTotalBudgeted = document.getElementById('totalBudgeted');
        const elTotalSpent = document.getElementById('totalSpent');
        const elBalance = document.getElementById('balance');

        const currencySymbol = window.appCurrency || '€';
        if (elTotalBudgeted) elTotalBudgeted.textContent = `${totalBudgeted.toLocaleString()} ${currencySymbol}`;
        if (elTotalSpent) elTotalSpent.textContent = `${totalSpent.toLocaleString()} ${currencySymbol}`;
        if (elBalance) elBalance.textContent = `${balance.toLocaleString()} ${currencySymbol}`;

        // Mise à jour de l'affichage HTML - Rangée 2 (Compteurs)
        const elActiveCount = document.getElementById('activeBudgetsCount');
        const elOverspentCount = document.getElementById('overspentBudgetsCount');
        const elTotalCount = document.getElementById('totalBudgetsCount');

        if (elActiveCount) elActiveCount.textContent = activeBudgetsCount;
        if (elOverspentCount) elOverspentCount.textContent = overspentBudgetsCount;
        if (elTotalCount) elTotalCount.textContent = totalBudgetsCount;

        // Synchro avec LocalStorage
        // Synchronisation côté backend si besoin
        fetch('php/budget/set_budget.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                totalBudgeted: totalBudgeted,
                totalSpent: totalSpent
            })
        });
    }

    saveBudgets() {
        // Synchronisation côté backend
        fetch('php/budget/set_budget.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ budgets: this.budgets })
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const existingToast = document.querySelector('.custom-toast');
        if (existingToast) existingToast.remove();
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon-wrapper"><i class="fas fa-check"></i></div>
            <span class="toast-message">${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    clearAllBudgets() {
        this.budgetIdToDelete = 'all';
        this.openConfirmModal('Supprimer tous les budgets ?');
    }
}

const budgetManager = new BudgetManager();
window.budgetManager = budgetManager;