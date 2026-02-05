document.addEventListener('DOMContentLoaded', function () {
    // --- VARIABLES POUR LA SUPPRESSION (AJOUTÉ) ---
    let transactionToDelete = null;
    const deleteModal = document.getElementById('deleteModal');

    // Transaction functionality
    let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const transactionForm = document.getElementById('transactionForm');
    const transactionsContainer = document.getElementById('transactionsContainer');
    
    // --- Variables de contrôle ---
    let currentFilter = 'all';
    let showAll = false; 

    // Définir les catégories par type
    const categories = {
        expense: ["Alimentation", "Transport", "Loisirs", "Logement", "Sante", "Education", "Autre"],
        income: ["Salaire", "Revenus passifs", "Cadeaux", "Vente", "Autre"]
    };

    // --- FONCTION TOAST (AJOUTÉ - BAS DROITE) ---
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
        targetCategorySelect.innerHTML = '<option value="">Sélectionner</option>';
        if (selectedType && categories[selectedType]) {
            categories[selectedType].forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.toLowerCase();
                option.textContent = cat;
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
                transactions[index] = {
                    id: id,
                    type: document.getElementById('editTransactionType').value,
                    category: document.getElementById('editTransactionCategory').value,
                    amount: parseFloat(document.getElementById('editTransactionAmount').value),
                    date: document.getElementById('editTransactionDate').value,
                    description: document.getElementById('editTransactionDescription').value
                };

                localStorage.setItem('transactions', JSON.stringify(transactions));
                renderTransactions();
                editModal.style.display = 'none';
                showSuccessToast("Transaction modifié !");
            }
        });
    }

    // --- GESTION DU MODAL DE SUPPRESSION (LOGIQUE BOUTONS) ---
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        if(deleteModal) deleteModal.style.display = 'none';
        transactionToDelete = null;
    });

    // Set default date
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('transactionDate')) document.getElementById('transactionDate').value = today;

    // Apply accent color to sidebar
    const accentColor = localStorage.getItem('accentColor') || '#2563eb';
    const aside = document.querySelector('aside');
    if (aside) {
        const darkerColor = darkenColor(accentColor, 30);
        aside.style.background = `linear-gradient(180deg, ${accentColor} 0%, ${darkerColor} 100%)`;
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

    // --- MODIF : Bouton Tout Supprimer avec Modal ---
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', function() {
            if (deleteModal) deleteModal.style.display = 'flex';
            
            document.getElementById('confirmDeleteBtn').onclick = function() {
                transactions = [];
                localStorage.setItem('transactions', JSON.stringify([]));
                renderTransactions();
                if (deleteModal) deleteModal.style.display = 'none';
                showSuccessToast("Historique vidé !");
            };
        });
    }

    // Form submission principal
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(transactionForm);
            const transaction = {
                id: Date.now(),
                type: formData.get('transactionType'),
                category: formData.get('transactionCategory'),
                amount: parseFloat(formData.get('transactionAmount')),
                date: formData.get('transactionDate'),
                description: document.getElementById('transactionDescription').value || ''
            };

            if (transaction.type && transaction.category && transaction.amount > 0 && transaction.date) {
                transactions.push(transaction);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                renderTransactions();
                transactionForm.reset();
                document.getElementById('transactionDate').value = today;
                showSuccessToast("Transaction ajoutée !");
            } else {
                alert('Veuillez remplir tous les champs correctement.');
            }
        });
    }

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

        const limit = 3;
        const toDisplay = showAll ? filteredTransactions : filteredTransactions.slice(0, limit);
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

        // BASCULE "VOIR PLUS / MOINS"
        if (filteredTransactions.length > limit) {
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = showAll ? `Voir moins` : `Voir plus (${filteredTransactions.length - limit})`;
            toggleBtn.onclick = () => { showAll = !showAll; renderTransactions(); };

            toggleBtn.style.cssText = `width: 100%; padding: 10px; margin-top: 10px; background: none; border: 1px dashed ${accentColor}; color: ${accentColor}; cursor: pointer; border-radius: 8px; font-weight: bold;`;
            
            toggleBtn.onmouseenter = () => {
                toggleBtn.style.backgroundColor = accentColor;
                toggleBtn.style.color = 'white';
            };
            toggleBtn.onmouseleave = () => {
                toggleBtn.style.backgroundColor = 'transparent';
                toggleBtn.style.color = accentColor;
            };
            transactionsContainer.appendChild(toggleBtn);
        }
    }

    // --- MODIF : Suppression simple avec Modal ---
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
});