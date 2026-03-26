// Affichage du toast de rappel sans localStorage
async function checkAndShowReminderToast() {
    try {
        const response = await fetch('php/reminders/check_reminder.php', { credentials: 'same-origin' });
        const data = await response.json();
        if (data.status === 'success' && data.reminder_needed) {
            showReminderToast(data);
        }
    } catch (e) {
        // Optionnel: afficher une erreur ou rien
    }
}

function showReminderToast(data) {
    // Style exact du modèle fourni
    if (!document.getElementById('reminder-toast-style')) {
        const style = document.createElement('style');
        style.id = 'reminder-toast-style';
        style.innerHTML = `
        .reminder-toast {
            position: fixed; top: 24px; right: 24px; z-index: 9999;
            background: #fff; color: #222;
            padding: 24px 28px 20px 20px;
            border-radius: 14px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.10);
            min-width: 340px; max-width: 400px;
            display: flex; flex-direction: row; align-items: flex-start; gap: 18px;
            font-family: inherit;
            animation: fadeIn 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px);} to { opacity: 1; transform: none;}}
        .reminder-toast .reminder-icon-box {
            background: #e6faf3;
            border-radius: 8px;
            width: 48px; height: 48px;
            display: flex; align-items: center; justify-content: center;
            margin-top: 2px;
        }
        .reminder-toast .reminder-icon-box svg {
            width: 28px; height: 28px; color: #22c58b;
        }
        .reminder-toast .reminder-content {
            flex: 1; display: flex; flex-direction: column; gap: 7px;
        }
        .reminder-toast .reminder-title {
            font-weight: 700; font-size: 17px; color: #222; margin-bottom: 2px;
        }
        .reminder-toast .reminder-text {
            font-size: 15px; color: #444; line-height: 1.5;
        }
        .reminder-toast .reminder-actions {
            display: flex; justify-content: flex-end; margin-top: 8px;
        }
        .reminder-toast .reminder-actions button {
            background: none; color: #22c58b; border: none;
            font-weight: 700; font-size: 15px; cursor: pointer;
            padding: 0; margin: 0;
            transition: color 0.18s;
        }
        .reminder-toast .reminder-actions button:hover {
            color: #17996b;
        }
        .reminder-toast .close-btn {
            background: none; color: #b5bfc6; border: none; font-size: 20px;
            position: absolute; top: 14px; right: 18px; cursor: pointer;
            transition: color 0.18s;
        }
        .reminder-toast .close-btn:hover { color: #222; }
        `;
        document.head.appendChild(style);
    }
    // Container
    let toast = document.createElement('div');
    toast.className = 'reminder-toast';
    toast.innerHTML = `
        <div class="reminder-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V7a8 8 0 1 0-16 0v5c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>
        </div>
        <div class="reminder-content">
            <div class="reminder-title">Rappel de saisie</div>
            <div class="reminder-text">N'oubliez pas d'enregistrer vos dernières transactions pour un suivi précis.</div>
            <div class="reminder-actions">
                <button onclick="window.location.href='transaction.html'">D'accord</button>
            </div>
        </div>
        <button class="close-btn" title="Fermer">✕</button>
    `;
    // Fermer le toast
    toast.querySelector('.close-btn').onclick = () => toast.remove();
    // Auto-fermeture après 8s
    setTimeout(() => { try { toast.remove(); } catch(e){} }, 8000);
    document.body.appendChild(toast);
}

document.addEventListener('DOMContentLoaded', checkAndShowReminderToast);
