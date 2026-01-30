document.addEventListener('DOMContentLoaded', function () {
    // 1. GESTION DU PROFIL (NOUVEAU)
    function loadProfileInfo() {
        const userName = localStorage.getItem('userName') || 'Utilisateur';
        const userPhoto = localStorage.getItem('userImage'); // Clé utilisée pour la photo en Base64

        const nameElement = document.getElementById('userNameDisplay');
        const photoElement = document.getElementById('userPhotoDisplay');

        if (nameElement) nameElement.textContent = userName;
        if (photoElement && userPhoto) {
            photoElement.src = userPhoto;
        }
    }

    // 2. GESTION DE LA NAVIGATION
    const links = document.querySelectorAll('aside .nav a');
    if (links.length) {
        links.forEach((link, i) => { if (!link.dataset.id) link.dataset.id = i; });
        const saved = localStorage.getItem('activeSidebarLink');
        if (saved) {
            const el = document.querySelector(`aside .nav a[data-id="${saved}"]`);
            if (el) el.classList.add('active');
        }
        links.forEach(link => {
            link.addEventListener('click', function () {
                links.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                localStorage.setItem('activeSidebarLink', this.dataset.id);
            });
        });
    }

    // VARIABLE D'ÉTAT POUR LE TABLEAU
    let isExpanded = false; 

    // 3. VARIABLES ET ÉLÉMENTS
    const tableBody = document.getElementById('dashboardTransactionBody');
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const timeButtons = document.querySelectorAll('.graphic .button button');
    const budgetSelect = document.querySelector('.category select');
    const toggleBtn = document.getElementById('toggleTransactions');
    
    const modal = document.getElementById('confirmModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const clearBtn = document.getElementById('clearDashboardBtn');

    let pieChart, barChart;

    // 4. FONCTIONS DE RENDU
    function renderDashboardTransactions() {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const btnText = toggleBtn ? toggleBtn.querySelector('.btn-text') : null;
        
        const typeVal = filterType.value;
        const catVal = filterCategory.value;
        
        let filtered = transactions.filter(t => {
            const isNotHidden = t.hiddenOnDashboard !== true;
            const matchesType = (typeVal === 'all' || t.type === typeVal);
            const matchesCat = (catVal === 'all' || t.category === catVal);
            return isNotHidden && matchesType && matchesCat;
        });

        filtered.sort((a, b) => b.id - a.id);

        if (toggleBtn) {
            toggleBtn.parentElement.style.display = filtered.length > 4 ? 'flex' : 'none';
            if (isExpanded) {
                toggleBtn.classList.add('active');
                if (btnText) btnText.textContent = "Voir moins";
            } else {
                toggleBtn.classList.remove('active');
                if (btnText) btnText.textContent = "Voir plus";
            }
        }

        const displayList = isExpanded ? filtered : filtered.slice(0, 4);
        tableBody.innerHTML = ''; 

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 60px 0;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #718096;">
                            <i class="fas fa-folder-open" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i>
                            <p style="margin: 0; font-size: 15px;">Aucune transaction récente effectuée</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        displayList.forEach(t => {
            const row = document.createElement('tr');
            const isInc = t.type === 'income';
            row.innerHTML = `
                <td>${new Date(t.date).toLocaleDateString('fr-FR')}</td>
                <td>${t.description || '-'}</td>
                <td>${t.category}</td>
                <td><span class="badge ${isInc ? 'badge-income' : 'badge-expense'}">${isInc ? 'Revenu' : 'Dépense'}</span></td>
                <td class="${isInc ? 'amount-income' : 'amount-expense'}">${isInc ? '+' : '-'}${t.amount.toLocaleString()} FCFA</td>
                <td>
                    <button onclick="deleteTransaction(${t.id})" style="color: #f44336; border: none; background: none; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function updateSummaryCards() {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        let inc = 0, exp = 0;
        
        transactions.forEach(t => { 
            if(t.type === 'income') inc += t.amount; else exp += t.amount; 
        });

        const cards = document.querySelectorAll('.stats-value');
        if (cards.length >= 3) {
            cards[0].textContent = `${(inc - exp).toLocaleString()} FCFA`;
            cards[1].textContent = `${inc.toLocaleString()} FCFA`;
            cards[2].textContent = `${exp.toLocaleString()} FCFA`;
        }
    }

    // 5. LOGIQUE DES GRAPHIQUES
    function initCharts() {
        const pieCtx = document.getElementById('piechart').getContext('2d');
        const barCtx = document.getElementById('barchart').getContext('2d');
        pieChart = new Chart(pieCtx, { type: 'pie', options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
        barChart = new Chart(barCtx, { type: 'bar', options: { responsive: true, scales: { y: { beginAtZero: true } } } });
        updatePieChart('7J');
        updateBarChart('Mois');
    }

    function updatePieChart(period) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const now = new Date();
        const filtered = transactions.filter(t => {
            const d = new Date(t.date);
            if (period === '7J') return (now - d) / (1000*60*60*24) <= 7;
            if (period === '1M') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (period === '1A') return d.getFullYear() === now.getFullYear();
            return true;
        });
        const data = {};
        filtered.filter(t => t.type === 'expense').forEach(t => {
            data[t.category] = (data[t.category] || 0) + t.amount;
        });
        pieChart.data = {
            labels: Object.keys(data),
            datasets: [{ data: Object.values(data), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
        };
        pieChart.update();
    }

    function updateBarChart(scope) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const now = new Date();
        const filtered = transactions.filter(t => {
            const d = new Date(t.date);
            return scope === 'Mois' ? (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) : d.getFullYear() === now.getFullYear();
        });
        const cats = [...new Set(transactions.map(t => t.category))];
        barChart.data = {
            labels: cats,
            datasets: [
                { label: 'Dépenses', data: cats.map(c => filtered.filter(t => t.type === 'expense' && t.category === c).reduce((s, t) => s + t.amount, 0)), backgroundColor: '#FF6384' },
                { label: 'Revenus', data: cats.map(c => filtered.filter(t => t.type === 'income' && t.category === c).reduce((s, t) => s + t.amount, 0)), backgroundColor: '#36A2EB' }
            ]
        };
        barChart.update();
    }

    function updateCategoryFilter() {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        if (!filterCategory) return;
        const uniqueCategories = [...new Set(transactions.map(t => t.category.trim()))];
        filterCategory.innerHTML = '<option value="all">Toutes les catégories</option>';
        uniqueCategories.forEach(cat => {
            if (cat) {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                filterCategory.appendChild(option);
            }
        });
    }

    // 6. ÉCOUTEURS D'ÉVÉNEMENTS
    if (clearBtn) clearBtn.addEventListener('click', () => modal.style.display = 'flex');
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.style.display = 'none');

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            const updatedTransactions = transactions.map(t => ({ ...t, hiddenOnDashboard: true }));
            localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
            modal.style.display = 'none';
            renderDashboardTransactions();
        });
    }

    filterType.addEventListener('change', renderDashboardTransactions);
    filterCategory.addEventListener('change', renderDashboardTransactions);
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            renderDashboardTransactions();
        });
    }
    
    timeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            timeButtons.forEach(b => b.classList.remove('active-time'));
            this.classList.add('active-time');
            updatePieChart(this.textContent);
        });
    });

    if (budgetSelect) {
        budgetSelect.addEventListener('change', function() {
            updateBarChart(this.value);
        });
    }

    // 7. LANCEMENT
    loadProfileInfo(); // On charge le nom et la photo
    updateCategoryFilter();
    updateSummaryCards();
    renderDashboardTransactions();
    initCharts();
});

// FONCTION DE MASQUAGE INDIVIDUELLE
window.deleteTransaction = function(id) {
    if (confirm("Masquer cette transaction du Dashboard ?")) {
        let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions = transactions.map(t => {
            if (t.id === id) return { ...t, hiddenOnDashboard: true };
            return t;
        });
        localStorage.setItem('transactions', JSON.stringify(transactions));
        location.reload(); // Rechargement simple pour mettre à jour la vue
    }
}