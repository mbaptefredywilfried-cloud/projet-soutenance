document.addEventListener('DOMContentLoaded', function () {
    // 1. GESTION DU PROFIL (MISE À JOUR AVEC ICÔNE PAR DÉFAUT)
    function loadProfileInfo() {
        const userName = localStorage.getItem('userName') || 'Utilisateur';
        const userPhoto = localStorage.getItem('userImage');

        const nameElement = document.getElementById('userNameDisplay');
        const photoContainer = document.querySelector('.profile-circle');

        if (nameElement) nameElement.textContent = userName;

        if (photoContainer) {
            // Si une photo existe dans le localStorage (Base64)
            if (userPhoto && userPhoto.trim() !== "") {
                photoContainer.innerHTML = `<img src="${userPhoto}" id="userPhotoDisplay" alt="Profil" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                // Sinon, on affiche l'icône Font Awesome
                photoContainer.innerHTML = `<i class="fas fa-user" id="userPhotoDisplay" style="font-size: 1.2rem;"></i>`;
            }
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

    // 3. VARIABLES ET ÉLÉMENTS
    const tableBody = document.getElementById('dashboardTransactionBody');
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const timeButtons = document.querySelectorAll('.graphic .button button');
    const budgetSelect = document.querySelector('.category select');
    const toggleBtn = document.getElementById('toggleTransactions');
    
    let pieChart, barChart;

    // 4. FONCTIONS DE RENDU
    function renderDashboardTransactions() {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        
        const typeVal = filterType ? filterType.value : 'all';
        const catVal = filterCategory ? filterCategory.value : 'all';
        
        let filtered = transactions.filter(t => {
            const matchesType = (typeVal === 'all' || t.type === typeVal);
            const matchesCat = (catVal === 'all' || t.category === catVal);
            return matchesType && matchesCat;
        });

        filtered.sort((a, b) => b.id - a.id);

        if (toggleBtn) {
            toggleBtn.parentElement.style.display = filtered.length > 3 ? 'flex' : 'none';
        }

        const displayList = filtered.slice(0, 3);
        if (tableBody) {
            tableBody.innerHTML = ''; 

            if (filtered.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 60px 0;">
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
                `;
                tableBody.appendChild(row);
            });
        }
    }

    function updateSummaryCards() {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        let inc = 0, exp = 0;
        
        transactions.forEach(t => { 
            if(t.type === 'income') inc += t.amount; else exp += t.amount; 
        });

        const cards = document.querySelectorAll('.stats-value');
        if (cards.length >= 3) {
            const soldeAffiche = Math.max(0, inc - exp);
            cards[0].textContent = `${soldeAffiche.toLocaleString()} FCFA`;
            cards[1].textContent = `${inc.toLocaleString()} FCFA`;
            cards[2].textContent = `${exp.toLocaleString()} FCFA`;
        }
    }

    // 5. LOGIQUE DES GRAPHIQUES
    function initCharts() {
        const pieCanvas = document.getElementById('piechart');
        const barCanvas = document.getElementById('barchart');
        
        if (!pieCanvas || !barCanvas) return;

        const pieCtx = pieCanvas.getContext('2d');
        const barCtx = barCanvas.getContext('2d');
        
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(pieCtx, { 
            type: 'pie', 
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'left' } } 
            } 
        });

        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, { type: 'bar', options: { responsive: true, scales: { y: { beginAtZero: true } } } });
        
        updatePieChart('7J');
        updateBarChart('Mois');
    }

    function updatePieChart(period) {
        if (!pieChart) return;
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
            const cat = t.category.charAt(0).toUpperCase() + t.category.slice(1);
            data[cat] = (data[cat] || 0) + t.amount;
        });

        pieChart.data = {
            labels: Object.keys(data),
            datasets: [{ 
                data: Object.values(data), 
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] 
            }]
        };
        pieChart.update();
    }

    function updateBarChart(scope) {
        if (!barChart) return;
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const now = new Date();
        const filtered = transactions.filter(t => {
            const d = new Date(t.date);
            return scope === 'Mois' ? (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) : d.getFullYear() === now.getFullYear();
        });

        const cats = [...new Set(transactions.map(t => {
            const cat = t.category.trim();
            return cat.charAt(0).toUpperCase() + cat.slice(1);
        }))];

        barChart.data = {
            labels: cats,
            datasets: [
                { 
                    label: 'Dépenses', 
                    data: cats.map(c => filtered.filter(t => t.type === 'expense' && (t.category.charAt(0).toUpperCase() + t.category.slice(1)) === c).reduce((s, t) => s + t.amount, 0)), 
                    backgroundColor: '#FF6384' 
                },
                { 
                    label: 'Revenus', 
                    data: cats.map(c => filtered.filter(t => t.type === 'income' && (t.category.charAt(0).toUpperCase() + t.category.slice(1)) === c).reduce((s, t) => s + t.amount, 0)), 
                    backgroundColor: '#36A2EB' 
                }
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
    if (filterType) filterType.addEventListener('change', renderDashboardTransactions);
    if (filterCategory) filterCategory.addEventListener('change', renderDashboardTransactions);
    
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
    loadProfileInfo();
    updateCategoryFilter();
    updateSummaryCards();
    renderDashboardTransactions();
    initCharts();
});

// GESTION DE L'ÉTAT VIDE DES GRAPHIQUES
function checkEmptyChart() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const chartContainer = document.querySelector('.dashed');
    const accentColor = localStorage.getItem('accentColor') || '#2563eb';

    if (!chartContainer) return;

    if (transactions.length === 0) {
        chartContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 250px; text-align: center; color: #a0aec0;">
                <i class="fa-solid fa-chart-pie" style="font-size: 3.5rem; margin-bottom: 15px; color: ${accentColor}; opacity: 0.3;"></i>
                <p style="font-weight: 600; color: #64748b; margin: 0; font-size: 18px;">Aucune donnée</p>
                <span style="font-size: 0.85rem; font-weight: 500; margin-top: 5px;">Ajoutez des transactions pour voir l'analyse.</span>
            </div>
        `;
    } else {
        if (!document.getElementById('piechart')) {
            chartContainer.innerHTML = '<canvas id="piechart"></canvas>';
        }
    }
}

document.addEventListener('DOMContentLoaded', checkEmptyChart);