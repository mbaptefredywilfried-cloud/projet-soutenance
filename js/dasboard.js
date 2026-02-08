document.addEventListener('DOMContentLoaded', function () {
    // --- 0. INITIALISATION DE L'ACCENT COULEUR ---
    const savedAccentColor = localStorage.getItem('accentColor') || '#2563eb';
    
    // Fonction pour appliquer l'accent au dashboard
    function applyDashboardAccentColor(color) {
        // Appliquer la couleur au bouton "voir plus"
        const viewMoreBtn = document.querySelector('.btn-view-more');
        if (viewMoreBtn) {
            viewMoreBtn.style.color = color;
            viewMoreBtn.style.borderColor = color;
        }
        
        // Appliquer aussi aux autres éléments si la fonction globale existe
        if (typeof applyAccentColor === 'function') {
            applyAccentColor(color);
        }
    }
    
    // Appliquer l'accent initial
    applyDashboardAccentColor(savedAccentColor);
    
    // Écouter les changements d'accent (depuis les paramètres)
    window.addEventListener('storage', (e) => {
        if (e.key === 'accentColor') {
            const newColor = e.newValue || '#2563eb';
            applyDashboardAccentColor(newColor);
        }
    });

    // ============ AJOUT: MENU BURGER POUR MOBILE ============
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
            } else {
                document.body.style.overflow = '';
            }
        });
        
        overlay.addEventListener('click', function() {
            menuBurger.classList.remove('active');
            sidebar.classList.remove('active');
            this.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Mettre à jour la photo de profil mobile si elle existe
        const mobilePhoto = document.getElementById('mobileUserPhoto');
        if (mobilePhoto) {
            const userPhoto = localStorage.getItem('userImage');
            if (userPhoto && userPhoto.trim() !== "") {
                mobilePhoto.src = userPhoto;
            }
        }
    }
    // ============ FIN AJOUT ============

    // 1. GESTION DU PROFIL (MISE À JOUR AVEC ICÔNE PAR DÉFAUT)
    // Charger le profil utilisateur depuis le serveur (session)
let __profileCache = null;

function loadProfileInfo() {
    fetch('php/data/user_profile.php?action=get', { credentials: 'same-origin' })
        .then(resp => {
            if (!resp.ok) throw new Error('Not authenticated');
            return resp.json();
        })
        .then(data => {
            if (!data.success) throw new Error('No profile');
            __profileCache = data.user || {};
            const userName = __profileCache.username || 'Utilisateur';
            const userEmail = __profileCache.email || '';
            const userPhoto = __profileCache.image || null; // optional server-side image

            // Mettre à jour le nom d'utilisateur
            const nameElement = document.getElementById('userNameDisplay');
            if (nameElement) nameElement.textContent = userName;

            // Mettre à jour l'email
            const emailElement = document.getElementById('userEmailDisplay');
            if (emailElement) emailElement.textContent = userEmail;

            // Mettre à jour la photo de profil DESKTOP (dans la top bar)
            const desktopPhotoContainer = document.querySelector('.top-bar .profile-circle');
            if (desktopPhotoContainer) {
                if (userPhoto && userPhoto.trim() !== "") {
                    desktopPhotoContainer.innerHTML = `<img src="${userPhoto}" id="userPhotoDisplay" alt="Profil" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    desktopPhotoContainer.innerHTML = `<i class="fas fa-user" id="userPhotoDisplay" style="font-size: 1.2rem; color: var(--primary-color);"></i>`;
                }
            }

            // Mettre à jour la photo de profil MOBILE (dans le header)
            const mobilePhoto = document.getElementById('mobileUserPhoto');
            if (mobilePhoto) {
                if (userPhoto && userPhoto.trim() !== "") {
                    mobilePhoto.src = userPhoto;
                } else {
                    mobilePhoto.src = "./assets/default-avatar.png";
                }
            }

            // Mettre à jour la photo dans la sidebar (si elle existe)
            const sidebarProfile = document.querySelector('.profile-circle:not(.top-bar .profile-circle)');
            if (sidebarProfile) {
                if (userPhoto && userPhoto.trim() !== "") {
                    sidebarProfile.innerHTML = `<img src="${userPhoto}" alt="Profil" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    sidebarProfile.innerHTML = `<i class="fas fa-user" style="font-size: 1.2rem; color: white;"></i>`;
                }
            }

            // Mettre à jour les stats du compte
            handleAccountStats();
        })
        .catch(err => {
            console.warn('loadProfileInfo:', err);
            // Laisser common.enforceAuth gérer la redirection si nécessaire
        });
}

function handleAccountStats() {
    const accountIdEl = document.getElementById('accountId');
    const accountCreatedEl = document.getElementById('accountCreated');
    if (__profileCache) {
        if (accountIdEl) accountIdEl.textContent = __profileCache.id || '—';
        if (accountCreatedEl) accountCreatedEl.textContent = __profileCache.created_at || '—';
    } else {
        if (accountIdEl) accountIdEl.textContent = '—';
        if (accountCreatedEl) accountCreatedEl.textContent = '—';
    }
}


    // 2. VARIABLES ET ÉLÉMENTS
    const tableBody = document.getElementById('dashboardTransactionBody');
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const timeButtons = document.querySelectorAll('.graphic .button button');
    const budgetSelect = document.querySelector('.category select');
    const toggleBtn = document.getElementById('toggleTransactions');
    
    let pieChart, barChart;

    // 3. FONCTIONS DE RENDU
    // Formatage spécifique pour les cartes du dashboard : espace milliers + point décimal 2 décimales
    function formatAmountDash(amount) {
        const num = Number(amount) || 0;
        const fixed = num.toFixed(2); // '30000.00'
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join('.');
    }
    function renderDashboardTransactions() {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const currencySymbol = localStorage.getItem('appCurrency') || '€';
        
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
                    <td class="${isInc ? 'amount-income' : 'amount-expense'}">${isInc ? '+' : '-'}${t.amount.toLocaleString()} ${currencySymbol}</td>
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
        const currencySymbol = localStorage.getItem('appCurrency') || '€';
        if (cards.length >= 3) {
            const soldeAffiche = Math.max(0, inc - exp);
            cards[0].textContent = `${formatAmountDash(soldeAffiche)} ${currencySymbol}`;
            cards[1].textContent = `${formatAmountDash(inc)} ${currencySymbol}`;
            cards[2].textContent = `${formatAmountDash(exp)} ${currencySymbol}`;
        }
    }

    // 4. LOGIQUE DES GRAPHIQUES
    function initCharts() {
        const pieCanvas = document.getElementById('piechart');
        const barCanvas = document.getElementById('barchart');
        
        if (!pieCanvas || !barCanvas) return;

        const pieCtx = pieCanvas.getContext('2d');
        const barCtx = barCanvas.getContext('2d');
        
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(pieCtx, { 
            type: 'doughnut', 
            data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { 
                    legend: { position: 'left' }
                }
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
        
        // 1. Filtrage par période
        const periodFiltered = transactions.filter(t => {
            const d = new Date(t.date);
            if (period === '7J') return (now - d) / (1000*60*60*24) <= 7;
            if (period === '1M') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (period === '1A') return d.getFullYear() === now.getFullYear();
            return true;
        });

        // 2. Filtrage strict : UNIQUEMENT les dépenses
        const expenseDataOnly = periodFiltered.filter(t => t.type === 'expense');

        // 3. CONDITION CRUCIALE : Si aucune dépense, on force l'état "Aucune donnée"
        if (expenseDataOnly.length === 0) {
            // On détruit le chart et on appelle l'affichage vide
            if (pieChart) {
                pieChart.destroy();
                pieChart = null; 
            }
            showEmptyPieState(); 
            return;
        }

        // 4. Si on a des dépenses, on s'assure que le canvas existe
        ensurePieCanvasExists();

        const dataMap = {};
        expenseDataOnly.forEach(t => {
            const cat = t.category.charAt(0).toUpperCase() + t.category.slice(1);
            dataMap[cat] = (dataMap[cat] || 0) + t.amount;
        });

        const labels = Object.keys(dataMap);
        const values = Object.values(dataMap);
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

        pieChart.data = {
            labels: labels,
            datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length) }]
        };

        pieChart.update();
    }

    function updateBarChart(scope) {
        if (!barChart) return;
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const now = new Date();
        
        // Noms des mois
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        // Afficher les 3 derniers mois (glissants)
        let months = [];
        for (let i = 2; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ month: d.getMonth(), year: d.getFullYear() });
        }
        
        // Calculer revenus et dépenses par mois
        const revenueByMonth = months.map(m => {
            return transactions
                .filter(t => {
                    const d = new Date(t.date);
                    return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'income';
                })
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        const expenseByMonth = months.map(m => {
            return transactions
                .filter(t => {
                    const d = new Date(t.date);
                    return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'expense';
                })
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        // Créer les labels des mois
        const labels = months.map(m => monthNames[m.month]);
        
        barChart.data = {
            labels: labels,
            datasets: [
                { 
                    label: 'Revenu', 
                    data: revenueByMonth,
                    backgroundColor: '#36A2EB' 
                },
                { 
                    label: 'Dépense', 
                    data: expenseByMonth,
                    backgroundColor: '#FF6384' 
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

    // 5. ÉCOUTEURS D'ÉVÉNEMENTS
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

    // 6. LANCEMENT
    loadProfileInfo();
    updateCategoryFilter();
    updateSummaryCards();
    renderDashboardTransactions();
    initCharts();
});

// GESTION DE L'ÉTAT VIDE DES GRAPHIQUES
function showEmptyPieState() {
    const chartContainer = document.querySelector('.dashed');
    const accentColor = localStorage.getItem('accentColor') || '#2563eb';
    if (!chartContainer) return;

    chartContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 250px; text-align: center; color: #a0aec0;">
            <i class="fa-solid fa-chart-pie" style="font-size: 3.5rem; margin-bottom: 15px; color: ${accentColor}; opacity: 0.3;"></i>
            <p style="font-weight: 600; color: #64748b; margin: 0; font-size: 18px;">Aucune dépense</p>
            <span style="font-size: 0.85rem; font-weight: 500; margin-top: 5px;">Ajoutez des dépenses pour voir la répartition.</span>
        </div>
    `;
}

function ensurePieCanvasExists() {
    const chartContainer = document.querySelector('.dashed');
    if (chartContainer && !document.getElementById('piechart')) {
        chartContainer.innerHTML = '<canvas id="piechart"></canvas>';
        const pieCtx = document.getElementById('piechart').getContext('2d');
        pieChart = new Chart(pieCtx, { 
            type: 'doughnut', 
            data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                cutout: '60%',
                plugins: { legend: { position: 'left' } }
            }
        });
    }
}