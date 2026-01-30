class BudgetManager {
    constructor() {
        this.budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]'); 
        this.budgetIdToDelete = null; // Variable pour stocker l'ID en attente
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderBudgets();
        this.updateSummary();
        this.setActiveNavLink();
    }

    setupEventListeners() {
        const budgetForm = document.getElementById('budgetForm');
        budgetForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        const editForm = document.getElementById('editForm');
        editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));

        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());

        // Fermeture du pop-up de confirmation
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.executeDelete());

        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.closeModal();
        });

        this.setupNavigation();

        // Remplacement de l'alert par une notification
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.showNotification('Fonction de filtrage à implémenter', 'info');
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllBudgets());
    }

    // --- NOUVELLES MÉTHODES POUR LE POP-UP ---
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
    // ------------------------------------------

    setupNavigation() {
        const links = document.querySelectorAll('aside .nav a');
        links.forEach((link, i) => {
            if (!link.dataset.id) link.dataset.id = i;
            link.addEventListener('click', function(e) {
                links.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                localStorage.setItem('activeSidebarLink', this.dataset.id);
            });
        });
    }

    setActiveNavLink() {
        const saved = localStorage.getItem('activeSidebarLink');
        if (saved) {
            const el = document.querySelector(`aside .nav a[data-id="${saved}"]`);
            if (el) el.classList.add('active');
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        if (!this.validateForm(form)) return;

        const formData = new FormData(form);
        const budget = {
            id: Date.now(),
            name: formData.get('budgetName').trim(),
            amount: parseFloat(formData.get('budgetAmount')),
            category: formData.get('budgetCategory'),
            period: formData.get('budgetPeriod'),
            spent: 0,
            createdAt: new Date().toISOString()
        };

        this.budgets.push(budget);
        this.saveBudgets();
        this.renderBudgets();
        this.updateSummary();
        form.reset();
        this.showNotification('Budget créé avec succès !', 'success');
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
        input.style.borderColor = 'var(--danger-color, #ef4444)';
        let errorEl = input.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('small');
            errorEl.className = 'field-error';
            errorEl.style.color = 'var(--danger-color, #ef4444)';
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    clearFieldError(input) {
        input.style.borderColor = 'var(--border-color, #e2e8f0)';
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
            this.updateSummary();
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

    openModal() {
        document.getElementById('editModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('show');
    }

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
        const spent = this.calculateSpent(budget);
        
        // MODIFICATION : Le montant restant ne peut pas descendre en dessous de 0
        const rawRemaining = budget.amount - spent;
        const remaining = Math.max(0, rawRemaining); 
        
        // MODIFICATION : Le pourcentage affiché ne dépasse pas 100%
        const rawPercentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const displayPercentage = Math.min(100, rawPercentage);
        
        let progressBarColor;
        if (rawPercentage >= 100) {
            progressBarColor = '#ef4444'; // Rouge si dépassé
        } else if (rawPercentage >= 80) {
            progressBarColor = '#f59e0b'; // Orange
        } else {
            progressBarColor = '#10b981'; // Vert
        }

        const headerBlue = '#2563eb'; 
        const categoryIcon = this.getCategoryIcon(budget.category);

        return `
            <article class="budget-card">
                <div class="card-header-solid" style="background-color: ${headerBlue};">
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
                            <span class="stat-val">${budget.amount.toLocaleString()} €</span>
                        </div>
                        <div class="stat-unit">
                            <span class="stat-label">Dépensé</span>
                            <span class="stat-val">${spent.toLocaleString()} €</span>
                        </div>
                        <div class="stat-unit">
                            <span class="stat-label">Restant</span>
                            <span class="stat-val highlight" style="color: ${rawRemaining < 0 ? '#ef4444' : '#2563eb'}">
                                ${remaining.toLocaleString()} €
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
            .filter(t => t.category === budget.category)
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    }

    getCategoryIcon(category) {
        const icons = {
            alimentation: 'fas fa-utensils',
            transport: 'fas fa-car',
            loisirs: 'fas fa-gamepad',
            sante: 'fas fa-heartbeat',
            logement: 'fas fa-home',
            education: 'fas fa-graduation-cap',
            autre: 'fas fa-ellipsis-h'
        };
        return icons[category] || 'fas fa-question';
    }

    updateSummary() {
        const totalBudgeted = this.budgets.reduce((sum, b) => sum + b.amount, 0);
        const totalSpent = this.budgets.reduce((sum, b) => sum + this.calculateSpent(b), 0);
        const balance = totalBudgeted - totalSpent;

        document.getElementById('totalBudgeted').textContent = `${totalBudgeted.toFixed(2)} €`;
        document.getElementById('totalSpent').textContent = `${totalSpent.toFixed(2)} €`;
        document.getElementById('balance').textContent = `${balance.toFixed(2)} €`;

        localStorage.setItem('userBudgetInitial', totalBudgeted.toFixed(2));
        localStorage.setItem('userTotalSpent', totalSpent.toFixed(2));
    }

    saveBudgets() {
        localStorage.setItem('budgets', JSON.stringify(this.budgets));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // SECTION MODIFIÉE : Animation identique au profil
    showNotification(message, type = 'success') {
    // Supprime l'ancienne notification si elle existe encore
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    // Structure HTML pour correspondre à ton image (cercle blanc + coche)
    toast.innerHTML = `
        <div class="toast-icon-wrapper">
            <i class="fas fa-check"></i>
        </div>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Animation de sortie après 3 secondes
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