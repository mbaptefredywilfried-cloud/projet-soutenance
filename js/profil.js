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
    const fullNameDisplay = document.querySelector('.card2 .info .profil-detail-group:nth-child(1) p');
    const emailDisplay = document.querySelector('.card2 .info .profil-detail-group:nth-child(2) p');
    const phoneDisplay = document.querySelector('.card2 .info .profil-detail-group:nth-child(3) p');
    
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
    const deleteBtn = document.getElementById('deleteAccountBtn');

    const links = document.querySelectorAll('aside .nav a');

    // --- 2. CHARGEMENT INITIAL ---
    function loadUserData() {
        fetch('php/data/user_profile.php?action=get', { credentials: 'same-origin' })
            .then(resp => {
                if (!resp.ok) throw new Error('Not authenticated');
                return resp.json();
            })
            .then(data => {
                if (!data.success) throw new Error('No profile');
                const user = data.user || {};
                const savedName = user.username || 'Fredy 2.0';
                const savedEmail = user.email || 'Fredy2.0@gmail.com';
                const savedPhone = user.phone || 'Non specifie';
                const savedPhoto = user.image || localStorage.getItem('userImage');

                if (userNameDisplay) userNameDisplay.textContent = savedName;
                if (fullNameDisplay) fullNameDisplay.textContent = savedName;
                if (emailDisplay) emailDisplay.textContent = savedEmail;
                if (phoneDisplay) phoneDisplay.textContent = savedPhone;
                if (savedPhoto && avatarImage) avatarImage.src = savedPhoto;

                // Mettre à jour les éléments de compte
                const idDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(1) span');
                const creationDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(2) span');
                const lastLoginDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(3) span');
                if (idDisplay) idDisplay.textContent = user.id || 'AD_565';
                if (creationDisplay) creationDisplay.textContent = user.created_at || '2023-01-01';
                if (lastLoginDisplay) lastLoginDisplay.textContent = user.last_login || 'Session actuelle';

                updateBudgetOverview();
            })
            .catch(err => {
                console.warn('loadUserData:', err);
            });
    }

    // --- 3. APERÇU BUDGÉTAIRE DYNAMIQUE ---
    function updateBudgetOverview() {
        const totalBudget = parseFloat(localStorage.getItem('userBudgetInitial')) || 0;
        const totalSpent = parseFloat(localStorage.getItem('userTotalSpent')) || 0;

        // MODIFICATION : Calcul du restant bloqué à 0 minimum
        const rawRemaining = totalBudget - totalSpent;
        const remaining = Math.max(0, rawRemaining);

        // MODIFICATION : Calcul du pourcentage bloqué à 100% maximum
        const rawPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        const displayPercentage = Math.min(100, Math.round(rawPercentage));

        const currencySymbol = localStorage.getItem('appCurrency') || '€';

        if (statsValues.length >= 3) {
            // On affiche le pourcentage plafonné à 100%
            statsValues[0].textContent = `${displayPercentage}%`;
            
            // On affiche le montant restant plafonné à 0 €
            statsValues[1].textContent = `${remaining.toFixed(2)} ${currencySymbol}`;
            
            // On garde le total dépensé réel (qui peut dépasser le budget)
            statsValues[2].textContent = `${totalSpent.toFixed(2)} ${currencySymbol}`;

            // Optionnel : Changer la couleur du montant restant en rouge s'il est épuisé (dépassé)
            if (rawRemaining < 0) {
                statsValues[1].style.color = '#ef4444';
            } else {
                statsValues[1].style.color = ''; // Reset à la couleur par défaut
            }
        }

        if (budgetAdvice) {
            // On utilise rawPercentage pour les conseils afin de détecter le dépassement réel
            if (rawPercentage >= 100) {
                budgetAdvice.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span style="color: #ef4444; font-weight:bold;">Alerte :</span> Budget dépassé !`;
            } else if (rawPercentage > 80) {
                budgetAdvice.innerHTML = `<i class="fas fa-info-circle"></i> <span style="color: #f59e0b; font-weight:bold;">Prudence :</span> Limite proche.`;
            } else {
                budgetAdvice.innerHTML = `<i class="fas fa-check-circle"></i> <span style="color: #10b981; font-weight:bold;">Conseil :</span> Gestion excellente.`;
            }
        }
    }

    // --- 4. GESTION DES INFOS DE COMPTE ---
    function handleAccountStats() {
        const idDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(1) span');
        const creationDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(2) span');
        const lastLoginDisplay = document.querySelector('.card4 .profil-detail-group:nth-child(3) span');

        if (idDisplay) idDisplay.textContent = localStorage.getItem('userId') || 'AD_565';
        if (creationDisplay) creationDisplay.textContent = localStorage.getItem('userCreationDate') || '2023-01-01';
        if (lastLoginDisplay) lastLoginDisplay.textContent = localStorage.getItem('lastLoginTime') || 'Session actuelle';
    }

    // --- 5. GESTION DE LA PHOTO ---
    if (avatarInput && avatarImage) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                avatarImage.src = ev.target.result;
                // Temporary: store avatar locally until server-side upload is implemented
                localStorage.setItem('userImage', ev.target.result);
                showSuccessToast("Photo mise à jour !");
            };
            reader.readAsDataURL(file);
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
                    showSuccessToast("Profil mis à jour !");
                } else {
                    showSuccessToast(result.message || 'Erreur lors de la mise à jour');
                }
            })
            .catch(err => {
                console.error('Update profile failed', err);
                showSuccessToast('Erreur réseau');
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
                        email: user.email,
                        budget: localStorage.getItem('userBudgetInitial') || null,
                        depenses: localStorage.getItem('userTotalSpent') || null
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'mon_profil_data.json';
                    a.click();
                    showSuccessToast("Données exportées !");
                })
                .catch(() => showSuccessToast('Impossible d\'exporter : utilisateur non authentifié'));
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

// --- LOGIQUE DU POP-UP DE RAPPEL ---
function checkExpenseReminder() {
    const lastEntry = localStorage.getItem('lastExpenseDate');
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000; 

    // Si aucune dépense n'a jamais été saisie ou si ça fait plus de 24h
    if (!lastEntry || (now - lastEntry) > oneDay) {
        createReminderPopup();
    }
}

function createReminderPopup() {
    // Création de la structure du pop-up
    const popup = document.createElement('div');
    popup.className = 'reminder-popup';
    
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <i class="fas fa-bell"></i>
                <span>Rappel de saisie</span>
                <button class="close-popup-btn">&times;</button>
            </div>
            <div class="popup-body">
                <p>Vous n'avez pas encore saisi vos dépenses aujourd'hui !</p>
                <button class="action-btn" onclick="window.location.href='transaction.html'">Saisir maintenant</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Gestion de la fermeture manuelle
    const closeBtn = popup.querySelector('.close-popup-btn');
    closeBtn.addEventListener('click', () => {
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 500);
    });
}

// Lancer la vérification
checkExpenseReminder();