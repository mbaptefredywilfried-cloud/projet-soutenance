document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('nom_input').value;
            const email = document.getElementById('email_input').value;
            const pass = document.getElementById('password_input').value;
            const confirm = document.getElementById('confirm_password_input').value;

            if (pass !== confirm) {
                alert("Les mots de passe ne sont pas identiques !");
                return;
            }

            // Enregistrement des identifiants
            localStorage.setItem('userName', name);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPassword', pass);
            
            finaliserEtOuvrirApp();
        });
    }
});

function finaliserEtOuvrirApp() {
    // 1. Infos fixes du compte
    const userId = 'AD_' + Math.floor(100 + Math.random() * 900);
    const creationDate = new Date().toLocaleDateString('fr-FR');
    localStorage.setItem('userId', userId);
    localStorage.setItem('userCreationDate', creationDate);

    // 2. Initialisation PHOTO VIDE
    // On met une chaîne vide pour que l'app sache qu'il n'y a pas encore de photo perso
    localStorage.setItem('userImage', ""); 

    // 3. Données à zéro
    localStorage.setItem('transactions', JSON.stringify([]));

    // 4. Session actuelle (Dernière connexion)
    const now = new Date();
    const lastLogin = now.toLocaleDateString('fr-FR') + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    localStorage.setItem('lastLoginTime', lastLogin);

    // 5. Accès direct
    alert("Bienvenue ! Votre compte est prêt.");
    window.location.href = 'dasboard.html';
}