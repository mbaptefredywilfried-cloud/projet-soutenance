class BudgetManager {
                async handleEditFormSubmit(e) {
                    e.preventDefault();
                    const form = e.target;
                    // Validation
                    const name = form.querySelector('#editBudgetName').value;
                    const amount = parseFloat(form.querySelector('#editBudgetAmount').value);
                    const category_id = parseInt(form.querySelector('#editBudgetCategory').value, 10);
                    const month = form.querySelector('#editBudgetPeriod').value;
                    const id = form.querySelector('#editBudgetId').value;
                    if (!name || isNaN(amount) || !category_id || !month || !id) {
                        // Affiche une erreur simple
                        const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                        showToast(t.fillAllFields || 'Veuillez remplir tous les champs.', true);
                        return;
                    }
                    try {
                        const response = await fetch('php/budgets/save.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'same-origin',
                            body: JSON.stringify({ id, name, amount, category_id, month })
                        });
                        const data = await response.json();
                        if (data.status === 'success') {
                            const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                            showToast(t.budgetCreatedSuccess || 'Budget modifié avec succès !');
                            document.getElementById('editModal').classList.remove('show');
                            await this.fetchAndRenderBudgets();
                        } else {
                            showToast(data.message || 'Erreur lors de la modification.', true);
                        }
                    } catch (err) {
                        const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                        showToast(t.networkError || 'Erreur réseau ou serveur.', true);
                    }
                }
            updateSummary() {
                // Récupération des éléments
                const totalBudgetedEl = document.getElementById('totalBudgeted');
                const totalSpentEl = document.getElementById('totalSpent');
                const balanceEl = document.getElementById('balance');
                const activeBudgetsCountEl = document.getElementById('activeBudgetsCount');
                const overspentBudgetsCountEl = document.getElementById('overspentBudgetsCount');
                const totalBudgetsCountEl = document.getElementById('totalBudgetsCount');

                let totalBudgeted = 0;
                let totalSpent = 0;
                let overspentCount = 0;
                let activeCount = 0;
                let totalCount = 0;

                if (this.budgets && this.budgets.length > 0) {
                    totalCount = this.budgets.length;
                    this.budgets.forEach(budget => {
                        totalBudgeted += Number(budget.amount);
                        // Dépenses pour ce budget
                        const spent = this.calculateSpentForBudget(budget, this.transactions);
                        totalSpent += spent;
                        if (spent > Number(budget.amount)) overspentCount++;
                        if (spent < Number(budget.amount)) activeCount++;
                    });
                }
                const balance = totalBudgeted - totalSpent;
                const currency = window.appCurrency || 'EUR';
                if (totalBudgetedEl) totalBudgetedEl.textContent = totalBudgeted.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ' + currency;
                if (totalSpentEl) totalSpentEl.textContent = totalSpent.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ' + currency;
                if (balanceEl) balanceEl.textContent = balance.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ' + currency;
                if (activeBudgetsCountEl) activeBudgetsCountEl.textContent = activeCount;
                if (overspentBudgetsCountEl) overspentBudgetsCountEl.textContent = overspentCount;
                if (totalBudgetsCountEl) totalBudgetsCountEl.textContent = totalCount;
            }
        // Validation simple du formulaire budget
        validateForm(form) {
            let valid = true;
            // Réinitialiser les erreurs
            const fields = [
                {name: 'budgetName', message: 'Veuillez entrer un nom de budget.'},
                {name: 'budgetCategory', message: 'Veuillez sélectionner une catégorie.'},
                {name: 'budgetAmount', message: 'Veuillez entrer un montant valide.'},
                {name: 'budgetPeriod', message: 'Veuillez choisir une période.'}
            ];
            fields.forEach(f => {
                const input = form.querySelector(`[name="${f.name}"]`);
                if (input) {
                    input.classList.remove('input-error');
                    let error = input.parentNode.querySelector('.error-message');
                    if (error) error.remove();
                }
            });

            // Vérification des champs
            const name = form.querySelector('[name="budgetName"]');
            const category = form.querySelector('[name="budgetCategory"]');
            const amount = form.querySelector('[name="budgetAmount"]');
            const period = form.querySelector('[name="budgetPeriod"]');
            const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
            
            if (!name.value || name.value.trim().length < 2) {
                valid = false;
                name.classList.add('input-error');
                BudgetManager.showFieldError(name, t.errorBudgetName || 'Veuillez entrer un nom de budget.');
            }
            if (!category.value) {
                valid = false;
                category.classList.add('input-error');
                BudgetManager.showFieldError(category, t.errorSelectCategory || 'Veuillez sélectionner une catégorie.');
            }
            if (isNaN(parseFloat(amount.value)) || parseFloat(amount.value) <= 0) {
                valid = false;
                amount.classList.add('input-error');
                BudgetManager.showFieldError(amount, t.errorBudgetAmount || 'Veuillez entrer un montant valide.');
            }
            if (!period.value) {
                valid = false;
                period.classList.add('input-error');
                BudgetManager.showFieldError(period, t.errorSelectPeriod || 'Veuillez choisir une période.');
            }
            return valid;
        }

        static showFieldError(input, message) {
            let error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = message;
            error.style.color = '#ef4444';
            error.style.fontSize = '0.85em';
            error.style.marginTop = '4px';
            error.style.fontWeight = '500';
            input.parentNode.appendChild(error);
        }
    constructor() {
        this.budgets = [];
        this.categories = [];
        this.budgetIdToDelete = null;
        this.activeFilters = {
            period: '',
            category: '',
            status: ''
        };
        this.init();
    }

    // Calcule les dépenses pour un budget selon sa période
    calculateSpentForBudget(budget, transactions) {
        if (!transactions || transactions.length === 0) return 0;
        
        const currentDate = new Date();
        const currentMonth = currentDate.toISOString().slice(0, 7); // "2026-03"
        const currentYear = currentDate.getFullYear().toString();
        
        // Déterminer le type de période du budget
        const budgetMonth = String(budget.month).toLowerCase();
        
        let relevantTransactions = transactions.filter(t => 
            t.category_id == budget.category_id && t.category_type === 'expense'
        );
        
        // Filtrer selon la période
        if (budgetMonth.includes('mensuel') || budgetMonth === 'mois') {
            // Dépenses du mois courant
            relevantTransactions = relevantTransactions.filter(t => 
                t.date && t.date.slice(0, 7) === currentMonth
            );
        } else if (budgetMonth.includes('annuel') || budgetMonth === 'an' || budgetMonth === 'année') {
            // Dépenses de l'année courante
            relevantTransactions = relevantTransactions.filter(t => 
                t.date && t.date.slice(0, 4) === currentYear
            );
        } else if (budgetMonth.includes('hebdo') || budgetMonth === 'semaine') {
            // Dépenses de la semaine courante
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - currentDate.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            relevantTransactions = relevantTransactions.filter(t => {
                if (!t.date) return false;
                const tDate = new Date(t.date);
                return tDate >= weekStart && tDate <= weekEnd;
            });
        }
        
        return relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    }

    async init() {
        await this.fetchCategories();
        this.setupEventListeners();
        this.setupDeleteModalListeners();
        this.populateCategorySelect();
        this.populateFilterCategory();
        this.setupFilterListeners();
        await this.fetchAndRenderBudgets();
        // Écouter les changements de devise
        window.addEventListener('appCurrencyChanged', () => {
            this.renderBudgets();
            this.updateSummary();
        });
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
        let currentLang = document.documentElement.lang || 'fr';
        select.innerHTML = '<option value="">' + (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].selectCategory ? translations[currentLang].selectCategory : 'Sélectionnez une catégorie') + '</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            // Utilise la clé de traduction si disponible
            if (cat.translation_key && typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang][cat.translation_key]) {
                option.textContent = translations[currentLang][cat.translation_key];
            } else {
                option.textContent = cat.name;
            }
            select.appendChild(option);
        });
        setBudgetFormPlaceholders(); // Pour la traduction dynamique
    }

    populateFilterCategory() {
        const filterSelect = document.getElementById('filterCategory');
        if (!filterSelect) return;
        let currentLang = document.documentElement.lang || 'fr';
        filterSelect.innerHTML = '<option value="">' + (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].category ? translations[currentLang].category : 'Catégorie') + '</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            if (cat.translation_key && typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang][cat.translation_key]) {
                option.textContent = translations[currentLang][cat.translation_key];
            } else {
                option.textContent = cat.name;
            }
            filterSelect.appendChild(option);
        });
        setBudgetFormPlaceholders(); // Pour la traduction dynamique
    }

    setupFilterListeners() {
        const periodSelect = document.getElementById('filterPeriod');
        const categorySelect = document.getElementById('filterCategory');
        const statusSelect = document.getElementById('filterStatus');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this.activeFilters.period = periodSelect.value;
                this.renderBudgets();
            });
        }
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this.activeFilters.category = categorySelect.value;
                this.renderBudgets();
            });
        }
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                this.activeFilters.status = statusSelect.value;
                this.renderBudgets();
            });
        }
    }

    setupEventListeners() {
                // Gestion du formulaire d'édition
                const editForm = document.getElementById('editForm');
                if (editForm) {
                    editForm.addEventListener('submit', (e) => this.handleEditFormSubmit(e));
                }
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) budgetForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                const modal = document.getElementById('confirmAllModal');
                if (modal) {
                    modal.style.display = 'flex';
                }
            });
        }

        // Gestion du modal de confirmation
        const cancelAllDelete = document.getElementById('cancelAllDelete');
        if (cancelAllDelete) {
            cancelAllDelete.addEventListener('click', () => {
                const modal = document.getElementById('confirmAllModal');
                if (modal) modal.style.display = 'none';
            });
        }
        const confirmAllDelete = document.getElementById('confirmAllDelete');
        if (confirmAllDelete) {
            confirmAllDelete.addEventListener('click', async () => {
                const modal = document.getElementById('confirmAllModal');
                if (modal) modal.style.display = 'none';
                try {
                    const response = await fetch('php/budgets/delete_all.php', {
                        method: 'POST',
                        credentials: 'same-origin'
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                        showToast(t.allBudgetsDeleted || 'Tous les budgets ont été supprimés.');
                        await this.fetchAndRenderBudgets();
                    } else {
                        showToast(data.message || 'Erreur lors de la suppression.', true);
                    }
                } catch (err) {
                    const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                    showToast(t.networkError || 'Erreur réseau ou serveur.', true);
                }
            });
        }

        // Toast glissant en bas
        function showToast(message, error=false) {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            toast.className = 'toast-custom';
            toast.innerHTML = `
                <div class="toast-icon" style="background:white; color:${error ? '#ef4444' : '#10b981'}; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas ${error ? 'fa-times' : 'fa-check'}" style="font-size:12px;"></i>
                </div>
                <div class="toast-message">${message}</div>
            `;
            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }
    }

    setupDeleteModalListeners() {
        // Initialiser les écouteurs du modal de suppression une seule fois
        const confirmModal = document.getElementById('confirmModal');
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        const confirmDeleteBtn = document.getElementById('confirmDelete');

        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                if (confirmModal) confirmModal.style.display = 'none';
                this.budgetIdToDelete = null;
            });
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                if (!this.budgetIdToDelete) return;
                if (confirmModal) confirmModal.style.display = 'none';
                try {
                    const response = await fetch('php/budgets/delete.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ id: this.budgetIdToDelete })
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                        showToast(t.budgetDeleted || 'Budget supprimé avec succès !');
                        await this.fetchAndRenderBudgets();
                    } else {
                        showToast(data.message || 'Erreur lors de la suppression.', true);
                    }
                } catch (err) {
                    const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                    showToast(t.networkError || 'Erreur réseau ou serveur.', true);
                }
                this.budgetIdToDelete = null;
            });
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        if (!this.validateForm(form)) return;
        const formData = new FormData(form);
        const category_id = parseInt(formData.get('budgetCategory'), 10);
        const amount = parseFloat(formData.get('budgetAmount'));
        const month = formData.get('budgetPeriod');
        const name = formData.get('budgetName');
        try {
            const response = await fetch('php/budgets/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ category_id, amount, month, name })
            });
            const data = await response.json();
            if (data.status === 'success') {
                const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                showToast(t.budgetCreatedSuccess || 'Budget créé avec succès !');
                form.reset();
                await this.fetchAndRenderBudgets();
            } else {
                showToast(data.message || 'Erreur lors de la création.', true);
            }
        } catch (err) {
            const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
            this.showNotification(t.networkError || 'Erreur réseau ou serveur.', 'error');
        }
    }

    async fetchAndRenderBudgets() {
        try {
            const response = await fetch('php/budgets/list.php', { credentials: 'same-origin' });
            const data = await response.json();
            console.log('Réponse budgets/list.php:', data); // LOG DEBUG
            if (data.status === 'success') {
                this.budgets = data.data;
            } else {
                this.budgets = [];
            }
            // Récupérer toutes les transactions pour calculer le montant dépensé par budget
            let transactions = [];
            try {
                const response = await fetch('php/transactions/list.php', { credentials: 'same-origin' });
                const data = await response.json();
                if (data.status === 'success' && Array.isArray(data.data)) {
                    transactions = data.data;
                }
            } catch (e) {}
            this.transactions = transactions;
            this.renderBudgets();
            this.updateSummary();
        } catch (e) {
            this.budgets = [];
            this.transactions = [];
            this.renderBudgets();
            this.updateSummary();
        }
    }

    // Affiche les budgets dans le DOM avec la devise utilisateur et une carte riche
    async renderBudgets() {
        const container = document.getElementById('budgetsContainer');
        if (container) {
            container.style.fontFamily = 'Inter, Arial, sans-serif';
        }
        const currency = window.appCurrency || 'XAF';
        if (!container) return;
        container.innerHTML = '';

        // Filtrage dynamique : si aucun filtre sélectionné, afficher tous les budgets
        let filteredBudgets = this.budgets;
        const { period, category, status } = this.activeFilters;
        const hasFilter = period || category || status;
        if (hasFilter) {
            if (period) {
                const filterPeriod = String(period).trim().toLowerCase();
                
                filteredBudgets = filteredBudgets.filter(b => {
                    const budgetPeriod = String(b.month).trim().toLowerCase();
                    const periodMap = {
                        'mensuel': ['mensuel', 'mois'],
                        'hebdomadaire': ['hebdomadaire', 'hebdo', 'hebdoma', 'semaine'],
                        'annuel': ['annuel', 'an', 'année']
                    };
                    if (periodMap[filterPeriod]) {
                        return periodMap[filterPeriod].includes(budgetPeriod);
                    }
                    return budgetPeriod === filterPeriod;
                });
            }
            if (category) {
                filteredBudgets = filteredBudgets.filter(b => String(b.category_id) === String(category));
            }
            if (status) {
                // Calcul du statut
                filteredBudgets = filteredBudgets.filter(b => {
                    // Calcul du montant dépensé
                    const spent = this.calculateSpentForBudget(b, this.transactions);
                    if (status === 'actif') {
                        return spent < Number(b.amount);
                    } else if (status === 'dépassé') {
                        return spent >= Number(b.amount);
                    }
                    return true;
                });
            }
        }

        if (!filteredBudgets || filteredBudgets.length === 0) {
            document.getElementById('noBudgetsMessage').style.display = 'block';
            const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
            document.getElementById('noBudgetsMessage').innerHTML = '<i class="fas fa-inbox"></i><p>' + (t.noBudgetFilters || 'Aucun budget trouvé pour ces filtres.') + '</p>';
            return;
        } else {
            document.getElementById('noBudgetsMessage').style.display = 'none';
        }

        // Récupérer toutes les transactions pour calculer le montant dépensé par budget
        let transactions = [];
        try {
            const response = await fetch('php/transactions/list.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success' && Array.isArray(data.data)) {
                transactions = data.data;
            }
        } catch (e) {}

        // Map d'icônes par catégorie (reprend la logique de transaction.js)
        const iconMap = {
            'Alimentation': {icon: 'fas fa-utensils', color: '#fff', bg: '#00B894'},
            'Transport': {icon: 'fas fa-gas-pump', color: '#fff', bg: '#0984E3'},
            'Loisirs': {icon: 'fas fa-gamepad', color: '#fff', bg: '#E84393'},
            'Logement': {icon: 'fas fa-home', color: '#fff', bg: '#6C5CE7'},
            'Santé': {icon: 'fas fa-heartbeat', color: '#fff', bg: '#D63031'},
            'Éducation': {icon: 'fas fa-graduation-cap', color: '#fff', bg: '#d1fae5'},
            'Salaire': {icon: 'fas fa-wallet', color: '#fff', bg: '#d1fae5'},
            'Prime': {icon: 'fas fa-gift', color: '#fff', bg: '#cffafe'},
            'Activité secondaire': {icon: 'fas fa-briefcase', color: '#fff', bg: '#16A085'},
            'Business': {icon: 'fas fa-store', color: '#fff', bg: '#1ABC9C'},
            'Bourse': {icon: 'fas fa-hand-holding-dollar', color: '#fff', bg: '#2980B9'},
            'Aide familiale': {icon: 'fas fa-people-roof', color: '#fff', bg: '#8E44AD'},
            'Investissements': {icon: 'fas fa-chart-line', color: '#fff', bg: '#2ECC71'},
            'Ventes': {icon: 'fas fa-cart-shopping', color: '#fff', bg: '#F39C12'},
            'Remboursements': {icon: 'fas fa-rotate-left', color: '#fff', bg: '#3498DB'},
            'Gains exceptionnels': {icon: 'fas fa-coins', color: '#fff', bg: '#F1C40F'},
            'Autres revenus': {icon: 'fas fa-plus', color: '#fff', bg: '#7F8C8D'},
            'Vêtements': {icon: 'fas fa-shirt', color: '#fff', bg: '#FDCB6E'},
            'Communication': {icon: 'fas fa-mobile-screen', color: '#fff', bg: '#00CEC9'},
            'Finance': {icon: 'fas fa-credit-card', color: '#fff', bg: '#636E72'},
            'Assurances': {icon: 'fas fa-shield-halved', color: '#fff', bg: '#2D3436'},
            'Impôts': {icon: 'fas fa-file-invoice-dollar', color: '#fff', bg: '#B71540'},
            'Abonnements': {icon: 'fas fa-rotate-right', color: '#fff', bg: '#6AB04C'},
            'Cadeaux': {icon: 'fas fa-gift', color: '#fff', bg: '#FF7675'},
            'Divers': {icon: 'fas fa-ellipsis', color: '#fff', bg: '#95A5A6'},
            'Autre': {icon: 'fas fa-ellipsis-h', color: '#fff', bg: '#a3a3a3'}
        };

        const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
        filteredBudgets.forEach(budget => {
            // Calcul du montant dépensé pour ce budget (transactions de même catégorie et même période)
            const spent = this.calculateSpentForBudget(budget, transactions);
            const percent = Math.min(100, budget.amount > 0 ? (spent / budget.amount) * 100 : 0);
            // Traduction catégorie
            let cat = budget.category_name || (t.other || 'Autre');
            if (this.categories && this.categories.length > 0) {
                const foundCat = this.categories.find(c => c.id == budget.category_id);
                if (foundCat && foundCat.translation_key && t[foundCat.translation_key]) {
                    cat = t[foundCat.translation_key];
                }
            }
            const iconData = iconMap[budget.category_name] || iconMap['Autre'];
            const budgetName = budget.name || '';

            // Couleur de la barre selon le pourcentage
            let barColor = '#10b981'; // vert
            if (percent >= 90) {
                barColor = '#ef4444'; // rouge
            } else if (percent >= 70) {
                barColor = '#f59e0b'; // orange
            }

            // Affichage du reste ou du dépassement
            let bottomLabel = '';
            if (spent > budget.amount) {
                bottomLabel = `<span style="color:#ef4444;font-weight:600">${t.exceededBudgets || 'Dépassé'}</span>`;
            } else {
                bottomLabel = `<span>${Number(budget.amount - spent).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency} ${(t.remaining || 'restants')}</span>`;
            }

            const budgetDiv = document.createElement('div');
            budgetDiv.className = 'budget-card';
            budgetDiv.innerHTML = `
                <div class="budget-header">
                    <div class="budget-icon" style="background:#111;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:10px;">
                        <i class="${iconData.icon}" style="color:${iconData.color};font-size:1.5rem;"></i>
                    </div>
                    <div style="margin-left:12px;flex:1;">
                        <h3 style="margin:0;font-size:1.1rem;">${budgetName}</h3>
                        <div style="font-size:0.95em;color:#a3bffa;">${cat}</div>
                    </div>
                    <span class="budget-period">${(() => {
                        if (!budget.month) return '';
                        let key = budget.month.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
                        // Fallback explicite pour les valeurs typiques
                        const periodMap = {
                            'mensuel': t.monthly,
                            'annuel': t.yearly,
                            'hebdomadaire': t.weekly,
                            'hebdoma': t.weekly
                        };
                        if (periodMap[key]) return periodMap[key];
                        return t[key] || t[budget.month] || budget.month;
                    })()}</span>
                </div>
                <div class="budget-content">
                    <div class="budget-details">
                        <div class="detail-item">
                            <div class="label">${t.totalBudgeted || 'Montant budgétisé'}</div>
                            <div class="value">${Number(budget.amount).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">${t.totalSpent || 'Dépensé'}</div>
                            <div class="value" style="color:${percent >= 100 ? '#ef4444' : '#1e293b'};">${Number(spent).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency}</div>
                        </div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>${percent.toFixed(0)}% ${(t.used || 'utilisé')}</span>
                            ${bottomLabel}
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${percent}%;background:${barColor};"></div>
                        </div>
                    </div>
                    <div class="budget-actions">
                        <button class="btn-edit" title="${t.editButtonLabel || 'Modifier'}" data-budget-id="${budget.id}"><i class="fas fa-pen"></i> <span>${t.editButtonLabel || 'Modifier'}</span></button>
                        <button class="btn-delete" title="${t.deleteButtonLabel || 'Supprimer'}" onclick="window.budgetManager.deleteBudget && window.budgetManager.deleteBudget(${budget.id})"><i class="fas fa-trash"></i> <span>${t.deleteButtonLabel || 'Supprimer'}</span></button>
                    </div>
                </div>
            `;
            container.appendChild(budgetDiv);

                // Ajout listener pour le bouton Modifier
                const editBtn = budgetDiv.querySelector('.btn-edit');
                if (editBtn) {
                    editBtn.addEventListener('click', () => {
                        const modal = document.getElementById('editModal');
                        if (modal) modal.classList.add('show');
                        document.getElementById('editBudgetId').value = budget.id;
                        document.getElementById('editBudgetName').value = budget.name;
                        document.getElementById('editBudgetAmount').value = budget.amount;

                        // Remplir le select catégorie
                        const catSelect = document.getElementById('editBudgetCategory');
                        if (catSelect) {
                            const t = (typeof translations !== 'undefined' && translations[document.documentElement.lang]) ? translations[document.documentElement.lang] : {};
                            catSelect.innerHTML = `<option value="">${t.selectCategory || 'Sélectionnez une catégorie'}</option>`;
                            this.categories.forEach(cat => {
                                const option = document.createElement('option');
                                option.value = cat.id;
                                // Utilise la clé de traduction si disponible
                                if (cat.translation_key && t[cat.translation_key]) {
                                    option.textContent = t[cat.translation_key];
                                } else {
                                    option.textContent = cat.name;
                                }
                                if (cat.id == budget.category_id) option.selected = true;
                                catSelect.appendChild(option);
                            });
                        }
                        // Remplir le select période
                        const periodSelect = document.getElementById('editBudgetPeriod');
                        if (periodSelect) {
                            periodSelect.value = budget.month || 'mensuel';
                        }
                    });
                }

                // Ajout listener pour le bouton Supprimer
                const deleteBtn = budgetDiv.querySelector('.btn-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        // Affiche le popup de confirmation
                        const confirmModal = document.getElementById('confirmModal');
                        if (confirmModal) {
                            confirmModal.style.display = 'flex';
                            // Stocke l'id du budget à supprimer
                            this.budgetIdToDelete = budget.id;
                        }
                    });
                }
                // Fermeture du modal d'édition
                const closeEditModal = document.getElementById('closeModal');
                if (closeEditModal) {
                    closeEditModal.addEventListener('click', () => {
                        const modal = document.getElementById('editModal');
                        if (modal) modal.classList.remove('show');
                    });
                }
                const cancelEditBtn = document.getElementById('cancelEdit');
                if (cancelEditBtn) {
                    cancelEditBtn.addEventListener('click', () => {
                        const modal = document.getElementById('editModal');
                        if (modal) modal.classList.remove('show');
                    });
                }
        });
    }
}

const budgetManager = new BudgetManager();
window.budgetManager = budgetManager;

// Remplit dynamiquement les placeholders et options du formulaire budget selon la langue
function setBudgetFormPlaceholders() {
    const currentLang = document.documentElement.lang || 'fr';
    const t = (typeof translations !== 'undefined' && translations[currentLang]) ? translations[currentLang] : {};
    // Champ nom du budget
    const nameInput = document.getElementById('budgetName');
    if (nameInput) nameInput.placeholder = t.phBudgetExample || 'Ex: Courses alimentaires';
    // Champ montant
    const amountInput = document.getElementById('budgetAmount');
    if (amountInput) amountInput.placeholder = t.phAmountZero || '0.00';
    // Select catégorie (option vide)
    const catSelect = document.getElementById('budgetCategory');
    if (catSelect && catSelect.options.length > 0) catSelect.options[0].textContent = t.selectCategory || 'Sélectionnez une catégorie';
    // Select période (option vide)
    const periodSelect = document.getElementById('budgetPeriod');
    if (periodSelect && periodSelect.options.length > 0) periodSelect.options[0].textContent = t.period || 'Période';
    // Filtres (option vide)
    const filterCat = document.getElementById('filterCategory');
    if (filterCat && filterCat.options.length > 0) filterCat.options[0].textContent = t.category || 'Catégorie';
    const filterPeriod = document.getElementById('filterPeriod');
    if (filterPeriod && filterPeriod.options.length > 0) filterPeriod.options[0].textContent = t.period || 'Période';
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus && filterStatus.options.length > 0) filterStatus.options[0].textContent = t.status || 'Statut';
}

document.addEventListener('DOMContentLoaded', setBudgetFormPlaceholders);
window.addEventListener('languageChanged', setBudgetFormPlaceholders);
