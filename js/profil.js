document.addEventListener('DOMContentLoaded', function () {
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
        const savedName = localStorage.getItem('userName') || 'Fredy 2.0';
        const savedEmail = localStorage.getItem('userEmail') || 'Fredy2.0@gmail.com';
        const savedPhone = localStorage.getItem('userPhone') || 'Non specifie';
        const savedPhoto = localStorage.getItem('userImage');

        if (userNameDisplay) userNameDisplay.textContent = savedName;
        if (fullNameDisplay) fullNameDisplay.textContent = savedName;
        if (emailDisplay) emailDisplay.textContent = savedEmail;
        if (phoneDisplay) phoneDisplay.textContent = savedPhone;
        
        if (savedPhoto && avatarImage) avatarImage.src = savedPhoto;

        handleAccountStats();
        updateBudgetOverview(); 
    }

    // --- 3. APERÇU BUDGÉTAIRE DYNAMIQUE ---
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

        if (statsValues.length >= 3) {
            // On affiche le pourcentage plafonné à 100%
            statsValues[0].textContent = `${displayPercentage}%`;
            
            // On affiche le montant restant plafonné à 0 €
            statsValues[1].textContent = `${remaining.toFixed(2)} €`;
            
            // On garde le total dépensé réel (qui peut dépasser le budget)
            statsValues[2].textContent = `${totalSpent.toFixed(2)} €`;

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
            inputName.value = localStorage.getItem('userName') || userNameDisplay.textContent;
            inputEmail.value = localStorage.getItem('userEmail') || emailDisplay.textContent;
            inputPhone.value = localStorage.getItem('userPhone') || (phoneDisplay.textContent === 'Non specifie' ? '' : phoneDisplay.textContent);
            modal.style.display = 'flex';
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('userName', inputName.value.trim());
            localStorage.setItem('userEmail', inputEmail.value.trim());
            localStorage.setItem('userPhone', inputPhone.value.trim() || 'Non specifie');
            loadUserData();
            closeModal();
            showSuccessToast("Profil mis à jour !");
        });
    }

    // --- 7. SÉCURITÉ ET DONNÉES (Boutons Card 5) ---
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                nom: localStorage.getItem('userName'),
                email: localStorage.getItem('userEmail'),
                budget: localStorage.getItem('userBudgetInitial'),
                depenses: localStorage.getItem('userTotalSpent')
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mon_profil_data.json';
            a.click();
            showSuccessToast("Données exportées !");
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            // En attente de fonctionnalités futures
            console.log("Bouton suppression en attente...");
        });
    }

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