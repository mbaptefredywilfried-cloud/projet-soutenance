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

            // 4. VÉRIFIE
            if (emailSaisi === storedEmail && passSaisi === storedPass) {
                gererConnexion();
            } else {
                alert("Identifiants incorrects. Vérifiez votre email et mot de passe.");
            }
        });
    }
});

function gererConnexion() {
    const now = new Date();
    const lastLogin = now.toLocaleDateString('fr-FR') + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');

    localStorage.setItem('lastLoginTime', lastLogin);

    // Redirection vers le dashboard
    window.location.href = 'dasboard.html';
}