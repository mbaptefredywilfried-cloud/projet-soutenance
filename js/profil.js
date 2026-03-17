document.addEventListener('DOMContentLoaded', function () {
    // --- 0. INITIALISATION DE L'ACCENT COULEUR ---
    const savedAccentColor = localStorage.getItem('accentColor') || '#2563eb';
    
    // Fonction pour appliquer l'accent au profil
    function applyProfileAccentColor(color) {
        // Appliquer la couleur au bouton upload avatar
        const avatarBtn = document.querySelector('.avatar-upload-btn');
        if (avatarBtn) {
            avatarBtn.style.color = color;
            avatarBtn.style.borderColor = color;
        }
        
        // Appliquer aussi aux autres éléments si la fonction globale existe
        if (typeof applyAccentColor === 'function') {
            applyAccentColor(color);
        }
    }
    
    // Appliquer l'accent initial
    applyProfileAccentColor(savedAccentColor);
    
    // Écouter les changements d'accent (depuis les paramètres)
    window.addEventListener('storage', (e) => {
        if (e.key === 'accentColor') {
            const newColor = e.newValue || '#2563eb';
            applyProfileAccentColor(newColor);
        }
    });

    // --- 1. SÉLECTEURS ---
    const avatarInput = document.getElementById('avatarInput');
    const avatarImage = document.querySelector('.avatar-image');
    const userNameDisplay = document.querySelector('.side-header h3');
    const fullNameDisplay = document.getElementById('display-name');
    const emailDisplay = document.getElementById('display-email');
    const phoneDisplay = document.getElementById('display-phone');
    
    // Sélecteurs Aperçu Budgétaire (Card 3)
    const statsValues = document.querySelectorAll('.card3 .stat-value');
    const budgetAdvice = document.querySelector('.card3 p');
    
    // Sélecteurs de la Modale
    const modal = document.getElementById('editModal');
    const editBtn = document.getElementById('openEditModal'); 
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const editForm = document.getElementById('editProfileForm');
    
    const inputName = document.getElementById('editName');
    const inputEmail = document.getElementById('editEmail');
    const inputPhone = document.getElementById('editPhone');

    // Sélecteurs Sécurité (Card 5)
    const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                window.location.href = 'php/data/export_data.php';
            });
        }
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const confirmDeleteAccountBtn = document.getElementById('confirmDeleteAccountBtn');
    const cancelDeleteAccountBtn = document.getElementById('cancelDeleteAccountBtn');

    if (deleteBtn && deleteAccountModal && confirmDeleteAccountBtn && cancelDeleteAccountBtn) {
        deleteBtn.addEventListener('click', function() {
            console.log('Bouton suppression cliqué');
            if (deleteAccountModal) {
                console.log('deleteAccountModal trouvé');
                deleteAccountModal.classList.add('active');
            } else {
                console.log('deleteAccountModal introuvable');
            }
        });
        cancelDeleteAccountBtn.addEventListener('click', function() {
            console.log('Bouton annuler suppression cliqué');
            deleteAccountModal.classList.remove('active');
        });
        confirmDeleteAccountBtn.addEventListener('click', function() {
            console.log('Bouton confirmer suppression cliqué');
            confirmDeleteAccountBtn.disabled = true;
            fetch('php/data/delete_account.php', {
                method: 'POST',
                credentials: 'same-origin',
            })
            .then(resp => resp.json())
            .then(result => {
                console.log('Réponse suppression:', result);
                confirmDeleteAccountBtn.disabled = false;
                if (result.success) {
                    window.location.href = 'index.html';
                } else {
                    confirmDeleteAccountBtn.textContent = 'Erreur';
                    setTimeout(() => {
                        confirmDeleteAccountBtn.textContent = 'Oui, supprimer';
                    }, 2000);
                }
            })
            .catch((err) => {
                console.log('Erreur réseau suppression:', err);
                confirmDeleteAccountBtn.disabled = false;
                confirmDeleteAccountBtn.textContent = 'Erreur réseau';
                setTimeout(() => {
                    confirmDeleteAccountBtn.textContent = 'Oui, supprimer';
                }, 2000);
            });
        });
    }

    const links = document.querySelectorAll('aside .nav a');

    // --- 2. CHARGEMENT INITIAL ---
    function loadUserData() {
        fetch('php/data/user_profile.php?action=get', { credentials: 'same-origin' })
            .then(resp => resp.json())
            .then(data => {
                const user = data.user || data.data || {};
                console.log('[DEBUG] user.image =', user.image);
                if (userNameDisplay) userNameDisplay.textContent = user.username || user.name || '';
                if (fullNameDisplay) fullNameDisplay.textContent = user.username || user.name || '';
                if (emailDisplay) emailDisplay.textContent = user.email || '';
                if (phoneDisplay) phoneDisplay.textContent = user.phone || '';
                const avatarPlaceholder = document.querySelector('.avatar-placeholder');
                if (user.image && avatarImage) {
                    avatarImage.src = user.image;
                    if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
                } else if (avatarImage) {
                    avatarImage.src = './assets/default-avatar.png';
                    if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
                }

                // Détection de la langue courante depuis <html lang>
                const lang = document.documentElement.lang || 'fr';
                // Mettre à jour les éléments de compte
                const idDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(1) span');
                const creationDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(2) span');
                const lastLoginDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(3) span');
                if (idDisplay) idDisplay.textContent = user.id || '';
                if (creationDisplay) {
                    if (user.created_at) {
                        const date = new Date(user.created_at);
                        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                        let formatted = date.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', options);
                        if (lang !== 'en') formatted = formatted.replace(',', ' à');
                        creationDisplay.textContent = formatted;
                    } else {
                        creationDisplay.textContent = '';
                    }
                }
                if (lastLoginDisplay) {
                    if (user.last_login) {
                        const date = new Date(user.last_login);
                        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                        let formatted = date.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', options);
                        if (lang !== 'en') formatted = formatted.replace(',', ' à');
                        lastLoginDisplay.textContent = formatted;
                    } else {
                        lastLoginDisplay.textContent = '';
                    }
                }

                updateBudgetOverview();
            })
            .catch(err => {
                console.warn('loadUserData:', err);
            });
    }

    // --- 3. APERÇU BUDGÉTAIRE DYNAMIQUE ---
    function updateBudgetOverview() {
        fetch('./php/budgets/list.php')
            .then(response => response.json())
            .then(data => {
                console.log('[APERÇU BUDGÉTAIRE] Réponse backend:', data);
                const budgets = Array.isArray(data.data) ? data.data : [];
                let totalBudget = 0;
                let currencySymbol = '€';
                // Récupérer les category_id des budgets actifs
                const activeCategoryIds = budgets.map(b => b.category_id);
                budgets.forEach(b => {
                    totalBudget += parseFloat(b.amount) || 0;
                });
                fetch('./php/transactions/list.php')
                    .then(resp => resp.json())
                    .then(transData => {
                        console.log('[APERÇU BUDGÉTAIRE] Transactions:', transData);
                        const transactions = Array.isArray(transData.data) ? transData.data : [];
                        let totalSpent = 0;
                        let totalSpentActive = 0;
                        let totalSpentAll = 0;
                        transactions.forEach(t => {
                            if (t.category_type === 'expense') {
                                totalSpentAll += parseFloat(t.amount) || 0;
                                if (activeCategoryIds.includes(t.category_id)) {
                                    totalSpentActive += parseFloat(t.amount) || 0;
                                }
                            }
                        });
                        const rawPercentage = totalBudget > 0 ? (totalSpentActive / totalBudget) * 100 : 0;
                        const displayPercentage = Math.min(100, Math.round(rawPercentage));
                        if (statsValues.length >= 3) {
                            // Carte orange : Utilisé
                            statsValues[0].textContent = `${displayPercentage}%`;
                            // Carte bleue : Total Budgétisé
                            statsValues[1].textContent = `${totalBudget.toFixed(2)} ${currencySymbol}`;
                            // Carte rouge : Dépensé (toutes transactions)
                            statsValues[2].textContent = `${totalSpentAll.toFixed(2)} ${currencySymbol}`;
                        }
                        if (budgetAdvice) {
                            const lang = document.documentElement.lang || 'fr';
                            const t = translations[lang] || {};
                            if (rawPercentage > 100) {
                                budgetAdvice.innerHTML = `<i class="fas fa-times-circle" style="color:#ef4444;"></i> <span style="color:#ef4444;font-weight:bold;">${t.budgetAdviceExceeded || 'Budget dépassé'}</span>`;
                            } else if (rawPercentage > 80) {
                                budgetAdvice.innerHTML = `<i class="fas fa-exclamation" style="color:#f59e0b;"></i> <span style="color:#f59e0b;font-weight:bold;">${t.budgetAdviceAlmostReached || 'Budget presque atteint'}</span>`;
                            } else if (rawPercentage >= 50) {
                                budgetAdvice.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> <span style="color:#f59e0b;font-weight:bold;">${t.budgetAdviceWarning || 'Attention à vos dépenses'}</span>`;
                            } else {
                                budgetAdvice.innerHTML = `<i class="fas fa-check-square" style="color:#10b981;"></i> <span style="color:#10b981;font-weight:bold;">${t.budgetAdviceExcellent || 'Gestion excellente'}</span>`;
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Erreur lors du chargement des transactions:', error);
                    });
            })
            .catch(error => {
                console.error('Erreur lors du chargement des budgets:', error);
                if (budgetAdvice) {
                    const lang = document.documentElement.lang || 'fr';
                    const t = translations[lang] || {};
                    budgetAdvice.innerHTML = `<i class=\"fas fa-exclamation-triangle\"></i> <span style=\"color: #ef4444; font-weight:bold;\">${t.errorTitle || 'Erreur'} :</span> ${t.budgetAdviceError || 'Impossible de charger les données budgétaires.'}`;
                }
            });
    }

    // --- 4. GESTION DES INFOS DE COMPTE ---
    function handleAccountStats() {
        // Cette fonction n'est plus utilisée, car les données dynamiques sont gérées côté backend ou via loadUserData()
        // et la langue est gérée dynamiquement via <html lang>.
        // (Gardée pour compatibilité, mais vide)
    }

    // --- 5. GESTION DE LA PHOTO ---
    if (avatarInput && avatarImage) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('avatar', file);
            fetch('php/data/upload_avatar.php', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.image) {
                    avatarImage.src = data.image;
                    const lang = document.documentElement.lang || 'fr';
                    showSuccessToast(translations[lang]?.photoUpdated || "Photo mise à jour !");
                } else {
                    showErrorToast(data.error || "Erreur lors de l'upload de la photo.");
                }
            })
            .catch(() => {
                showErrorToast("Erreur réseau lors de l'upload de la photo.");
            });
        });
    }

    // --- 6. MODALE ET FORMULAIRE ---
    const closeModal = () => { if (modal) modal.style.display = 'none'; };

    if (editBtn && modal) {
        editBtn.addEventListener('click', () => {
            // Pré-remplir depuis le DOM ou laisser vide
            inputName.value = userNameDisplay ? userNameDisplay.textContent : '';
            inputEmail.value = emailDisplay ? emailDisplay.textContent : '';
            inputPhone.value = phoneDisplay ? (phoneDisplay.textContent === 'Non specifie' ? '' : phoneDisplay.textContent) : '';
            modal.style.display = 'flex';
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                username: inputName.value.trim(),
                email: inputEmail.value.trim(),
                phone: inputPhone.value.trim() || null
            };
            fetch('php/data/user_profile.php?action=update', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(resp => resp.json())
            .then(result => {
                if (result.success) {
                    loadUserData();
                    closeModal();
                    const lang = document.documentElement.lang || 'fr';
                    showSuccessToast(translations[lang]?.profileUpdated || "Profil mis à jour !");
                } else {
                    const lang = document.documentElement.lang || 'fr';
                    showSuccessToast(result.error || result.message || translations[lang]?.profileUpdateError || 'Erreur lors de la mise à jour');
                }
            })
            .catch(err => {
                console.error('Update profile failed', err);
                const lang = document.documentElement.lang || 'fr';
                showSuccessToast(translations[lang]?.networkError || 'Erreur réseau');
            });
        });
    }

    // --- 7. SÉCURITÉ ET DONNÉES (Boutons Card 5) ---
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            fetch('php/data/user_profile.php?action=get', { credentials: 'same-origin' })
                .then(resp => resp.json())
                .then(result => {
                    if (!result.success) throw new Error('No profile');
                    const user = result.user || {};
                    const data = {
                        nom: user.username,
                        email: user.email
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'mon_profil_data.json';
                    a.click();
                    // Utilise la langue courante pour le toast
                    const lang = document.documentElement.lang || 'fr';
                    showSuccessToast(translations[lang]?.dataExported || "Données exportées !");
                })
                .catch(() => {
                    const lang = document.documentElement.lang || 'fr';
                    showSuccessToast(translations[lang]?.profileExportError || "Impossible d'exporter : utilisateur non authentifié");
                });
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            // En attente de fonctionnalités futures
            console.log("Bouton suppression en attente...");
        });
    }

    // --- 8.b GESTION DE LA DÉCONNEXION (Modal) ---
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const logoutTrigger = document.querySelector('.logout-trigger');
    const logoutLink = document.getElementById('logoutLink');

    const openLogoutModal = (e) => {
        if (e) e.preventDefault();
        if (logoutModal) logoutModal.style.display = 'flex';
    };

    const closeLogoutModal = (e) => {
        if (e) e.preventDefault();
        if (logoutModal) logoutModal.style.display = 'none';
    };

    if (logoutTrigger) logoutTrigger.addEventListener('click', openLogoutModal);
    if (logoutLink) logoutLink.addEventListener('click', openLogoutModal);
    if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeLogoutModal);
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            fetch('php/auth/logout.php', { credentials: 'same-origin' })
                .then(() => {
                    // Clear any leftover client-only data (avatar)
                    localStorage.removeItem('userImage');
                    window.location.href = './connexion.html';
                })
                .catch(() => { window.location.href = './connexion.html'; });
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === logoutModal) closeLogoutModal();
    });

    // --- 8. TOAST ET NAVIGATION ---
    function showSuccessToast(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    loadUserData();
});
