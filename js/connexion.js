document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // 1. BLOQUE le rafraîchissement de la page
            e.preventDefault();

            // 2. RÉCUPÈRE les infos saisies
            const emailSaisi = document.getElementById('loginEmail').value;
            const passSaisi = document.getElementById('loginPass').value;

            // 3. RÉCUPÈRE les infos stockées lors de l'inscription
            const storedEmail = localStorage.getItem('userEmail');
            const storedPass = localStorage.getItem('userPassword');

            // 4. VÉRIFIE les identifiants
            if (emailSaisi === storedEmail && passSaisi === storedPass) {
                gererConnexion();
            } else {
                // Remplacement de l'alert par le nouveau popup d'erreur
                showErrorPopup(
                    "Accès refusé", 
                    "L'email ou le mot de passe est incorrect. Veuillez vérifier vos identifiants."
                );
            }
        });
    }
});

/**
 * Gère la réussite de la connexion
 */
function gererConnexion() {
    const now = new Date();
    const lastLogin = now.toLocaleDateString('fr-FR') + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');

    localStorage.setItem('lastLoginTime', lastLogin);

    // Affichage de la notification de succès
    showToast("Connexion réussie !");

    // Redirection après 1.5 seconde vers le tableau de bord
    setTimeout(() => {
        window.location.href = 'dasboard.html';
    }, 1500);
}

/**
 * Affiche une notification de succès (Toast) en haut de l'écran
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    document.body.appendChild(toast);

    // Animation de sortie
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

/**
 * Affiche un popup d'erreur centralisé en cas d'identifiants incorrects
 */
function showErrorPopup(titre, message) {
    // Supprimer un éventuel popup déjà existant
    const existingModal = document.querySelector('.error-popup-overlay');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'error-popup-overlay';
    
    overlay.innerHTML = `
        <div class="error-popup-content">
            <i class="fas fa-exclamation-circle"></i>
            <h2>${titre}</h2>
            <p>${message}</p>
            <button class="btn-error-close" id="closeError">Réessayer</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Fermeture du popup au clic sur le bouton
    document.getElementById('closeError').addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.style.transition = '0.3s';
        setTimeout(() => overlay.remove(), 300);
    });
}