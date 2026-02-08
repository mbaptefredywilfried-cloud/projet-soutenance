document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPass').value;

            // Envoyer les données au serveur
            const formData = {
                email: email,
                password: password
            };

            fetch('php/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Le serveur a créé la session ; redirection vers le dashboard.
                    showToast("Connexion réussie !");
                    setTimeout(() => {
                        window.location.href = 'dasboard.html';
                    }, 1500);
                } else {
                    showErrorPopup("Accès refusé", data.message || "Email ou mot de passe incorrect");
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showErrorPopup("Erreur", "Problème de connexion au serveur");
            });
        });
    }
});

/**
 * Gère la réussite de la connexion
 */
function gererConnexion(email) {
    const now = new Date();
    const lastLogin = now.toLocaleDateString('fr-FR') + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    // Ne plus utiliser localStorage pour l'authentification client ; la session est gérée côté serveur.
    showToast("Connexion réussie !");
    setTimeout(() => { window.location.href = 'dasboard.html'; }, 1500);
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
    
    // Fermer popup au clic sur overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = '0.3s';
            setTimeout(() => overlay.remove(), 300);
        }
    });
}