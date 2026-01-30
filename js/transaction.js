document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('aside .nav a');
    if (!links.length) return;

    // Assign stable data-id if not present
    links.forEach((link, i) => {
        if (!link.dataset.id) link.dataset.id = i;
    });

    // Restore active from localStorage
    const saved = localStorage.getItem('activeSidebarLink');
    if (saved) {
        const el = document.querySelector(`aside .nav a[data-id="${saved}"]`);
        if (el) el.classList.add('active');
    }

    // Click handler: set active and store
    links.forEach(link => {
        link.addEventListener('click', function (e) {
            // If links navigate away, we still store active so it can be restored after reload.
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            localStorage.setItem('activeSidebarLink', this.dataset.id);
        });
    });

    // Transaction functionality
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const transactionForm = document.getElementById('transactionForm');
    const transactionsContainer = document.getElementById('transactionsContainer');

    // Définir les catégories par type
const categories = {
    expense: ["Alimentation", "Transport", "Loisirs", "Logement", "Sante", "Education", "Autre"],
    income: ["Salaire", "Revenus passifs", "Cadeaux", "Vente", "Autre"]
};

// Mettre à jour les options en fonction du type choisi
const typeSelect = document.getElementById("transactionType");
const categorySelect = document.getElementById("transactionCategory");

typeSelect.addEventListener("change", () => {
    const selectedType = typeSelect.value;

    // Vider les options existantes
    categorySelect.innerHTML = '<option value="">Sélectionner</option>';

    // Ajouter les options correspondant au type
    if (selectedType && categories[selectedType]) {
        categories[selectedType].forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.toLowerCase();
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
});

    // Set default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;

    // Apply accent color to sidebar
    const accentColor = localStorage.getItem('accentColor') || '#2563eb';
    const aside = document.querySelector('aside');
    if (aside) {
        const darkerColor = darkenColor(accentColor, 30);
        aside.style.background = `linear-gradient(180deg, ${accentColor} 0%, ${darkerColor} 100%)`;
    }

    // Form submission
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(transactionForm);
        const transaction = {
            id: Date.now(),
            type: formData.get('transactionType'),
            category: formData.get('transactionCategory'),
            amount: parseFloat(formData.get('transactionAmount')),
            date: formData.get('transactionDate'),
            description: formData.get('transactionDescription') || ''
        };

        if (transaction.type && transaction.category && transaction.amount > 0 && transaction.date) {
            transactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            renderTransactions();
            transactionForm.reset();
            document.getElementById('transactionDate').value = today;
            alert('Transaction ajoutée avec succès !');
        } else {
            alert('Veuillez remplir tous les champs correctement.');
        }
    });

    // Render transactions
    function renderTransactions() {
        transactionsContainer.innerHTML = '';
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(transaction => {
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
                    <div class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}" style="font-size: 18px; font-weight: 700;">${sign}${transaction.amount.toFixed(2)} €</div>
                    <div style="padding: 0px 10px 0px;">
                        <button class="edit-btn" data-id="${transaction.id}" style="background-color: #3498db; border: none; color: white; cursor: pointer; margin-right: 10px; padding: 7px; border-radius: 4px;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="delete-btn" data-id="${transaction.id}" style="background-color: #e74c3c; border: none; color: white; cursor: pointer; padding: 7px; border-radius: 4px;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;

            transactionsContainer.appendChild(transactionItem);
        });

        // Add event listeners for edit and delete
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editTransaction(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteTransaction(id);
            });
        });
    }

    function editTransaction(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        // Simple edit: prompt for new amount
        const newAmount = prompt('Nouveau montant:', transaction.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            transaction.amount = parseFloat(newAmount);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            renderTransactions();
        }
    }

    function deleteTransaction(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
            const index = transactions.findIndex(t => t.id === id);
            if (index > -1) {
                transactions.splice(index, 1);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                renderTransactions();
            }
        }
    }

    function getCategoryIcon(category) {
        const icons = {
            alimentation: 'fas fa-utensils',
            transport: 'fas fa-car',
            loisirs: 'fas fa-gamepad',
            logement: 'fas fa-home',
            sante: 'fas fa-heartbeat',
            education: 'fas fa-graduation-cap',
            salaire: 'fas fa-money-bill-wave',
            autre: 'fas fa-ellipsis-h'
        };
        return icons[category] || 'fas fa-question';
    }

    function getCategoryName(category) {
        const names = {
            alimentation: 'Alimentation',
            transport: 'Transport',
            loisirs: 'Loisirs',
            logement: 'Logement',
            sante: 'Santé',
            education: 'Éducation',
            salaire: 'Salaire',
            autre: 'Autre'
        };
        return names[category] || category;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    // Initial render
    renderTransactions();
});

