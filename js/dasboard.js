document.addEventListener('DOMContentLoaded', function () {
    // --- MISE À JOUR DE LA DATE ACTUELLE ---
    function updateCurrentDate() {
        const now = new Date();
        const currentLanguage = localStorage.getItem('appLanguage') || 'fr';
        
        const monthsFr = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 
                         'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
        const monthsEn = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                         'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
        
        const months = currentLanguage === 'en' ? monthsEn : monthsFr;
        
        const monthElement = document.getElementById('currentMonth');
        const yearElement = document.getElementById('currentYear');
        
        if (monthElement) monthElement.textContent = months[now.getMonth()];
        if (yearElement) yearElement.textContent = now.getFullYear();
    }
    
    updateCurrentDate();
    
    // Mettre à jour la date quand la langue change
    window.addEventListener('storage', (e) => {
        if (e.key === 'appLanguage') {
            updateCurrentDate();
        }
    });

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
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')?.trim() || '#36A2EB';
                desktopPhotoContainer.style.borderColor = accentColor;
                if (userPhoto && userPhoto.trim() !== "") {
                    desktopPhotoContainer.innerHTML = `<img src="${userPhoto}" id="userPhotoDisplay" alt="Profil" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    desktopPhotoContainer.innerHTML = `<i class="fas fa-user" id="userPhotoDisplay" style="font-size: 1.2rem; color: ${accentColor};"></i>`;
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
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')?.trim() || '#36A2EB';
                sidebarProfile.style.borderColor = accentColor;
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

    // Fonction robuste pour parser une date
    function parseTransactionDate(dateField) {
        if (!dateField) return new Date();
        
        let d;
        
        // Essayer d'abord comme date ISO/standard
        d = new Date(dateField);
        if (!isNaN(d.getTime())) {
            return d;
        }
        
        // Format "jour mois_texte année" (ex: "15 mars 2026")
        const parts = dateField.trim().split(/\s+/);
        if (parts.length === 3) {
            const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
            const moisIndex = mois.findIndex(m => m === parts[1].toLowerCase());
            if (moisIndex !== -1) {
                try {
                    d = new Date(parseInt(parts[2]), moisIndex, parseInt(parts[0]));
                    if (!isNaN(d.getTime())) {
                        return d;
                    }
                } catch (e) {}
            }
        }
        
        // Sinon retourner date actuelle
        return new Date();
    }

    async function updateSummaryCards() {
        try {
            const transactions = await getTransactionsData();
            let incMois = 0;
            let expMois = 0;
            let incTotal = 0;  // Revenus TOUS les mois
            let expTotal = 0;  // Dépenses TOUS les mois
            const now = new Date();
            
            // Calculer mois courant + TOTAL depuis le début
            transactions.forEach(t => {
                const d = parseTransactionDate(t.date || t.transaction_date);
                const amount = parseFloat(t.amount) || 0;
                
                // Calculer TOTAL depuis le début
                if(t.category_type === 'income') incTotal += amount;
                if(t.category_type === 'expense') expTotal += amount;
                
                // Vérifier si c'est le mois courant
                if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                    if(t.category_type === 'income') incMois += amount;
                    if(t.category_type === 'expense') expMois += amount;
                }
            });
            
            // Calculer mois précédent
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            let incMoisPrecedent = 0;
            let expMoisPrecedent = 0;
            
            transactions.forEach(t => {
                const d = parseTransactionDate(t.date || t.transaction_date);
                
                // Vérifier si c'est le mois précédent
                if (d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear()) {
                    if(t.category_type === 'income') incMoisPrecedent += parseFloat(t.amount) || 0;
                    if(t.category_type === 'expense') expMoisPrecedent += parseFloat(t.amount) || 0;
                }
            });
            
            const cards = document.querySelectorAll('.stats-value');
            const currencySymbol = window.appCurrency || 'EUR';
            if (cards.length >= 3) {
                // Solde Total = Somme de TOUS les revenus - Somme de TOUTES les dépenses
                let soldeAffiche = incTotal - expTotal;
                
                cards[0].textContent = `${formatAmountDash(soldeAffiche)} ${currencySymbol}`;
                cards[1].textContent = `${formatAmountDash(incMois)} ${currencySymbol}`;
                cards[2].textContent = `- ${formatAmountDash(Number(expMois))} ${currencySymbol}`;
                
                // Mettre à jour les indicateurs avec les données correctes
                updateStatsIndicators(incMois, expMois, incMoisPrecedent, expMoisPrecedent);
            }
        } catch (e) {
        }
    }
    
    // Fonction pour mettre à jour les indicateurs de variation
    function updateStatsIndicators(incMois, expMois, incMoisPrecedent, expMoisPrecedent) {
        const cards = document.querySelectorAll('.current .card');
        const currentLang = localStorage.getItem('appLanguage') || 'fr';
        
        if (cards.length >= 3) {
            // Card 2 : Revenus du mois (index 1)
            const indicatorIncome = cards[1].querySelector('.stats-indicator');
            if (indicatorIncome) {
                if (incMoisPrecedent === 0 || isNaN(incMoisPrecedent)) {
                    // Masquer l'indicateur s'il n'y a pas de données du mois précédent
                    indicatorIncome.style.display = 'none';
                } else {
                    indicatorIncome.style.display = 'flex';
                    const variationIncome = ((incMois - incMoisPrecedent) / incMoisPrecedent) * 100;
                    updateIndicatorDisplay(indicatorIncome, variationIncome, null, null, 'income', currentLang);
                }
            }
            
            // Card 3 : Dépenses du mois (index 2)
            const indicatorExpense = cards[2].querySelector('.stats-indicator');
            if (indicatorExpense) {
                if (expMoisPrecedent === 0 || isNaN(expMoisPrecedent)) {
                    // Masquer l'indicateur s'il n'y a pas de données du mois précédent
                    indicatorExpense.style.display = 'none';
                } else {
                    indicatorExpense.style.display = 'flex';
                    const variationExpense = ((expMois - expMoisPrecedent) / expMoisPrecedent) * 100;
                    updateIndicatorDisplay(indicatorExpense, variationExpense, null, null, 'expense', currentLang);
                }
            }
        }
    }
    
    // Afficher un indicateur avec logique de couleur
    function updateIndicatorDisplay(indicator, variation, forceType, forceIcon, indicatorType, lang = 'fr') {
        const span = indicator.querySelector('span');
        const icon = indicator.querySelector('i');
        
        if (!span || !icon) return;
        
        let displayText = '';
        let type = forceType || 'neutral';
        let iconClass = forceIcon || 'fas fa-minus';
        
        // Si variation est "N/A"
        if (variation === 'N/A') {
            displayText = '~0%';
            type = 'neutral';
            iconClass = 'fas fa-circle-notch';
        } else if (typeof variation === 'number' && !isNaN(variation)) {
            // Déterminer le seuil minimum de variation significative
            const threshold = 0.5;
            
            if (indicatorType === 'income') {
                // Revenu : vert si positif, rouge si négatif
                if (variation > threshold) {
                    displayText = `+${variation.toFixed(1)}%`;
                    type = 'positive';
                    iconClass = 'fas fa-arrow-trend-up';
                } else if (variation < -threshold) {
                    displayText = `${variation.toFixed(1)}%`;
                    type = 'negative';
                    iconClass = 'fas fa-arrow-trend-down';
                } else {
                    displayText = '~0%';
                    type = 'neutral';
                    iconClass = 'fas fa-circle';
                }
            } else if (indicatorType === 'expense') {
                // Dépense : vert si baisse (négatif), rouge si hausse (positif)
                if (variation < -threshold) {
                    // Baisse = bon
                    displayText = `${variation.toFixed(1)}%`;
                    type = 'positive';
                    iconClass = 'fas fa-arrow-trend-down';
                } else if (variation > threshold) {
                    // Hausse = mauvais
                    displayText = `+${variation.toFixed(1)}%`;
                    type = 'negative';
                    iconClass = 'fas fa-arrow-trend-up';
                } else {
                    displayText = '~0%';
                    type = 'neutral';
                    iconClass = 'fas fa-circle';
                }
            } else if (indicatorType === 'balance') {
                // Solde : vert si positif, rouge si négatif
                if (variation > threshold) {
                    displayText = `+${variation.toFixed(1)}%`;
                    type = 'positive';
                    iconClass = 'fas fa-arrow-trend-up';
                } else if (variation < -threshold) {
                    displayText = `${variation.toFixed(1)}%`;
                    type = 'negative';
                    iconClass = 'fas fa-arrow-trend-down';
                } else {
                    displayText = '~0%';
                    type = 'neutral';
                    iconClass = 'fas fa-circle';
                }
            }
        } else {
            displayText = '--';
            type = 'neutral';
            iconClass = 'fas fa-minus';
        }
        
        span.textContent = displayText;
        icon.className = iconClass;
        
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
                    let fontSize = chart.config._centerText.fontSize || 13;
                    const color = chart.config._centerText.color || '#1e293b';
                    
                    // Adapter la taille du texte selon l'écran
                    const width = window.innerWidth;
                    if (width <= 479) {
                        fontSize = Math.max(fontSize * 0.6, 8); // 60% sur petit mobile
                    } else if (width <= 767) {
                        fontSize = Math.max(fontSize * 0.75, 9); // 75% sur mobile
                    } else if (width <= 1024) {
                        fontSize = Math.max(fontSize * 0.85, 10); // 85% sur tablette
                    }
                    
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
        const isMobileInit = window.innerWidth <= 768;
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        
        let pieLegendPosition = 'right';
        let pieLegendFontSize = 12;
        let pieLegendPadding = 15;
        let pieLegendBoxWidth = 15;
        let pieCenterFontSize = 13;
        
        if (isMobileInit) {
            pieLegendPosition = 'bottom';
            pieLegendFontSize = 9;
            pieLegendPadding = 6;
            pieLegendBoxWidth = 10;
            pieCenterFontSize = 10;
        } else if (isTablet) {
            pieLegendFontSize = 10;
            pieLegendPadding = 10;
            pieLegendBoxWidth = 12;
            pieCenterFontSize = 11;
        }
        
        pieChart = new Chart(pieCtx, { 
            type: 'doughnut', 
            data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { 
                    legend: { 
                        position: pieLegendPosition,
                        labels: {
                            font: { size: pieLegendFontSize },
                            padding: pieLegendPadding,
                            boxWidth: pieLegendBoxWidth,
                            maxWidth: isTablet ? 100 : (isMobileInit ? 150 : 200)
                        }
                    }
                }
            },
            plugins: [centerTextPlugin]
        });

        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, { 
            type: 'bar', 
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 20,
                        right: 20,
                        bottom: 40
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: {
                            font: {
                                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                size: 12
                            }
                        }
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                size: 12
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                size: 12
                            }
                        }
                    }
                }
            } 
        });

        if (lineChart) lineChart.destroy();
        const isMobileLineInit = window.innerWidth <= 768;
        const isTabletLineInit = window.innerWidth > 768 && window.innerWidth <= 1024;
        
        let lineChartLegendPosition = 'top';
        let lineChartLegendFontSize = 12;
        let lineChartLegendPadding = 15;
        let lineChartXAxisFontSize = 12;
        let lineChartYAxisFontSize = 12;
        
        if (isMobileLineInit) {
            lineChartLegendPosition = 'top';
            lineChartLegendFontSize = 9;
            lineChartLegendPadding = 8;
            lineChartXAxisFontSize = 9;
            lineChartYAxisFontSize = 9;
        } else if (isTabletLineInit) {
            lineChartLegendFontSize = 10;
            lineChartLegendPadding = 10;
            lineChartXAxisFontSize = 10;
            lineChartYAxisFontSize = 10;
        }
        
        lineChart = new Chart(lineCtx, { 
            type: 'line', 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        bottom: 15
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { 
                        position: lineChartLegendPosition,
                        labels: {
                            font: {
                                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                size: lineChartLegendFontSize
                            },
                            padding: lineChartLegendPadding
                        }
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                size: lineChartYAxisFontSize
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                size: lineChartXAxisFontSize
                            }
                        }
                    }
                }
            } 
        });

        // Afficher l'état vide du pie chart par défaut
        showEmptyPieState();
        updateBarChart(); // Afficher les 3 derniers mois par défaut
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
        }
    }

    // GESTION DE L'ÉTAT VIDE DES GRAPHIQUES
    function showEmptyPieState() {
        const chartContainer = document.querySelector('.dashed');
        if (!chartContainer) return;

        const currentLang = document.documentElement.lang || 'fr';
        const t = translations[currentLang] || translations['fr'];
        chartContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 250px; text-align: center; color: #a0aec0;">
                <i class="fa-solid fa-chart-pie" style="font-size: 3.5rem; margin-bottom: 15px; color: var(--accent-color); opacity: 0.6;"></i>
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
                    plugins: { legend: { position: 'right' } }
                },
                plugins: [centerTextPlugin]
            });
        }
    }

   async function updatePieChart(period) {
        try {
            // S'assurer que le canvas existe (le créer s'il a été détruit par showEmptyPieState)
            ensurePieCanvasExists();
            if (!pieChart) return;
            
            const transactions = await getTransactionsData();
            const now = new Date();
            
            // Fonction pour parser une date correctement (éviter problèmes de fuseau horaire)
            function parseDate(dateStr) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    // Format YYYY-MM-DD
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }
                return new Date(dateStr);
            }
            
            // 1. Filtrage par période
            const periodFiltered = transactions.filter(t => {
                const dateStr = t.transaction_date || t.date;
                const d = parseDate(dateStr);
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (period === '7J') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    // Exclure aujourd'hui
                    return d >= sevenDaysAgo && d < today;
                }
                if (period === '1M') {
                    const oneMonthAgo = new Date(today);
                    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
                    // Exclure aujourd'hui
                    return d >= oneMonthAgo && d < today;
                }
                if (period === '3M') {
                    const threeMonthsAgo = new Date(today);
                    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
                    // Exclure aujourd'hui
                    return d >= threeMonthsAgo && d < today;
                }
                // Par défaut: afficher le mois courant
                if (period === 'currentMonth' || !period) {
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }
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
                
                // Réduire la taille du texte sur mobile
                const isMobile = window.innerWidth <= 768;
                const fontSize = isMobile ? 10 : 13;
                
                pieChart.config._centerText = {
                    text: `${centerTextLabel}\n${formatAmountDash(totalDepense)} ${currencySymbol}`,
                    fontSize: fontSize,
                    color: '#1e293b'
                };
                
                // Ajuster la taille et le positionnement de la légende sur mobile
                if (isMobile) {
                    pieChart.options.plugins.legend = {
                        position: 'bottom',
                        labels: {
                            font: { size: 10 },
                            padding: 8,
                            boxWidth: 12
                        }
                    };
                } else {
                    pieChart.options.plugins.legend = {
                        position: 'right',
                        labels: {
                            font: { size: 12 }
                        }
                    };
                }
                
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
        }
    }

    async function updateCategoryFilter() {
        if (!filterCategory) return;
        try {
            const transactions = await getTransactionsData();
                const uniqueCategories = [...new Set(transactions.map(t => (t.category_name ? t.category_name.trim() : '')))].filter(cat => cat);
                filterCategory.innerHTML = `<option value="all">${translations[document.documentElement.lang]?.allCategories || 'Toutes les catégories'}</option>`;
                uniqueCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    // Recherche la clé de traduction associée à cette catégorie
                    let translationKey = null;
                    const transaction = transactions.find(t => t.category_name === cat);
                    if (transaction && transaction.category_translation_key && translations[document.documentElement.lang] && translations[document.documentElement.lang][transaction.category_translation_key]) {
                        translationKey = transaction.category_translation_key;
                        option.textContent = translations[document.documentElement.lang][translationKey];
                    } else {
                        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                    }
                    filterCategory.appendChild(option);
                });
        } catch (e) {
        }
    }

    // 5. ÉCOUTEURS D'ÉVÉNEMENTS
    if (filterType) filterType.addEventListener('change', renderDashboardTransactions);
    if (filterCategory) filterCategory.addEventListener('change', renderDashboardTransactions);
    
    timeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            timeButtons.forEach(b => b.classList.remove('active-time'));
            this.classList.add('active-time');
            // Mapper le texte du bouton à la période
            const period = this.textContent === 'Mois' ? 'currentMonth' : this.textContent;
            updatePieChart(period);
        });
    });

    // Ajout : Met à jour le texte du pie chart lors du changement de langue
    window.addEventListener('languageChanged', function() {
        if (typeof updatePieChart === 'function') updatePieChart('7J');
    });

    // 6. LANCEMENT
    loadProfileInfo();
    updateCategoryFilter();
    updateSummaryCards();
    renderDashboardTransactions();
    initCharts();
    
    // Afficher les données du mois courant par défaut avec le bouton "Mois" actif
    updatePieChart('currentMonth');

    // Rafraîchir le dashboard après une transaction
    window.addEventListener('transactionsUpdated', function() {
        __transactionsCache = null; // Invalide le cache
        updateSummaryCards();
        renderDashboardTransactions();
        updateCategoryFilter();
        
        // Déterminer le bouton actuellement actif et mettre à jour le pie chart
        let activePeriod = 'currentMonth'; // Par défaut: mois courant
        timeButtons.forEach(btn => {
            if (btn.classList.contains('active-time')) {
                activePeriod = btn.textContent === 'Mois' ? 'currentMonth' : btn.textContent;
            }
        });
        
        if (typeof updatePieChart === 'function') updatePieChart(activePeriod);
        if (typeof updateBarChart === 'function') updateBarChart('Mois');
        if (typeof updateLineChart === 'function') updateLineChart();
    });
});


