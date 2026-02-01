// notifications.js

document.addEventListener('DOMContentLoaded', function () {
    // 1. On injecte le CSS nécessaire directement dans le <head>
    const style = document.createElement('style');
    style.innerHTML = `
        .reminder-popup {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #ffffff;
            border-left: 6px solid #f59e0b;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: 'Poppins', sans-serif;
            animation: slideIn 0.5s ease-out;
        }
        .popup-content { padding: 20px; }
        .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .popup-header i { color: #f59e0b; font-size: 1.2rem; }
        .popup-header span { font-weight: 700; color: #1e293b; font-size: 1rem; }
        .close-popup-btn {
            background: none; border: none; font-size: 1.5rem;
            cursor: pointer; color: #94a3b8; line-height: 1;
        }
        .popup-body p {
            font-size: 0.9rem; color: #64748b; margin-bottom: 20px; line-height: 1.4;
        }
        .action-btn {
            width: 100%; background: #f59e0b; color: white;
            border: none; padding: 10px; border-radius: 6px;
            font-weight: 600; cursor: pointer; transition: 0.3s;
        }
        .action-btn:hover { background: #d97706; }
        @keyframes slideIn {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .fade-out {
            opacity: 0; transform: translateX(50px);
            transition: 0.5s ease;
        }
    `;
    document.head.appendChild(style);

    // 2. On lance la vérification
    checkExpenseReminder();
});

function checkExpenseReminder() {
    const lastEntry = localStorage.getItem('lastExpenseDate');
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000; 

    const alreadyClosed = sessionStorage.getItem('reminderClosedThisSession');
    if (alreadyClosed === 'true') return;

    if (!lastEntry || (now - lastEntry) > oneDay) {
        createReminderPopup();
    }
}

function createReminderPopup() {
    const popup = document.createElement('div');
    popup.className = 'reminder-popup';
    
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <div><i class="fas fa-bell"></i> <span>Rappel</span></div>
                <button class="close-popup-btn">&times;</button>
            </div>
            <div class="popup-body">
                <p>N'oubliez pas d'enregistrer vos dépenses du jour pour suivre votre budget !</p>
                <button class="action-btn" id="goToSaisie">Saisir mes dépenses</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Fermer le pop-up
    popup.querySelector('.close-popup-btn').addEventListener('click', () => {
        sessionStorage.setItem('reminderClosedThisSession', 'true');
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 500);
    });

    // Aller à la page de saisie (ajuste le nom du fichier si besoin)
    popup.querySelector('#goToSaisie').addEventListener('click', () => {
        sessionStorage.setItem('reminderClosedThisSession', 'true');
        window.location.href = 'gestion_budget.html'; 
    });
}