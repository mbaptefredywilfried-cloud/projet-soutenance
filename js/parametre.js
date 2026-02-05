document.addEventListener('DOMContentLoaded', function () {

    if (localStorage.getItem('resetSuccess') === 'true') {
        showToast("Données réinitialisées !");
        localStorage.removeItem('resetSuccess'); // On l'efface pour qu'il ne revienne pas
    }
    // --- 1. INITIALISATION DU THÈME ET COULEUR ---
    const savedTheme = localStorage.getItem('darkMode');
    const savedColor = localStorage.getItem('accentColor') || '#2563eb';
    const darkModeToggle = document.getElementById('darkModeToggle');

    if (savedTheme === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    applyAccentColor(savedColor);

    // --- 2. LOGIQUE DU MODE SOMBRE ---
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            const isDark = darkModeToggle.checked;
            if (isDark) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
            const currentAccent = localStorage.getItem('accentColor') || '#2563eb';
            applyAccentColor(currentAccent);
        });
    }

    // --- 3. LOGIQUE DES COULEURS D'ACCENT ---
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        if (option.getAttribute('data-color') === savedColor) {
            option.style.borderColor = '#1e293b';
        }

        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.style.borderColor = 'transparent');
            this.style.borderColor = '#1e293b';
            const selectedColor = this.getAttribute('data-color');
            localStorage.setItem('accentColor', selectedColor);
            applyAccentColor(selectedColor);
        });
    });

    // --- 4. EXPORTATION DES DONNÉES (AVEC POPUP ERREUR ET TOAST SUCCÈS) ---
    const exportBtn = document.getElementById('exportCSVBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            
            // Cas 1 : Aucune donnée -> Popup Moderne
            if (transactions.length === 0) {
                showModernPopup(
                    "Exportation impossible", 
                    "Vous n'avez aucune transaction enregistrée à exporter pour le moment.", 
                    "info"
                );
                return;
            }

            // Génération du CSV
            let csvContent = "\uFEFFDate,Description,Catégorie,Type,Montant\n";
            transactions.forEach(t => {
                const date = new Date(t.date).toLocaleDateString('fr-FR');
                const desc = t.description ? `"${t.description.replace(/"/g, '""')}"` : "";
                const type = t.type === 'income' ? 'Revenu' : 'Dépense';
                const row = [date, desc, t.category, type, t.amount].join(",");
                csvContent += row + "\n";
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Spend2_Export_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Succès -> Affichage du Toast
            showToast("Données exportées avec succès !");

            const lastBackupSpan = document.getElementById('lastBackupSpan');
            if (lastBackupSpan) {
                lastBackupSpan.textContent = new Date().toLocaleString('fr-FR');
            }
        });
    }

    // --- 5. RÉINITIALISATION DES DONNÉES ---
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            showResetConfirmModal(
                "Réinitialisation", 
                "Êtes-vous sûr ? Toutes vos transactions et vos budgets seront définitivement supprimés."
            );
        });
    }
});

// --- 6. FONCTION TOAST (SUCCÈS) ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.style = `
        position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white;
        padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 15px rgba(0,0,0,0.2);
        z-index: 10005; display: flex; align-items: center; gap: 10px;
        font-weight: 600; font-family: sans-serif; animation: slideInRight 0.5s ease forwards;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideOutRight 0.5s ease forwards";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- 7. FONCTION POPUP MODERNE (ERREUR/INFO) ---
function showModernPopup(titre, message, type = "error") {
    const overlay = document.createElement('div');
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:10002;animation:fadeIn 0.3s ease;";
    
    const color = type === "error" ? "#ef4444" : "#3b82f6";
    const icon = type === "error" ? "fa-exclamation-circle" : "fa-info-circle";

    overlay.innerHTML = `
        <div style="background:white;padding:0;border-radius:16px;width:90%;max-width:400px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.2);animation:slideUp 0.4s ease; font-family:sans-serif;">
            <div style="height:6px; background:${color};"></div>
            <div style="padding:30px; text-align:center;">
                <div style="width:60px; height:60px; background:${color}22; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 15px;">
                    <i class="fas ${icon}" style="font-size:25px; color:${color};"></i>
                </div>
                <h2 style="margin:0 0 10px; color:#1e293b;">${titre}</h2>
                <p style="color:#64748b; margin-bottom:20px; line-height:1.5;">${message}</p>
                <button id="closePopupBtn" style="background:#1e293b; color:white; border:none; padding:12px; border-radius:10px; width:100%; cursor:pointer; font-weight:600;">Compris</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('closePopupBtn').onclick = () => overlay.remove();
}

// --- 8. POPUP DE CONFIRMATION DE RÉINITIALISATION ---
function showResetConfirmModal(titre, message) {
    const overlay = document.createElement('div');
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:10002;animation:fadeIn 0.3s ease;";

    overlay.innerHTML = `
        <div style="background:white;padding:0;border-radius:16px;width:90%;max-width:400px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.25);animation:slideUp 0.4s ease; font-family:sans-serif;">
            <div style="height:6px; background:linear-gradient(90deg, #f59e0b, #ef4444);"></div>
            <div style="padding:30px; text-align:center;">
                <div style="width:70px; height:70px; background:#fff7ed; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size:30px; color:#f59e0b;"></i>
                </div>
                <h2 style="margin:0 0 10px; color:#1e293b;">${titre}</h2>
                <p style="margin:0 0 25px; color:#64748b; line-height:1.6;">${message}</p>
                <div style="display:flex; gap:10px;">
                    <button id="btnCancelReset" style="background:#f1f5f9; color:#475569; border:none; padding:12px; border-radius:10px; font-weight:600; cursor:pointer; flex:1;">Annuler</button>
                    <button id="btnConfirmReset" style="background:#ef4444; color:white; border:none; padding:12px; border-radius:10px; font-weight:600; cursor:pointer; flex:1;">Supprimer</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('btnCancelReset').onclick = () => overlay.remove();
    document.getElementById('btnConfirmReset').onclick = () => {
        const email = localStorage.getItem('userEmail');
        const pass = localStorage.getItem('userPassword');
        const name = localStorage.getItem('userName');
        const accent = localStorage.getItem('accentColor');
        const theme = localStorage.getItem('darkMode');

        localStorage.clear();

        if(email) localStorage.setItem('userEmail', email);
        if(pass) localStorage.setItem('userPassword', pass);
        if(name) localStorage.setItem('userName', name);
        if(accent) localStorage.setItem('accentColor', accent);
        if(theme) localStorage.setItem('darkMode', theme);

        localStorage.setItem("transactions", JSON.stringify([]));
        localStorage.setItem('resetSuccess', 'true');
        
        window.location.reload(); 
    };
}

// --- 9. APPLICATION DE L'ACCENT & UTILITAIRES ---
function applyAccentColor(color) {
    const isDark = document.body.classList.contains('dark-mode');
    const darkerColor = darkenColor(color, 30); 
    const gradient = `linear-gradient(180deg, ${color} 0%, ${darkerColor} 100%)`;

    const aside = document.querySelector('aside');
    if (aside) {
        aside.style.background = isDark ? '#2d2d2d' : gradient;
    }

    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.style.background = gradient;
        btn.style.borderColor = color;
    });

    document.querySelectorAll('.icon-box').forEach(box => {
        box.style.background = gradient;
    });

    const accentPreview = document.querySelector('.preview-box.accent-box');
    if (accentPreview) {
        accentPreview.style.backgroundColor = color;
    }

    let dynamicStyle = document.getElementById('dynamic-accent-style');
    if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'dynamic-accent-style';
        document.head.appendChild(dynamicStyle);
    }
    
    dynamicStyle.textContent = `
        @keyframes slideInRight { from { transform: translateX(120%); } to { transform: translateX(0); } }
        @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(120%); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .card .card-item .setting-item .switch input:checked + .slider { background-color: ${color} !important; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .side .nav a:hover:not(.active) { background-color: rgba(255, 255, 255, 0.1); }
    `;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// --- FONCTION TOAST (Notifications en bas à droite) ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.style = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        background: #10b981; 
        color: white;
        padding: 15px 25px; 
        border-radius: 12px; 
        box-shadow: 0 10px 15px rgba(0,0,0,0.2);
        z-index: 10005; 
        display: flex; 
        align-items: center; 
        gap: 10px;
        font-weight: 600; 
        font-family: sans-serif; 
        animation: slideInRight 0.5s ease forwards;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideOutRight 0.5s ease forwards";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}