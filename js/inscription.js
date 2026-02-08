document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const username = document.getElementById("nom_input").value.trim();
            const email = document.getElementById("email_input").value.trim().toLowerCase();
            const password = document.getElementById("password_input").value;
            const confirm_password = document.getElementById("confirm_password_input").value;

            if (password !== confirm_password) {
                showErrorModal("Erreur de saisie", "Les mots de passe ne correspondent pas. Veuillez réessayer.");
                return;
            }

            const payload = { username, email, password };

            fetch('php/auth/register.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(resp => resp.json())
            .then(data => {
                if (data.success) {
                    showSuccessModal("Succès!", "Inscription réussie! Redirection vers le dashboard...");
                    setTimeout(() => { window.location.href = './dasboard.html'; }, 2000);
                } else {
                    showErrorModal("Erreur", data.message || "Une erreur est survenue");
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showErrorModal("Erreur", "Problème de connexion au serveur");
            });
        });
    }
});

// NOUVELLE FONCTION POUR LE POPUP D'ERREUR
function showErrorModal(titre, message) {
    // Supprimer l'ancien popup s'il existe
    const existingModal = document.querySelector('.error-popup-overlay');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'error-popup-overlay';
    
    // Style de l'arrière-plan (Flou et sombre)
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:10001;";

    overlay.innerHTML = `
        <div style="
            background: white; padding: 0; border-radius: 16px; 
            width: 90%; max-width: 400px; overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex; flex-direction: column;
            animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        ">
            <div style="height: 6px; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
            
            <div style="padding: 30px; text-align: center;">
                <div style="
                    width: 70px; height: 70px; background: #fee2e2; 
                    border-radius: 50%; display: flex; align-items: center; 
                    justify-content: center; margin: 0 auto 20px;
                ">
                    <i class="fas fa-times" style="font-size: 30px; color: #ef4444;"></i>
                </div>

                <h2 style="margin: 0 0 10px; color: #1e293b; font-size: 22px; font-weight: 700;">${titre}</h2>
                <p style="margin: 0 0 25px; color: #64748b; line-height: 1.6; font-size: 15px;">${message}</p>
                
                <button id="btnCloseError" style="
                    background: #1e293b; color: white; border: none; 
                    padding: 14px 28px; border-radius: 12px; font-weight: 600; 
                    cursor: pointer; width: 100%; transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                ">
                    Corriger les informations
                </button>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { 
                from { opacity: 0; transform: translateY(20px); } 
                to { opacity: 1; transform: translateY(0); } 
            }
            #btnCloseError:hover { background: #334155; transform: translateY(-1px); }
            #btnCloseError:active { transform: translateY(0); }
        </style>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btnCloseError').addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.style.transition = '0.2s';
        setTimeout(() => overlay.remove(), 200);
    });
}

function showSuccessModal(titre, message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-success-overlay';
    
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:10001;";

    overlay.innerHTML = `
        <div style="
            background: white; padding: 0; border-radius: 16px; 
            width: 90%; max-width: 400px; overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex; flex-direction: column;
            animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        ">
            <div style="height: 6px; background: linear-gradient(90deg, #10b981, #34d399);"></div>
            
            <div style="padding: 30px; text-align: center;">
                <div style="
                    width: 70px; height: 70px; background: #d1fae5; 
                    border-radius: 50%; display: flex; align-items: center; 
                    justify-content: center; margin: 0 auto 20px;
                ">
                    <i class="fas fa-check" style="font-size: 30px; color: #10b981;"></i>
                </div>

                <h2 style="margin: 0 0 10px; color: #1e293b; font-size: 22px; font-weight: 700;">${titre}</h2>
                <p style="margin: 0 0 25px; color: #64748b; line-height: 1.6; font-size: 15px;">${message}</p>
                
                <button id="btnCloseSuccess" style="
                    background: #10b981; color: white; border: none; 
                    padding: 14px 28px; border-radius: 12px; font-weight: 600; 
                    cursor: pointer; width: 100%; transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                ">
                    Acceder au Dashboard
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btnCloseSuccess').addEventListener('click', () => {
        // Utiliser setTimeout pour s'assurer que la redirection se fait
        setTimeout(() => {
            window.location.href = './dasboard.html';
        }, 100);
    });
}

function finaliserEtOuvrirApp() {
    // Ici on s'appuie sur le serveur pour initialiser les données utilisateur.
    // Affichage de la fenêtre centrale et redirection vers la page de connexion
    showCentralModal("Succès !", "Votre compte a été créé. Cliquez sur OK pour vous connecter.");
}

function showCentralModal(titre, message) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-confirm-overlay';
  
  overlay.innerHTML = `
    <div class="modal-confirm-content">
      <i class="fas fa-check-circle"></i>
      <h2>${titre}</h2>
      <p>${message}</p>
      <button class="btn-confirm-ok" id="btnOkConfirm">OK</button>
    </div>
  `;
  
  document.body.appendChild(overlay);

  // Redirection au clic sur OK
  document.getElementById('btnOkConfirm').addEventListener('click', () => {
        window.location.href = "connexion.html";
  });
}















const sloganElement = document.getElementById('slogan-text');

// On définit les phrases avec leurs couleurs respectives
const content = [
    { text: "Gérez vos dépenses intelligemment.", color: "#60a5fa" }, // Bleu clair
    { text: "Suivez chaque centime en temps réel.", color: "#34d399" }, // Vert émeraude
    { text: "Visualisez votre avenir financier.", color: "#fbbf24" }, // Ambre
    { text: "Économisez pour vos projets futurs.", color: "#f472b6" }, // Rose pro
    { text: "Maîtrisez votre budget sans effort.", color: "#a78bfa" }  // Violet
];

let index = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function type() {
    const current = content[index];
    
    // On applique la couleur de la phrase actuelle
    sloganElement.style.color = current.color;

    if (isDeleting) {
        sloganElement.textContent = current.text.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50;
    } else {
        sloganElement.textContent = current.text.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 100;
    }

    if (!isDeleting && charIndex === current.text.length) {
        isDeleting = true;
        typeSpeed = 2000; // Pause quand la phrase est finie
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        index = (index + 1) % content.length; // Passage à la phrase/couleur suivante
        typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation du curseur
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    sloganElement.parentNode.appendChild(cursor);
    
    type();
});