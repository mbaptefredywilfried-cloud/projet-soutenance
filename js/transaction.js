    // Contrôle de l'animation : true = animation, false = pas d'animation
    let animateTransactions = true;
document.addEventListener('DOMContentLoaded', function () {
            // --- MENU BURGER ---
            const menuBurger = document.getElementById('menuBurger');
            const sidebar = document.querySelector('aside');
            const overlay = document.querySelector('.sidebar-overlay');
            if (menuBurger && sidebar && overlay) {
                menuBurger.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.classList.toggle('active');
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                    if (sidebar.classList.contains('active')) {
                        document.body.style.overflow = 'hidden';
                        menuBurger.setAttribute('aria-expanded', 'true');
                        menuBurger.setAttribute('aria-label', 'Fermer le menu');
                        menuBurger.focus();
                    } else {
                        document.body.style.overflow = '';
                        menuBurger.setAttribute('aria-expanded', 'false');
                        menuBurger.setAttribute('aria-label', 'Ouvrir le menu');
                    }
                });
                overlay.addEventListener('click', function() {
                    menuBurger.classList.remove('active');
                    sidebar.classList.remove('active');
                    this.classList.remove('active');
                    document.body.style.overflow = '';
                    menuBurger.setAttribute('aria-expanded', 'false');
                    menuBurger.setAttribute('aria-label', 'Ouvrir le menu');
                });
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                        menuBurger.classList.remove('active');
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                        document.body.style.overflow = '';
                        menuBurger.setAttribute('aria-expanded', 'false');
                        menuBurger.setAttribute('aria-label', 'Ouvrir le menu');
                    }
                });
            }
        // Gestion du filtre
        let currentFilter = 'all';
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons.length) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = this.dataset.filter;
                    animateTransactions = true;
                    renderTransactions();
                });
            });
        }
    // ...menu burger et responsive inchangé...

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
                console.log('Transactions reçues:', data.data);
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
                showSuccessToast('Transaction ajoutée !');
                transactionForm.reset();
                await fetchTransactions();
                window.dispatchEvent(new Event('transactionsUpdated'));
            } else {
                showErrorPopup(data.message || 'Erreur lors de l\'ajout.');
            }
        } catch (err) {
            showErrorPopup('Erreur réseau ou serveur.');
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
                showSuccessToast('Transaction modifiée !');
                await fetchTransactions();
                window.dispatchEvent(new Event('transactionsUpdated'));
            } else {
                showErrorPopup(data.message || 'Erreur lors de la modification.');
            }
        } catch (err) {
            showErrorPopup('Erreur réseau ou serveur.');
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
                showSuccessToast('Transaction supprimée !');
                await fetchTransactions();
                window.dispatchEvent(new Event('transactionsUpdated'));
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
                    showErrorToast('Veuillez remplir tous les champs obligatoires.');
                    return;
                }

                await addTransaction(transaction);
        });
    }

    // Rendu des transactions
    function renderTransactions() {
        if (!transactionsContainer) return;
        transactionsContainer.innerHTML = '';
        // Filtrage selon le bouton actif
        let filtered = transactions;
        if (currentFilter === 'income') {
            filtered = transactions.filter(t => t.category_type === 'income');
        } else if (currentFilter === 'expense') {
            filtered = transactions.filter(t => t.category_type === 'expense');
        }
        if (filtered.length === 0) {
            transactionsContainer.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>Aucune transaction trouvée</p></div>`;
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

        toDisplay.forEach(transaction => {
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
            // Pour l'anglais, on veut le format "en-US" ; pour le français, "fr-FR"
            if (locale.startsWith('en')) locale = 'en-US';
            else locale = 'fr-FR';
            const dateStr = date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
            transactionItem.innerHTML = `
                <div class="transaction-info" style="display:flex;align-items:center;gap:16px;">
                    <div class="transaction-icon" style="background:${iconData.bg};width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:22px;">
                        <i class="${iconData.icon}" style="color:${iconData.color};"></i>
                    </div>
                    <div class="transaction-details">
                        <h4 style="margin:0;font-weight:600;">${transaction.description || cat}</h4>
                        <p style="margin:0;color:#888;font-size:15px;">${dateStr} • ${cat}</p>
                    </div>
                </div>
                <div style="display: inline-flex; gap: 35px; align-items: center;">
                    <div class="transaction-amount" style="font-size: 18px; font-weight: 700; color:${amountColor};">
                        ${sign}${Number(transaction.amount).toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} ${localStorage.getItem('appCurrency') || '€'}
                    </div>
                    <div style="padding: 0px 10px 0px;">
                        <button class="edit-btn" onclick="editTransaction(${transaction.id})" style="background-color: #3498db; border: none; color: white; cursor: pointer; margin-right: 10px; padding: 7px; border-radius: 4px;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="delete-btn" onclick="confirmDeleteTransaction(${transaction.id})" style="background-color: #e74c3c; border: none; color: white; cursor: pointer; padding: 7px; border-radius: 4px;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            transactionsContainer.appendChild(transactionItem);
            // Animation uniquement si demandé
            if (animateTransactions) {
                void transactionItem.offsetWidth;
                transactionItem.classList.add('transaction-fade');
            }
        });

        // Bouton Voir plus/moins si au moins 10 transactions (et max 15)
        if (limitedTransactions.length > showMoreThreshold) {
            const accentColor = localStorage.getItem('accentColor') || '#2563eb';
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = showAll ? `Voir moins` : `Voir plus (${limitedTransactions.length - showMoreThreshold})`;
            toggleBtn.onclick = () => {
                showAll = !showAll;
                animateTransactions = false;
                renderTransactions();
            };
            toggleBtn.style.cssText = `width: 100%; padding: 10px; margin-top: 10px; background: none; border: 1px dashed ${accentColor}; color: ${accentColor}; cursor: pointer; border-radius: 8px; font-weight: bold;`;
            toggleBtn.onmouseenter = () => {
                toggleBtn.style.background = accentColor;
                toggleBtn.style.color = '#fff';
            };
            toggleBtn.onmouseleave = () => {
                toggleBtn.style.background = 'none';
                toggleBtn.style.color = accentColor;
            };
            transactionsContainer.appendChild(toggleBtn);
        }
    }

    // Edition transaction (à adapter selon ton modal)
    window.editTransaction = function(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        // Ouvre le modal d'édition
        document.getElementById('editModal').style.display = 'flex';
        // Pré-remplit le formulaire
        document.getElementById('editTransactionId').value = transaction.id;
        document.getElementById('editTransactionType').value = transaction.category_type;
        // Met à jour les catégories selon le type
        if (typeof updateCategoryOptions === 'function') {
            updateCategoryOptions(document.getElementById('editTransactionType'), document.getElementById('editTransactionCategory'));
        }
        document.getElementById('editTransactionCategory').value = transaction.category_id;
        document.getElementById('editTransactionAmount').value = transaction.amount;
        document.getElementById('editTransactionDate').value = transaction.transaction_date || transaction.date;
        document.getElementById('editTransactionDescription').value = transaction.description || '';
    };

    // Soumission du formulaire de modification
    document.getElementById('editTransactionForm').onsubmit = async function(e) {
        e.preventDefault();
        const id = document.getElementById('editTransactionId').value;
        const type = document.getElementById('editTransactionType').value;
        const category_id = parseInt(document.getElementById('editTransactionCategory').value, 10);
        const amount = parseFloat(document.getElementById('editTransactionAmount').value);
        const date = document.getElementById('editTransactionDate').value;
        const description = document.getElementById('editTransactionDescription').value;
        await updateTransaction({ id, type, category_id, amount, date, description });
        document.getElementById('editModal').style.display = 'none';
        // Rafraîchir la liste après modif
        window.dispatchEvent(new Event('transactionsUpdated'));
    };

    // Confirmation suppression
    window.confirmDeleteTransaction = function(id) {
        transactionToDelete = id;
        if (deleteModal) deleteModal.style.display = 'flex';
        document.getElementById('confirmDeleteBtn').onclick = async function() {
            await deleteTransaction(transactionToDelete);
            if (deleteModal) deleteModal.style.display = 'none';
            transactionToDelete = null;
        };
    };

    // Toast de succès
    function showSuccessToast(message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
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
});
    let currentFilter = 'all';
    let showAll = false; 

    // Catégories dynamiques synchronisées depuis le backend
    let categories = { expense: [], income: [] };
    async function fetchCategories() {
        try {
            const response = await fetch('php/categories/get_categories.php', { credentials: 'same-origin' });
            const data = await response.json();
            console.log('Catégories reçues:', data);
            if (data.status === 'success' && Array.isArray(data.categories)) {
                categories.expense = data.categories.filter(c => c.type === 'expense');
                categories.income = data.categories.filter(c => c.type === 'income');
            }
        } catch (e) {
            categories = { expense: [], income: [] };
        }
    }
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

    // --- FONCTION TOAST ---
    function showSuccessToast(message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast-custom';
        toast.innerHTML = `
            <div class="toast-icon" style="background:white; color:#10b981; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
                <i class="fas fa-check" style="font-size:12px;"></i>
            </div>
            <div class="toast-message">${message}</div>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

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

    // Mettre à jour les options en fonction du type choisi (Formulaire principal)
    const typeSelect = document.getElementById("transactionType");
    const categorySelect = document.getElementById("transactionCategory");

    if (typeSelect) {
        typeSelect.addEventListener("change", () => updateCategoryOptions(typeSelect, categorySelect));
    }

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
        document.getElementById('editTransactionType').value = transaction.type;
        
        // Charger les catégories correspondantes au type avant de sélectionner la valeur
        updateCategoryOptions(editTypeSelect, editCategorySelect);
        editCategorySelect.value = transaction.category;
        
        document.getElementById('editTransactionAmount').value = transaction.amount;
        document.getElementById('editTransactionDate').value = transaction.date;
        document.getElementById('editTransactionDescription').value = transaction.description || '';

        editModal.style.display = 'flex'; // Affiche le modal
    };

    // Fermer le modal
    document.getElementById('cancelEdit')?.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Enregistrer les modifications
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('editTransactionId').value);
            const index = transactions.findIndex(t => t.id === id);

            if (index !== -1) {
                const updatedTransaction = {
                    id: id,
                    type: document.getElementById('editTransactionType').value,
                    category: document.getElementById('editTransactionCategory').value,
                    amount: parseFloat(document.getElementById('editTransactionAmount').value),
                    date: document.getElementById('editTransactionDate').value,
                    description: document.getElementById('editTransactionDescription').value
                };
                
                transactions[index] = updatedTransaction;

                localStorage.setItem('transactions', JSON.stringify(transactions));
                // Check for budget overrun if this is an expense
                if (updatedTransaction.type === 'expense' && typeof checkBudgetOverrun === 'function') {
                    checkBudgetOverrun(updatedTransaction.category);
                }
                renderTransactions();
                editModal.style.display = 'none';
                showSuccessToast("Transaction modifié !");
            }
        });
    }

    // --- GESTION DU MODAL DE SUPPRESSION ---
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        if(deleteModal) deleteModal.style.display = 'none';
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
                    showErrorToast('Les dates futures sont interdites');
                    transactionDateInput.value = todayStr;
                } else if (selectedDateStr < minDateStr) {
                    showErrorToast('Vous ne pouvez pas sélectionner une date antérieure à 1 mois');
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
                    showErrorToast('Les dates futures sont interdites');
                    editTransactionDateInput.value = todayStr;
                } else if (selectedDateStr < minDateStr) {
                    showErrorToast('Vous ne pouvez pas sélectionner une date antérieure à 1 mois');
                    editTransactionDateInput.value = todayStr;
                }
            });
        }
    }
    
    function showErrorToast(message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
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

    // Apply accent color to sidebar
    const accentColor = localStorage.getItem('accentColor') || '#2563eb';
    const asideElement = document.querySelector('aside');
    if (asideElement) {
        const darkerColor = darkenColor(accentColor, 30);
        asideElement.style.background = `linear-gradient(180deg, ${accentColor} 0%, ${darkerColor} 100%)`;
    }

    // --- Logique des filtres + COULEUR D'ACCENT AU SURVOL ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    function updateFilterStyles() {
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
            if (deleteModal) deleteModal.style.display = 'flex';
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
                        showSuccessToast("Historique vidé !");
                    } else {
                        showErrorToast("Erreur lors de la suppression");
                    }
                } catch (e) {
                    showErrorToast("Erreur lors de la suppression");
                }
                if (deleteModal) deleteModal.style.display = 'none';
            };
        });
    }

    // Form submission principal
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(transactionForm);
            const transaction = {
                type: formData.get('transactionType'),
                category: formData.get('transactionCategory'),
                amount: parseFloat(formData.get('transactionAmount')),
                transaction_date: formData.get('transactionDate'),
                description: document.getElementById('transactionDescription').value || ''
            };

            if (transaction.type && transaction.category && transaction.amount > 0 && transaction.transaction_date) {
                // Récupérer l'ID de la catégorie côté serveur (à adapter si besoin)
                const categoryId = await getCategoryIdByName(transaction.category, transaction.type);
                if (!categoryId) {
                    return;
                }
                transaction.category_id = categoryId;
                try {
                    const response = await fetch('php/transactions/add_transaction.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify(transaction)
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        showSuccessToast('Transaction ajoutée !');
                        transactionForm.reset();
                        document.getElementById('transactionDate').value = today;
                        await fetchAndRenderTransactions();
                    } else {
                        showErrorPopup(data.message || 'Erreur lors de l\'ajout.');
                    }
                } catch (err) {
                    showErrorPopup('Erreur réseau ou serveur.');
                }
            } else {
                showErrorPopup('Veuillez remplir tous les champs correctement.');
            function showErrorPopup(message) {
                let modal = document.getElementById('customAlert');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'customAlert';
                    modal.innerHTML = `
                    <div class="custom-alert-overlay"></div>
                    <div class="custom-alert-modal">
                        <div class="custom-alert-icon-inner">
                            <span class="custom-alert-x">&#10006;</span>
                        </div>
                        <div class="custom-alert-title">Erreur</div>
                        <div class="custom-alert-message" id="customAlertMessage"></div>
                        <button class="custom-alert-btn" id="customAlertBtn">OK</button>
                    </div>`;
                    document.body.appendChild(modal);
                    // Ajout du CSS si pas déjà présent
                    if (!document.getElementById('customAlertStyle')) {
                        const style = document.createElement('style');
                        style.id = 'customAlertStyle';
                        style.textContent = `
                        #customAlert { position: fixed; z-index: 9999; left: 0; top: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
                        .custom-alert-overlay { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(2px); }
                        .custom-alert-modal { position: relative; background: #fff; border-radius: 28px; padding: 32px 24px 24px 24px; min-width: 320px; max-width: 95vw; min-height: 180px; display: flex; flex-direction: column; align-items: center; z-index: 2; box-shadow: 0 8px 40px rgba(0,0,0,0.18); }
                        .custom-alert-icon-inner { background: #F55B5B; color: #fff; border-radius: 50%; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; font-size: 36px; border: 6px solid #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.10); margin-top: -56px; margin-bottom: 8px; }
                        .custom-alert-x { font-size: 36px; font-weight: bold; line-height: 1; }
                        .custom-alert-title { color: #F55B5B; font-size: 1.7rem; font-weight: bold; margin-bottom: 10px; margin-top: 8px; text-align: center; letter-spacing: 0.5px; }
                        .custom-alert-message { color: #6B7687; font-size: 1.05rem; margin-bottom: 24px; margin-top: 4px; text-align: center; }
                        .custom-alert-btn { background: #F55B5B; color: #fff; border: none; border-radius: 12px; padding: 14px 0; width: 90%; font-size: 1.1rem; font-weight: bold; cursor: pointer; margin-top: 10px; transition: background 0.2s; box-shadow: 0 2px 8px rgba(245,91,91,0.08); letter-spacing: 0.5px; }
                        .custom-alert-btn:hover { background: #d13d3d; }
                        @media (max-width: 500px) {
                            .custom-alert-modal { min-width: 90vw; padding: 18px 4vw 14px 4vw; }
                            .custom-alert-btn { font-size: 1rem; padding: 10px 0; }
                        }
                        `;
                        document.head.appendChild(style);
                    }
                }
                document.getElementById('customAlertMessage').textContent = message;
                modal.style.display = 'flex';
                document.getElementById('customAlertBtn').onclick = function() {
                    modal.style.display = 'none';
                };
            }
            }
        });
    }

    // Fonction utilitaire pour obtenir l'ID de la catégorie par son nom et type
    async function getCategoryIdByName(name, type) {
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

    // Récupérer et afficher les transactions depuis le backend
    async function fetchAndRenderTransactions() {
        try {
            const response = await fetch('php/transactions/list.php', { credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success') {
                transactions = data.transactions;
                renderTransactions();
            } else {
                transactions = [];
                renderTransactions();
            }
        } catch (e) {
            transactions = [];
            renderTransactions();
        }
    }

    // Initialisation : charger les transactions au chargement de la page
    fetchAndRenderTransactions();

    // --- Fonction de formatage des montants ---
    function formatAmount(amount) {
        return Math.floor(amount).toLocaleString('fr-FR').replace(/\u00a0/g, ' ');
    }

    // Render transactions
    function renderTransactions() {
        if (!transactionsContainer) return;
        transactionsContainer.innerHTML = '';
        
        let filteredTransactions = [...transactions];
        if (currentFilter !== 'all') {
            filteredTransactions = transactions.filter(t => t.type === currentFilter);
        }

        if (filteredTransactions.length === 0) {
        transactionsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>Aucune transaction trouvée</p>
            </div>
        `;
        return; // On arrête la fonction ici
    }

        filteredTransactions.sort((a, b) => (new Date(b.date) - new Date(a.date)) || (b.id - a.id));

        // Limite d'affichage max
        const maxDisplay = 15;
        // Seuil à partir duquel on affiche le bouton Voir plus/moins
        const showMoreThreshold = 10;

        // On limite le nombre de transactions affichées à maxDisplay
        let limitedTransactions = filteredTransactions.slice(0, maxDisplay);
        // Si showAll est activé, on affiche tout (jusqu'à maxDisplay)
        const toDisplay = showAll ? limitedTransactions : limitedTransactions.slice(0, showMoreThreshold);
        const currencySymbol = localStorage.getItem('appCurrency') || '€';

        toDisplay.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';

            const icon = getCategoryIcon(transaction.category);
            const bgColor = transaction.type === 'income' ? '#d1fae5' : '#fed7d7';
            const iconColor = transaction.type === 'income' ? '#065f46' : '#742a2a';
            const sign = transaction.type === 'income' ? '+' : '-';

            transactionItem.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-icon" style="background: ${bgColor};">
                        <i class="${icon}" style="color: ${iconColor};"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description || getCategoryName(transaction.category)}</h4>
                        <p>${formatDate(transaction.date)} • ${getCategoryName(transaction.category)}</p>
                    </div>
                </div>
                <div style="display: inline-flex; gap: 35px; align-items: center;">
                    <div class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}" style="font-size: 18px; font-weight: 700;">
                        ${sign}${formatAmount(transaction.amount)} ${currencySymbol}
                    </div>
                    <div style="padding: 0px 10px 0px;">
                        <button class="edit-btn" onclick="editTransaction(${transaction.id})" style="background-color: #3498db; border: none; color: white; cursor: pointer; margin-right: 10px; padding: 7px; border-radius: 4px;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteTransaction(${transaction.id})" style="background-color: #e74c3c; border: none; color: white; cursor: pointer; padding: 7px; border-radius: 4px;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            transactionsContainer.appendChild(transactionItem);
        });

        // Bouton Voir plus/moins si au moins 10 transactions (et max 15)
        if (limitedTransactions.length > showMoreThreshold) {
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = showAll ? `Voir moins` : `Voir plus (${limitedTransactions.length - showMoreThreshold})`;
            toggleBtn.onclick = () => {
                showAll = !showAll;
                renderTransactions();
            };
            toggleBtn.style.cssText = `width: 100%; padding: 10px; margin-top: 10px; background: none; border: 1px dashed ${accentColor}; color: ${accentColor}; cursor: pointer; border-radius: 8px; font-weight: bold;`;
            toggleBtn.onmouseenter = () => { toggleBtn.style.background = accentColor + '22'; };
            toggleBtn.onmouseleave = () => { toggleBtn.style.background = 'none'; };
            transactionsContainer.appendChild(toggleBtn);
        }
    }

    // --- Suppression simple avec Modal ---
    window.deleteTransaction = function(id) {
        transactionToDelete = id;
        if(deleteModal) deleteModal.style.display = 'flex';

        document.getElementById('confirmDeleteBtn').onclick = function() {
            if (transactionToDelete !== null) {
                transactions = transactions.filter(t => t.id !== transactionToDelete);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                renderTransactions();
                if (deleteModal) deleteModal.style.display = 'none';
                showSuccessToast("Transaction supprimée !");
                transactionToDelete = null;
            }
        };
    }

    function getCategoryIcon(category) {
        const icons = { alimentation: 'fas fa-utensils', transport: 'fas fa-car', loisirs: 'fas fa-gamepad', logement: 'fas fa-home', sante: 'fas fa-heartbeat', education: 'fas fa-graduation-cap', salaire: 'fas fa-money-bill-wave', autre: 'fas fa-ellipsis-h' };
        return icons[category] || 'fas fa-question';
    }

    function getCategoryName(category) {
        const names = { alimentation: 'Alimentation', transport: 'Transport', loisirs: 'Loisirs', logement: 'Logement', sante: 'Santé', education: 'Éducation', salaire: 'Salaire', autre: 'Autre' };
        return names[category] || category;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    renderTransactions();