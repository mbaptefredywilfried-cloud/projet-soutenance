    // Contrôle de l'animation : true = animation, false = pas d'animation
    let animateTransactions = true;
    
    // --- VARIABLES GLOBALES ---
    let currentFilter = 'all';
    let showAll = false;
    let transactionToDelete = null;
    let categories = { expense: [], income: [] };

    // --- LOGIQUE COMMUNE POUR LES CATEGORIES ---
    function updateCategoryOptions(typeSelect, targetCategorySelect) {
        const selectedType = typeSelect.value;
        // Utilise la langue courante du document (html[lang])
        let currentLang = document.documentElement.lang || 'fr';
        targetCategorySelect.innerHTML = '<option value="">' + (translations[currentLang]?.selectOption || 'Sélectionner') + '</option>';
        if (selectedType && categories[selectedType]) {
            categories[selectedType].forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.id;
                // Utilise la clé de traduction si disponible
                if (cat.translation_key && translations[currentLang] && translations[currentLang][cat.translation_key]) {
                    option.textContent = translations[currentLang][cat.translation_key];
                } else {
                    option.textContent = cat.name;
                }
                targetCategorySelect.appendChild(option);
            });
        }
    }

    // --- CATÉGORIES DYNAMIQUES SYNCHRONISÉES DEPUIS LE BACKEND ---
    async function fetchCategories() {
        try {
            const response = await fetch('php/categories/get_categories.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success' && Array.isArray(data.categories)) {
                categories.expense = data.categories.filter(c => c.type === 'expense');
                categories.income = data.categories.filter(c => c.type === 'income');
            }
        } catch (e) {
            categories = { expense: [], income: [] };
        }
    }
    
document.addEventListener('DOMContentLoaded', function () {
    // ...existing code...
        // Gestion du filtre - rendu immédiat
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons.length) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterButtons.forEach(b => b.classList.remove('active-time'));
                    this.classList.add('active-time');
                    currentFilter = this.dataset.filter;
                    animateTransactions = true;
                    // Rendu immédiat sans débounce pour éviter le "no transactions found" clignotant
                    renderTransactions();
                });
            });
            // Initialisation : appliquer la classe active-time au bouton actif par défaut
            const defaultBtn = document.querySelector('.filter-btn.active');
            if (defaultBtn) {
                defaultBtn.classList.add('active-time');
            }
        }
        // ...existing code...

    // --- VARIABLES POUR LA SUPPRESSION ---
    let transactionToDelete = null;
    const deleteModal = document.getElementById('deleteModal');

    let transactions = [];
    const transactionForm = document.getElementById('transactionForm');
    const transactionsContainer = document.getElementById('transactionsContainer');

    // Charger les transactions depuis le backend
    async function fetchTransactions() {
        try {
            const response = await fetch('php/transactions/list.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success') {
                transactions = data.data;
            } else {
                transactions = [];
            }
            renderTransactions();
        } catch (e) {
            transactions = [];
            renderTransactions();
        }
    }

    // Ajouter une transaction
    async function addTransaction(transaction) {
        try {
            const response = await fetch('php/transactions/add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(transaction)
            });
            const data = await response.json();
            if (data.status === 'success') {
                // Ajouter la transaction directement au tableau JS (elle vient du serveur)
                if (data.data) {
                    transactions.unshift(data.data);
                    renderTransactions();
                    showSuccessToast('transactionAdded');
                    transactionForm.reset();
                    // Remettre la date à aujourd'hui après reset
                    const transactionDateInput = document.getElementById('transactionDate');
                    if (transactionDateInput) {
                        const today = new Date();
                        const yyyy = today.getFullYear();
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const dd = String(today.getDate()).padStart(2, '0');
                        transactionDateInput.value = `${yyyy}-${mm}-${dd}`;
                    }
                    window.dispatchEvent(new Event('transactionsUpdated'));
                    // Rafraîchir les notifications après l'ajout d'une transaction
                    if (window.refreshNotifications) {
                        window.refreshNotifications();
                    }
                    // Vérifier et mettre à jour le statut du budget
                    if (window.checkAndUpdateBudgetStatus) {
                        setTimeout(() => window.checkAndUpdateBudgetStatus(), 500);
                    }
                }
            } else {
                showErrorToast(data.message || 'Erreur lors de l\'ajout.');
            }
        } catch (err) {
            showErrorToast('Erreur réseau ou serveur.');
        }
    }

    // Modifier une transaction
    async function updateTransaction(transaction) {
        try {
            const response = await fetch('php/transactions/update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(transaction)
            });
            const data = await response.json();
            if (data.status === 'success') {
                // Trouver et mettre à jour la transaction dans le tableau
                if (data.data) {
                    const index = transactions.findIndex(t => t.id === data.data.id);
                    if (index !== -1) {
                        transactions[index] = data.data;
                    }
                }
                renderTransactions();
                showSuccessToast('transactionModified');
                window.dispatchEvent(new Event('transactionsUpdated'));
                // Rafraîchir les notifications après la modification d'une transaction
                if (window.refreshNotifications) {
                    window.refreshNotifications();
                }
            } else {
                showErrorToast(data.message || 'Erreur lors de la modification.');
            }
        } catch (err) {
            showErrorToast('Erreur réseau ou serveur.');
        }
    }

    // Supprimer une transaction
    async function deleteTransaction(id) {
        try {
            const response = await fetch('php/transactions/delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ id })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showSuccessToast('transactionDeleted');
                await fetchTransactions();
                window.dispatchEvent(new Event('transactionsUpdated'));
                // Rafraîchir les notifications après la suppression d'une transaction
                if (window.refreshNotifications) {
                    window.refreshNotifications();
                }
            } else {
                showErrorPopup(data.message || 'Erreur lors de la suppression.');
            }
        } catch (err) {
            showErrorPopup('Erreur réseau ou serveur.');
        }
    }

    // Soumission du formulaire
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(transactionForm);
                let description = '';
                const descriptionInput = document.getElementById('transactionDescription');
                if (descriptionInput && typeof descriptionInput.value === 'string') {
                    description = descriptionInput.value.trim();
                }

                let categoryId = formData.get('transactionCategory');
                if (categoryId !== null && categoryId !== undefined && categoryId !== '') {
                    categoryId = parseInt(categoryId, 10);
                } else {
                    categoryId = null;
                }

                const transaction = {
                    type: formData.get('transactionType'),
                    category_id: categoryId,
                    amount: parseFloat(formData.get('transactionAmount')),
                    transaction_date: formData.get('transactionDate'),
                    description: description
                };

                if (!transaction.type || !transaction.category_id || isNaN(transaction.amount) || !transaction.transaction_date) {
                    showErrorPopup('fillAllFields');
                    return;
                }

                await addTransaction(transaction);
        });
    }

    // Rendu des transactions - Optimisé avec DocumentFragment et virtualisation
    function renderTransactions() {
        if (!transactionsContainer) return;
        
        // Filtrage selon le bouton actif (type de transaction)
        let filtered = transactions;
        if (currentFilter === 'income') {
            filtered = transactions.filter(t => t.category_type === 'income');
        } else if (currentFilter === 'expense') {
            filtered = transactions.filter(t => t.category_type === 'expense');
        }

        // Utiliser DocumentFragment pour les insertions en masse (plus performant)
        const fragment = document.createDocumentFragment();
        
        if (filtered.length === 0) {
                const lang = document.documentElement.lang || 'fr';
                const currentLang = lang.startsWith('en') ? 'en' : (lang.startsWith('fr') ? 'fr' : 'en');
                const noTransactions = (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].noTransactionsFound) ? translations[currentLang].noTransactionsFound : 'No transactions found';
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-state';
                emptyDiv.innerHTML = `<i class="fas fa-receipt"></i><p>${noTransactions}</p>`;
                fragment.appendChild(emptyDiv);
                transactionsContainer.innerHTML = '';
                transactionsContainer.appendChild(fragment);
                return;
        }

        // Limite d'affichage max
        const maxDisplay = 15;
        // Seuil à partir duquel on affiche le bouton Voir plus/moins
        const showMoreThreshold = 10;

        // On limite le nombre de transactions affichées à maxDisplay
        let limitedTransactions = filtered.slice(0, maxDisplay);
        // Si showAll est activé, on affiche tout (jusqu'à maxDisplay)
        const toDisplay = showAll ? limitedTransactions : limitedTransactions.slice(0, showMoreThreshold);

        // Construire tous les éléments dans le fragment
        toDisplay.forEach(transaction => {
            const transactionItem = createTransactionElement(transaction);
            fragment.appendChild(transactionItem);
        });

        // Bouton Voir plus/moins si au moins 10 transactions (et max 15)
        if (limitedTransactions.length > showMoreThreshold) {
            const toggleBtn = createToggleButton(limitedTransactions.length, showMoreThreshold);
            fragment.appendChild(toggleBtn);
        }
        
        // Remplacer le contenu en une seule opération
        transactionsContainer.innerHTML = '';
        transactionsContainer.appendChild(fragment);
    }
    
    // Fonction pour créer un élément transaction (extraite pour clarté)
    function createTransactionElement(transaction) {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
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
        
        // Utilise la langue courante du document (html[lang])
        let currentLang = document.documentElement.lang || 'fr';
        let cat = transaction.category_name || 'Autre';
        if (transaction.category_translation_key && translations[currentLang] && translations[currentLang][transaction.category_translation_key]) {
            cat = translations[currentLang][transaction.category_translation_key];
        }
        
        const iconData = iconMap[transaction.category_name] || iconMap['Autre'];
        const isIncome = (transaction.category_type === 'income');
        const sign = isIncome ? '+' : '-';
        const amountColor = isIncome ? '#10b981' : '#ef4444';
        const date = new Date(transaction.transaction_date || transaction.date);
        
        // Format dynamique selon la langue courante
        let locale = document.documentElement.lang || 'fr';
        if (locale.startsWith('en')) locale = 'en-US';
        else locale = 'fr-FR';
        const dateStr = date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
        
        transactionItem.innerHTML = `
            <div class="transaction-info" style="display:flex;align-items:center;gap:16px;">
                <div class="transaction-icon" style="background:${iconData.bg};width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:22px;flex-shrink:0;">
                    <i class="${iconData.icon}" style="color:${iconData.color};"></i>
                </div>
                <div class="transaction-details">
                    <h4 style="margin:0;font-weight:600;">${transaction.description || cat}</h4>
                    <p style="margin:0;color:#888;font-size:15px;">${dateStr} • ${cat}</p>
                </div>
            </div>
            <div style="display:inline-flex;gap:12px;align-items:center;flex-shrink:0;">
                <div class="transaction-amount" style="font-size:18px;font-weight:700;color:${amountColor};white-space:nowrap;">
                    ${sign}${Number(transaction.amount).toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} ${window.appCurrency || 'EUR'}
                </div>
                <div style="display:inline-flex;gap:8px;align-items:center;flex-shrink:0;">
                    <button class="edit-btn" onclick="editTransaction(${transaction.id})" style="background-color:#3498db;border:none;color:white;cursor:pointer;padding:8px;width:38px;height:38px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid fa-pen-to-square" style="font-size:16px;"></i>
                    </button>
                    <button class="delete-btn" onclick="confirmDeleteTransaction(${transaction.id})" style="background-color:#e74c3c;border:none;color:white;cursor:pointer;padding:8px;width:38px;height:38px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid fa-trash-can" style="font-size:16px;"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Animation uniquement si demandé
        if (animateTransactions) {
            // Utiliser requestAnimationFrame pour une meilleure performance
            requestAnimationFrame(() => {
                transactionItem.classList.add('transaction-fade');
            });
        }
        
        return transactionItem;
    }
    
    // Fonction pour créer le bouton toggle
    function createToggleButton(totalTransactions, threshold) {
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')?.trim() || '#36A2EB';
        const toggleBtn = document.createElement('button');
        let currentLang = document.documentElement.lang || 'fr';
        let txtMore = (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].viewMore) ? translations[currentLang].viewMore : 'Voir plus';
        let txtLess = (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].viewLess) ? translations[currentLang].viewLess : 'Voir moins';
        toggleBtn.textContent = showAll ? txtLess : `${txtMore} (${totalTransactions - threshold})`;
        toggleBtn.onclick = () => {
            showAll = !showAll;
            animateTransactions = false;
            renderTransactions();
        };
        toggleBtn.style.cssText = `width: 100%; padding: 10px; margin-top: 10px; background: none; border: 1px dashed ${accentColor}; color: ${accentColor}; cursor: pointer; border-radius: 8px; font-weight: bold; transition: all 0.2s ease;`;
        toggleBtn.onmouseenter = () => {
            toggleBtn.style.background = accentColor;
            toggleBtn.style.color = '#fff';
        };
        toggleBtn.onmouseleave = () => {
            toggleBtn.style.background = 'none';
            toggleBtn.style.color = accentColor;
        };
        return toggleBtn;
    }



    // Confirmation suppression
    window.confirmDeleteTransaction = function(id) {
        transactionToDelete = id;
        if (deleteModal) deleteModal.classList.add('show');
        document.getElementById('confirmDeleteBtn').onclick = async function() {
            await deleteTransaction(transactionToDelete);
            if (deleteModal) deleteModal.classList.remove('show');
            transactionToDelete = null;
        };
    };

    // Toast de succès
    function showSuccessToast(keyOrMessage) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        let rawLang = document.documentElement.lang || 'fr';
        let currentLang = rawLang.startsWith('en') ? 'en' : (rawLang.startsWith('fr') ? 'fr' : 'en');
        let message = keyOrMessage;
        if (typeof translations !== 'undefined') {
            if (translations[currentLang] && translations[currentLang][keyOrMessage]) {
                message = translations[currentLang][keyOrMessage];
            } else if (translations['en'] && translations['en'][keyOrMessage]) {
                message = translations['en'][keyOrMessage];
            }
        }
        const toast = document.createElement('div');
        toast.className = 'toast-custom';
        toast.innerHTML = `
            <span style="background:white; color:#10b981; border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; margin-right:8px; font-size:13px;">
                <i class='fas fa-check'></i>
            </span>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Initialisation
    fetchTransactions();

    // Charger les catégories au démarrage
    fetchCategories().then(() => {
        // Mettre à jour les listes déroulantes si besoin
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        if (typeSelect && categorySelect) {
            typeSelect.addEventListener('change', () => updateCategoryOptions(typeSelect, categorySelect));
            updateCategoryOptions(typeSelect, categorySelect);
        }
    });

    // --- GESTION DU MODAL DE MODIFICATION ---
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editTransactionForm');
    const editTypeSelect = document.getElementById('editTransactionType');
    const editCategorySelect = document.getElementById('editTransactionCategory');

    // Mise à jour dynamique des catégories dans le modal
    if (editTypeSelect) {
        editTypeSelect.addEventListener('change', () => updateCategoryOptions(editTypeSelect, editCategorySelect));
    }

    // Ouvrir le modal et remplir les champs
    window.editTransaction = function(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        document.getElementById('editTransactionId').value = transaction.id;
        document.getElementById('editTransactionType').value = transaction.category_type;
        
        // Charger les catégories correspondantes au type avant de sélectionner la valeur
        updateCategoryOptions(editTypeSelect, editCategorySelect);
        editCategorySelect.value = transaction.category_id;
        
        document.getElementById('editTransactionAmount').value = transaction.amount;
        document.getElementById('editTransactionDate').value = transaction.transaction_date || transaction.date;
        document.getElementById('editTransactionDescription').value = transaction.description || '';

        editModal.style.display = 'flex'; // Affiche le modal
    };

    // Fermer le modal
    document.getElementById('cancelEdit')?.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Enregistrer les modifications
    if (editForm) {
            editForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const id = parseInt(document.getElementById('editTransactionId').value);
                const type = document.getElementById('editTransactionType').value;
                const category_id = parseInt(document.getElementById('editTransactionCategory').value);
                const amount = parseFloat(document.getElementById('editTransactionAmount').value);
                const date = document.getElementById('editTransactionDate').value;
                const description = document.getElementById('editTransactionDescription').value;
                const updatedTransaction = { id, type, category_id, amount, date, description };
                await updateTransaction(updatedTransaction);
                // Vérification du dépassement de budget si dépense
                if (type === 'expense' && typeof checkBudgetOverrun === 'function') {
                    checkBudgetOverrun(category_id);
                }
                editModal.style.display = 'none';
        });
    }

    // --- GESTION DU MODAL DE SUPPRESSION ---
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        if(deleteModal) deleteModal.classList.remove('show');
        transactionToDelete = null;
    });

    // --- VALIDATION STRICTE DE LA DATE ---
    function initializeDateValidation() {
        const today = new Date();
        const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        // Format pour les attributs HTML5
        const todayStr = today.toISOString().split('T')[0];
        const minDateStr = oneMonthAgo.toISOString().split('T')[0];
        
        const transactionDateInput = document.getElementById('transactionDate');
        const editTransactionDateInput = document.getElementById('editTransactionDate');
        
        // Configuration du champ date principal
        if (transactionDateInput) {
            transactionDateInput.value = todayStr;
            transactionDateInput.max = todayStr; // Interdire les dates futures
            transactionDateInput.min = minDateStr; // Limiter à 1 mois en arrière
            
            // Validation au changement
            transactionDateInput.addEventListener('change', () => {
                const selectedDate = new Date(transactionDateInput.value);
                const selectedDateStr = transactionDateInput.value;
                
                if (selectedDateStr > todayStr) {
                    showErrorToast('futuresDatesNotAllowed');
                    transactionDateInput.value = todayStr;
                } else if (selectedDateStr < minDateStr) {
                    showErrorToast('dateTooOld');
                    transactionDateInput.value = todayStr;
                }
            });
        }
        
        // Configuration du champ date dans le modal de modification
        if (editTransactionDateInput) {
            editTransactionDateInput.max = todayStr;
            editTransactionDateInput.min = minDateStr;
            
            editTransactionDateInput.addEventListener('change', () => {
                const selectedDateStr = editTransactionDateInput.value;
                
                if (selectedDateStr > todayStr) {
                    showErrorToast('futuresDatesNotAllowed');
                    editTransactionDateInput.value = todayStr;
                } else if (selectedDateStr < minDateStr) {
                    showErrorToast('dateTooOld');
                    editTransactionDateInput.value = todayStr;
                }
            });
        }
    }

    // --- Logique des filtres + COULEUR D'ACCENT AU SURVOL ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    function updateFilterStyles() {
        // Utilise la couleur d'accent dynamique depuis la variable CSS
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')?.trim() || '#36A2EB';
        filterBtns.forEach(btn => {
            const isActive = btn.getAttribute('data-filter') === currentFilter;
            if (isActive) {
                btn.style.backgroundColor = accentColor;
                btn.style.color = 'white';
                btn.style.borderColor = accentColor;
            } else {
                btn.style.backgroundColor = 'transparent';
                btn.style.color = 'inherit';
                btn.style.borderColor = '#ddd';
            }
            btn.onmouseenter = () => {
                btn.style.backgroundColor = accentColor;
                btn.style.color = 'white';
                btn.style.borderColor = accentColor;
            };
            btn.onmouseleave = () => {
                if (!isActive) {
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = 'inherit';
                    btn.style.borderColor = '#ddd';
                }
            };
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.getAttribute('data-filter');
            showAll = false; 
            updateFilterStyles();
            renderTransactions();
        });
    });
    updateFilterStyles();

    // --- Bouton Tout Supprimer avec Modal ---
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', function() {
            if (deleteModal) deleteModal.classList.add('show');
            document.getElementById('confirmDeleteBtn').onclick = async function() {
                try {
                    const response = await fetch('php/transactions/delete_all.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        transactions = [];
                        localStorage.setItem('transactions', JSON.stringify([]));
                        renderTransactions();
                        let rawLang = document.documentElement.lang || 'fr';
                        let currentLang = rawLang.startsWith('en') ? 'en' : (rawLang.startsWith('fr') ? 'fr' : 'en');
                        let message = (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].historyCleared)
                            ? translations[currentLang].historyCleared
                            : (translations['en'] && translations['en'].historyCleared ? translations['en'].historyCleared : 'History cleared!');
                        showSuccessToast(message);
                        // Rafraîchir les notifications après la suppression de toutes les transactions
                        if (window.refreshNotifications) {
                            window.refreshNotifications();
                        }
                    } else {
                        showErrorToast("Erreur lors de la suppression");
                    }
                } catch (e) {
                    showErrorToast("Erreur lors de la suppression");
                }
                if (deleteModal) deleteModal.classList.remove('show');
            };
        });
    }

    // --- FONCTION POUR MONTRER LES ERREURS EN TOAST ---
    function showErrorToast(keyOrMessage) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        let rawLang = document.documentElement.lang || 'fr';
        let currentLang = rawLang.startsWith('en') ? 'en' : (rawLang.startsWith('fr') ? 'fr' : 'en');
        let message = keyOrMessage;
        if (typeof translations !== 'undefined') {
            if (translations[currentLang] && translations[currentLang][keyOrMessage]) {
                message = translations[currentLang][keyOrMessage];
            } else if (translations['en'] && translations['en'][keyOrMessage]) {
                message = translations['en'][keyOrMessage];
            }
        }

        const toast = document.createElement('div');
        toast.className = 'toast-custom';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
            display: flex; align-items: center;
        `;
        toast.innerHTML = `
            <span style="background:white; color:#ef4444; border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; margin-right:8px; font-size:13px;">
                <i class='fas fa-exclamation-circle'></i>
            </span>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    initializeDateValidation();
});