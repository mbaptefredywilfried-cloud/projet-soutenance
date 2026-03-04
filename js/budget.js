class BudgetManager {
    constructor() {
        this.budgets = [];
        this.categories = [];
        this.budgetIdToDelete = null;
        this.init();
    }

    async init() {
        await this.fetchCategories();
        this.setupEventListeners();
        this.populateCategorySelect();
        await this.fetchAndRenderBudgets();
    }

    async fetchCategories() {
        try {
            const response = await fetch('php/data/categories.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success' && Array.isArray(data.data)) {
                this.categories = data.data.filter(c => c.type === 'expense');
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
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) budgetForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // ...autres listeners inchangés...
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        if (!this.validateForm(form)) return;
        const formData = new FormData(form);
        const category_id = parseInt(formData.get('budgetCategory'), 10);
        const amount = parseFloat(formData.get('budgetAmount'));
        const month = formData.get('budgetPeriod');
        try {
            const response = await fetch('php/budgets/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ category_id, amount, month })
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
            const response = await fetch('php/budgets/list.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success') {
                this.budgets = data.data;
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

    // ...autres méthodes inchangées, sauf saveBudgets supprimée...
}

const budgetManager = new BudgetManager();
window.budgetManager = budgetManager;