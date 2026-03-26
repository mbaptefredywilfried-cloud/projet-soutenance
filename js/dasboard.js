document.addEventListener('DOMContentLoaded', function () {
    // --- CACHE GLOBAL ---
    let __transactionsCache = null;
    let __cacheTimestamp = 0;
    const CACHE_DURATION = 5000; // 5 secondes

    async function getTransactionsData() {
        const now = Date.now();
        if (__transactionsCache && (now - __cacheTimestamp) < CACHE_DURATION) {
            return __transactionsCache;
        }
        try {
            const response = await fetch('php/transactions/list.php', { credentials: 'same-origin' });
            const data = await response.json();
            __transactionsCache = data.status === 'success' ? data.data : [];
            __cacheTimestamp = now;
            return __transactionsCache;
        } catch (e) {
            console.error('Erreur fetch transactions:', e);
            return [];
        }
    }

    // --- 0. SYNCHRONISATION DE LA COULEUR D'ACCENT ---
    function setAccentColorVar(color) {
        document.documentElement.style.setProperty('--accent-color', color);
    }

    const savedAccentColor = localStorage.getItem('accentColor') || '#36A2EB';
    setAccentColorVar(savedAccentColor);

    // Réagit au changement de couleur d'accent (depuis paramètres)
    window.addEventListener('storage', (e) => {
        if (e.key === 'accentColor') {
            const newColor = e.newValue || '#36A2EB';
            setAccentColorVar(newColor);
        }
    });

    // ...existing code...

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
    let lineChart;

    // 3. FONCTIONS DE RENDU
    // Formatage spécifique pour les cartes du dashboard : espace milliers + point décimal 2 décimales
    function formatAmountDash(amount) {
        const num = Number(amount) || 0;
        const fixed = num.toFixed(2); // '30000.00'
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join('.');
    }
    async function renderDashboardTransactions() {
        try {
            const transactions = await getTransactionsData();
            const currencySymbol = window.appCurrency || 'EUR';
            const typeVal = filterType ? filterType.value : 'all';
            const catVal = filterCategory ? filterCategory.value : 'all';
            let filtered = transactions.filter(t => {
                const matchesType = (typeVal === 'all' || t.category_type === typeVal);
                const matchesCat = (catVal === 'all' || t.category_name === catVal);
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
                    const currentLang = document.documentElement.lang || 'fr';
                    const t = translations[currentLang] || translations['fr'];
                    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 60px 0;"><div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #718096;"><i class="fas fa-folder-open" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i><p style="margin: 0; font-size: 15px;" data-i18n="noRecentTransaction">${t.noRecentTransaction}</p></div></td></tr>`;
                    return;
                }
                displayList.forEach(t => {
                    const row = document.createElement('tr');
                    const isInc = t.category_type === 'income';
                    let dateAffiche = '-';
                    if (t.date) {
                        const d = new Date(t.date);
                        if (!isNaN(d.getTime())) {
                            dateAffiche = d.toLocaleDateString('fr-FR');
                        } else {
                            dateAffiche = t.date;
                        }
                    }
                    const currentLang = document.documentElement.lang || 'fr';
                    const translationsObj = window.translations || translations;
                    const typeLabel = translationsObj[currentLang]?.[isInc ? 'income' : 'expense'] || (isInc ? 'Revenu' : 'Dépense');
                    // Traduction de la catégorie
                    let categoryLabel = t.category_name;
                    if (t.category_translation_key && translationsObj[currentLang] && translationsObj[currentLang][t.category_translation_key]) {
                        categoryLabel = translationsObj[currentLang][t.category_translation_key];
                    }
                    row.innerHTML = `<td>${dateAffiche}</td><td>${t.description || '-'} </td><td>${categoryLabel}</td><td><span class="badge ${isInc ? 'badge-income' : 'badge-expense'}">${typeLabel}</span></td><td class="${isInc ? 'amount-income' : 'amount-expense'}">${isInc ? '+' : '-'}${parseFloat(t.amount).toLocaleString()} ${currencySymbol}</td>`;
                    tableBody.appendChild(row);
                });
            }
        // Met à jour dynamiquement le message "Aucune transaction récente effectuée" lors du changement de langue
        window.addEventListener('languageChanged', function() {
            const tableBody = document.getElementById('dashboardTransactionBody');
            if (tableBody && tableBody.querySelector('[data-i18n="noRecentTransaction"]')) {
                const currentLang = document.documentElement.lang || 'fr';
                const t = translations[currentLang] || translations['fr'];
                tableBody.querySelector('[data-i18n="noRecentTransaction"]').textContent = t.noRecentTransaction;
            }
        });
        } catch (e) {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" data-i18n="loadingError">${translations.fr.loadingError}</td></tr>`;
        }
    }

    async function updateSummaryCards() {
        try {
            const transactions = await getTransactionsData();
            let incMois = 0;
            let expTotal = 0;
            const now = new Date();
            transactions.forEach(t => {
                // Somme de tous les revenus du mois
                let d;
                if (t.date) {
                    d = new Date(t.date);
                    if (isNaN(d.getTime())) {
                        const parts = t.date.split(' ');
                        if (parts.length === 3) {
                            const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
                            const moisIndex = mois.findIndex(m => m === parts[1].toLowerCase());
                            if (moisIndex !== -1) {
                                d = new Date(parseInt(parts[2]), moisIndex, parseInt(parts[0]));
                            }
                        }
                    }
                } else if (t.transaction_date) {
                    d = new Date(t.transaction_date);
                } else {
                    d = new Date();
                }
                if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                    if(t.category_type === 'income') incMois += parseFloat(t.amount);
                }
                // Somme de toutes les dépenses (toutes périodes)
                if(t.category_type === 'expense') expTotal += parseFloat(t.amount);
            });
            const cards = document.querySelectorAll('.stats-value');
            const currencySymbol = window.appCurrency || 'EUR';
            if (cards.length >= 3) {
                let soldeAffiche = incMois - expTotal;
                if (soldeAffiche < 0) soldeAffiche = 0;
                // Debug temporaire
                // console.log('Solde:', soldeAffiche, 'Revenus:', incMois, 'Dépenses:', expTotal);
                cards[0].textContent = `${formatAmountDash(soldeAffiche)} ${currencySymbol}`;
                cards[1].textContent = `${formatAmountDash(incMois)} ${currencySymbol}`;
                // Affichage strict du montant (pas de Math.max)
                cards[2].textContent = `${formatAmountDash(Number(expTotal))} ${currencySymbol}`;
                
                // Mettre à jour les indicateurs dynamiquement
                // Calculer les données du mois précédent
                const lastMonthDate = new Date();
                lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
                
                let incMoisPrecedent = 0;
                let expMoisPrecedent = 0;
                
                transactions.forEach(t => {
                    let d;
                    if (t.date) {
                        d = new Date(t.date);
                    } else if (t.transaction_date) {
                        d = new Date(t.transaction_date);
                    } else {
                        d = new Date();
                    }
                    
                    // Vérifier si c'est le mois précédent
                    if (d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear()) {
                        if(t.category_type === 'income') incMoisPrecedent += parseFloat(t.amount);
                        if(t.category_type === 'expense') expMoisPrecedent += parseFloat(t.amount);
                    }
                });
                
                // Appeler la fonction pour mettre à jour les indicateurs
                updateStatsIndicators(incMois, expTotal, incMoisPrecedent, expMoisPrecedent);
            }
        } catch (e) {
            console.error('[DEBUG] Erreur lors de la mise à jour des cartes dashboard:', e);
        }
    }
    
    // Fonction pour mettre à jour les indicateurs de variation
    function updateStatsIndicators(incMois, expTotal, incMoisPrecedent, expMoisPrecedent) {
        const indicators = document.querySelectorAll('.stats-indicator');
        
        if (indicators.length >= 3) {
            // Indicateur 1 : Solde Total
            const soldeActuel = incMois - expTotal;
            const soldePrecedent = incMoisPrecedent - expMoisPrecedent;
            const variationSolde = soldePrecedent !== 0 ? ((soldeActuel - soldePrecedent) / Math.abs(soldePrecedent) * 100) : (soldeActuel > 0 ? 100 : 0);
            
            updateIndicator(indicators[0], variationSolde);
            
            // Indicateur 2 : Revenus du mois (toujours positif = bon)
            const variationIncome = incMoisPrecedent > 0 ? ((incMois - incMoisPrecedent) / incMoisPrecedent * 100) : (incMois > 0 ? 100 : 0);
            updateIndicator(indicators[1], variationIncome);
            
            // Indicateur 3 : Dépenses du mois (négatif = bon, positif = mauvais)
            const variationExpense = expMoisPrecedent > 0 ? ((expTotal - expMoisPrecedent) / expMoisPrecedent * 100) : (expTotal > 0 ? -100 : 0);
            updateIndicator(indicators[2], variationExpense);
        }
    }
    
    // Fonction utilitaire pour mettre à jour un indicateur
    function updateIndicator(indicator, percentage) {
        const span = indicator.querySelector('span');
        const icon = indicator.querySelector('i');
        
        if (!span || !icon) return;
        
        // Déterminer le type et l'icône basés sur le pourcentage
        let type = 'neutral';
        
        if (percentage > 0.5) { // Plus de 0.5% d'augmentation = positif
            type = 'positive';
            icon.className = 'fas fa-arrow-trend-up';
            span.textContent = `+${Math.abs(percentage).toFixed(1)}%`;
        } else if (percentage < -0.5) { // Plus de 0.5% de diminution = négatif
            type = 'negative';
            icon.className = 'fas fa-arrow-trend-down';
            span.textContent = `${percentage.toFixed(1)}%`;
        } else { // Entre -0.5% et +0.5% = neutre
            type = 'neutral';
            icon.className = 'fas fa-circle-notch';
            span.textContent = `~0%`;
        }
        
        // Mettre à jour les classes CSS
        indicator.classList.remove('indicator-positive', 'indicator-negative', 'indicator-neutral');
        indicator.classList.add(`indicator-${type}`);
    }

    // 4. LOGIQUE DES GRAPHIQUES
    function initCharts() {
        const pieCanvas = document.getElementById('piechart');
        const barCanvas = document.getElementById('barchart');
        const lineCanvas = document.getElementById('linechart');
        if (!pieCanvas || !barCanvas || !lineCanvas) return;

        const pieCtx = pieCanvas.getContext('2d');
        const barCtx = barCanvas.getContext('2d');
        const lineCtx = lineCanvas.getContext('2d');

        if (pieChart) pieChart.destroy();
        // Plugin pour texte centré
        const centerTextPlugin = {
            id: 'centerText',
            afterDraw(chart) {
                if (chart.config._centerText) {
                    const ctx = chart.ctx;
                    const txt = chart.config._centerText.text;
                    const fontSize = chart.config._centerText.fontSize || 13;
                    const color = chart.config._centerText.color || '#1e293b';
                    ctx.save();
                    ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const meta = chart.getDatasetMeta(0);
                    const arc = meta.data[0];
                    let x = chart.width / 2;
                    let y = chart.height / 2;
                    if (arc) {
                        x = arc.x;
                        y = arc.y;
                    }
                    // Multi-ligne
                    const lines = txt.split('\n');
                    const lineHeight = fontSize * 1.3;
                    const totalHeight = lineHeight * lines.length;
                    lines.forEach((line, i) => {
                        ctx.fillText(line, x, y - totalHeight/2 + i*lineHeight + lineHeight/2);
                    });
                    ctx.restore();
                }
            }
        };
        pieChart = new Chart(pieCtx, { 
            type: 'doughnut', 
            data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { 
                    legend: { position: 'right' }
                }
            },
            plugins: [centerTextPlugin]
        });

        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, { type: 'bar', options: { responsive: true, scales: { y: { beginAtZero: true } } } });

        if (lineChart) lineChart.destroy();
        lineChart = new Chart(lineCtx, { 
            type: 'line', 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { position: 'top' }
                },
                scales: { y: { beginAtZero: true } } 
            } 
        });

        updatePieChart('7J');
        updateBarChart('Mois');
        updateLineChart();
    }
    // Line Chart Dépense vs Revenu
    async function updateLineChart() {
        if (!lineChart) return;
        try {
            const transactions = await getTransactionsData();
                // Grouper par semaine (5 dernières semaines)
                const now = new Date();
                const weeks = [];
                for (let i = 4; i >= 0; i--) {
                    // Fin de semaine à 23:59:59.999
                    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
                    end.setHours(23, 59, 59, 999);
                    const start = new Date(end);
                    start.setDate(end.getDate() - 6);
                    start.setHours(0, 0, 0, 0);
                    weeks.push({ start, end });
                }
                // Labels dynamiques type 'Mar 02–08'
                const currentLang = document.documentElement.lang || 'fr';
                const t = translations[currentLang] || translations['fr'];
                const monthNames = t.monthsShort || [
                    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
                ];
                function pad2(n) { return n < 10 ? '0' + n : n; }
                const labels = weeks.map(w => {
                    const m = monthNames[w.start.getMonth()];
                    const d1 = pad2(w.start.getDate());
                    const d2 = pad2(w.end.getDate());
                    if (w.start.getMonth() === w.end.getMonth()) {
                        return `${m} ${d1}–${d2}`;
                    } else {
                        const m2 = monthNames[w.end.getMonth()];
                        return `${m} ${d1}–${m2} ${d2}`;
                    }
                });
                // Calculer revenus et dépenses par semaine
                const revenueByWeek = weeks.map(w => {
                    return transactions
                        .filter(t => {
                            const dateStr = t.transaction_date || t.date;
                            if (!dateStr) return false;
                            const d = new Date(dateStr);
                            return d >= w.start && d <= w.end && t.category_type === 'income';
                        })
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                });
                const expenseByWeek = weeks.map(w => {
                    return transactions
                        .filter(t => {
                            const dateStr = t.transaction_date || t.date;
                            if (!dateStr) return false;
                            const d = new Date(dateStr);
                            return d >= w.start && d <= w.end && t.category_type === 'expense';
                        })
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                });
                lineChart.data = {
                    labels: labels,
                    datasets: [
                        {
                            label: t.income || 'Revenu',
                            data: revenueByWeek,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            fill: '+1',
                            tension: 0.3
                        },
                        {
                            label: t.expense || 'Dépense',
                            data: expenseByWeek,
                            borderColor: '#FF6384',
                            backgroundColor: 'rgba(255, 99, 132, 0.15)',
                            fill: true,
                            tension: 0.3
                        }
                    ]
                };
                // Formatage axe Y avec la devise
                const currencySymbol = window.appCurrency || 'EUR';
                if (lineChart.options && lineChart.options.scales && lineChart.options.scales.y) {
                    lineChart.options.scales.y.ticks.callback = function(value) {
                        return formatAmountForChart(value) + ' ' + currencySymbol;
                    };
                }
                lineChart.update();
        } catch (e) {
            console.error('Erreur updateLineChart:', e);
        }
    }

   async function updatePieChart(period) {
        if (!pieChart) return;
        try {
            const transactions = await getTransactionsData();
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
                const expenseDataOnly = periodFiltered.filter(t => t.category_type === 'expense');
                // 3. CONDITION CRUCIALE : Si aucune dépense, on force l'état "Aucune donnée"
                if (expenseDataOnly.length === 0) {
                    if (pieChart) {
                        pieChart.destroy();
                        pieChart = null;
                    }
                    showEmptyPieState();
                    // Cache le texte du centre
                    const donutText = document.getElementById('donutCenterText');
                    if (donutText) donutText.textContent = '';
                    return;
                }
                // 4. Si on a des dépenses, on s'assure que le canvas existe
                ensurePieCanvasExists();
                const dataMap = {};
                const countMap = {}; // Map pour compter les transactions
                // Détecte la langue courante
                const currentLang = document.documentElement.lang || 'fr';
                expenseDataOnly.forEach(t => {
                    let catLabel = 'Autre';
                    // Utilise la clé de traduction si disponible
                    if (t.category_translation_key && translations[currentLang] && translations[currentLang][t.category_translation_key]) {
                        catLabel = translations[currentLang][t.category_translation_key];
                    } else if (t.category_name) {
                        catLabel = t.category_name.charAt(0).toUpperCase() + t.category_name.slice(1);
                    }
                    dataMap[catLabel] = (dataMap[catLabel] || 0) + parseFloat(t.amount);
                    countMap[catLabel] = (countMap[catLabel] || 0) + 1; // Incrémenter le compteur
                });
                const labels = Object.keys(dataMap).map(label => 
                    `${label} (${countMap[label]})`
                );
                const values = Object.values(dataMap);
                // Même couleurs, nouvel ordre
                const colors = [
                    '#36A2EB', // Bleu
                    '#fc7592', // Rose
                    '#FFCE56', // Jaune
                    '#C9CBCF', // Gris
                    '#29bbbb', // Cyan
                    '#c530ee', // Orange
                    '#8DD17E', // Vert
                    '#e2214ed8', // Rouge foncé
                    '#4e3b23c7', // Marron
                    '#2C73D2', // Bleu foncé
                    '#9D4EDD'  // Violet
                ];
                pieChart.data = {
                    labels: labels,
                    datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length) }]
                };
                // Ajout du texte centré via plugin
                const totalDepense = values.reduce((sum, v) => sum + v, 0);
                const currencySymbol = window.appCurrency || 'EUR';
                let centerTextLabel = (translations[currentLang] && translations[currentLang].totalExpenses) ? translations[currentLang].totalExpenses : 'Total dépenses';
                pieChart.config._centerText = {
                    text: `${centerTextLabel}\n${formatAmountDash(totalDepense)} ${currencySymbol}`,
                    fontSize: 13,
                    color: '#1e293b'
                };
                pieChart.update();
        } catch (e) {
            showEmptyPieState();
        }
    }

    function formatAmountForChart(amount) {
        if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'k';
        }
        return amount.toString();
    }

    async function updateBarChart(scope) {
        if (!barChart) return;
        try {
            const transactions = await getTransactionsData();
                const now = new Date();
                // Noms des mois dynamiques selon la langue
                const currentLang = document.documentElement.lang || 'fr';
                const t = translations[currentLang] || translations['fr'];
                const monthNames = t.monthsShort || [
                    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
                ];
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
                            return d.getMonth() === m.month && d.getFullYear() === m.year && t.category_type === 'income';
                        })
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                });
                const expenseByMonth = months.map(m => {
                    return transactions
                        .filter(t => {
                            const d = new Date(t.date);
                            return d.getMonth() === m.month && d.getFullYear() === m.year && t.category_type === 'expense';
                        })
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                });
                // Créer les labels des mois avec l'année
                const labels = months.map(m => `${monthNames[m.month]} ${m.year}`);
                barChart.data = {
                    labels: labels,
                    datasets: [
                        { 
                            label: t.income || 'Revenu', 
                            data: revenueByMonth,
                            backgroundColor: '#10b981' // vert
                        },
                        { 
                            label: t.expense || 'Dépense', 
                            data: expenseByMonth,
                            backgroundColor: '#FF6384' 
                        }
                    ]
                };
                // Appliquer le formatage des montants sur l'axe Y avec la devise
                const currencySymbol = window.appCurrency || 'EUR';
                if (barChart.options && barChart.options.scales && barChart.options.scales.y) {
                    barChart.options.scales.y.ticks.callback = function(value) {
                        return formatAmountForChart(value) + ' ' + currencySymbol;
                    };
                }
                barChart.update();
        } catch (e) {
            console.error('Erreur updateBarChart:', e);
        }
    }

    async function updateCategoryFilter() {
        if (!filterCategory) return;
        try {
            const transactions = await getTransactionsData();
                const uniqueCategories = [...new Set(transactions.map(t => (t.category_name ? t.category_name.trim() : '')))].filter(cat => cat);
                filterCategory.innerHTML = `<option value="all">${translationsObj[document.documentElement.lang]?.allCategories || 'Toutes les catégories'}</option>`;
                uniqueCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    // Recherche la clé de traduction associée à cette catégorie
                    let translationKey = null;
                    const transaction = transactions.find(t => t.category_name === cat);
                    if (transaction && transaction.category_translation_key && translationsObj[document.documentElement.lang] && translationsObj[document.documentElement.lang][transaction.category_translation_key]) {
                        translationKey = transaction.category_translation_key;
                        option.textContent = translationsObj[document.documentElement.lang][translationKey];
                    } else {
                        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                    }
                    filterCategory.appendChild(option);
                });
        } catch (e) {
            console.error('Erreur updateCategoryFilter:', e);
        }
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

    // Ajout : Met à jour le texte du pie chart lors du changement de langue
    window.addEventListener('languageChanged', function() {
        if (typeof updatePieChart === 'function') updatePieChart('7J');
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

    // Rafraîchir le dashboard après une transaction
    window.addEventListener('transactionsUpdated', function() {
        __transactionsCache = null; // Invalide le cache
        updateSummaryCards();
        renderDashboardTransactions();
        updateCategoryFilter();
        if (typeof updatePieChart === 'function') updatePieChart('7J');
        if (typeof updateBarChart === 'function') updateBarChart('Mois');
        if (typeof updateLineChart === 'function') updateLineChart();
    });
});

// GESTION DE L'ÉTAT VIDE DES GRAPHIQUES
function showEmptyPieState() {
    const chartContainer = document.querySelector('.dashed');
    const accentColor = localStorage.getItem('accentColor') || '#36A2EB';
    if (!chartContainer) return;

    const currentLang = document.documentElement.lang || 'fr';
    const t = translations[currentLang] || translations['fr'];
    chartContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 250px; text-align: center; color: #a0aec0;">
            <i class="fa-solid fa-chart-pie" style="font-size: 3.5rem; margin-bottom: 15px; color: ${accentColor}; opacity: 0.3;"></i>
            <p style="font-weight: 600; color: #64748b; margin: 0; font-size: 18px;" data-i18n="noExpense">${t.noExpense}</p>
            <span style="font-size: 0.85rem; font-weight: 500; margin-top: 5px;" data-i18n="addExpenseToSeeDistribution">${t.addExpenseToSeeDistribution}</span>
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