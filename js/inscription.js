// SIMULATION : Dans ta fonction d'inscription réussie
function finaliserInscription() {
    // 1. On crée les infos fixes (le certificat de naissance du compte)
    const userId = 'AD_' + Math.floor(100 + Math.random() * 900);
    const creationDate = new Date().toLocaleDateString('fr-FR');

    // 2. On enregistre tout dans le localStorage
    localStorage.setItem('userId', userId);
    localStorage.setItem('userCreationDate', creationDate);
    
    // On récupère les valeurs de tes inputs actuels
    localStorage.setItem('userName', document.getElementById('nom_input').value);
    localStorage.setItem('userEmail', document.getElementById('email_input').value);
    
    // 3. Redirection vers la connexion ou le profil
    window.location.href = 'connexion.html';
}