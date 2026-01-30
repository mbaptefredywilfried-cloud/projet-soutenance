// SIMULATION : Dans ta fonction de connexion réussie
function gererConnexion() {
    // 1. On met à jour l'heure de dernière connexion
    const now = new Date();
    const lastLogin = now.toLocaleDateString('fr-FR') + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');

    localStorage.setItem('lastLoginTime', lastLogin);

    // 2. On le laisse entrer
    window.location.href = 'profil.html';
}