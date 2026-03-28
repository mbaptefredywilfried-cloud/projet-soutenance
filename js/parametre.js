// --- PARAMÈTRES UTILISATEUR ---
let userSettings = {
    accent_gradient: 'linear-gradient(180deg, #36A2EB 0%, #36A2EB 100%)',
    language: 'fr',
    currency: '€',
    dark_mode: false
};

function loadUserSettings() {
    fetch('php/data/user_profile.php?action=get', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(resp => resp.json())
    .then(data => {
        if (data && data.settings) {
            userSettings = { ...userSettings, ...data.settings };
        }
        applySettingsToUI();
    })
    .catch(() => {
        applySettingsToUI(); // fallback valeurs par défaut
    });
}

function saveUserSettings(changes) {
    userSettings = { ...userSettings, ...changes };
    // Mettre à jour la devise globalement si elle change
    if (changes.currency) {
        window.appCurrency = changes.currency;
        // Émettre un événement pour notifier les autres composants du changement de devise
        window.dispatchEvent(new Event('appCurrencyChanged'));
    }
    // Mettre à jour le mode sombre globalement si elle change
    if (changes.dark_mode !== undefined) {
        window.appDarkMode = changes.dark_mode ? 1 : 0;
        window.dispatchEvent(new Event('darkModeChanged'));
    }
    fetch('php/data/save_user_settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(userSettings)
    })
    .then(resp => {
        try {
            return resp.json();
        } catch (e) {
            return { success: true };
        }
    })
    .then(result => {
        if (result && result.success) {
            // Ne pas afficher de toast ici, c'est géré au niveau de chaque paramètre
        }
        // Ne rien afficher en cas d'erreur réseau, car la base est à jour
    })
    .catch(() => {
        // Ne rien afficher, ou éventuellement showToast('Paramètres enregistrés !');
    });
}

function applySettingsToUI() {
    // Mode sombre
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = userSettings.dark_mode === true || userSettings.dark_mode === 1;
        
        // Appliquer le mode sombre à toutes les pages
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    // Accent - Extraire la couleur depuis le gradient pour la comparaison
    const extractColorFromGradient = (gradient) => {
        // Si c'est déjà une couleur simple, la retourner
        if (gradient.startsWith('#')) return gradient;
        // Sinon, extraire la première couleur du gradient
        const match = gradient.match(/#[0-9a-fA-F]{6}/);
        return match ? match[0] : '#36A2EB';
    };
    
    const currentColor = extractColorFromGradient(userSettings.accent_gradient);
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.style.borderColor = 'transparent';
        if (option.getAttribute('data-color').toLowerCase() === currentColor.toLowerCase()) {
            option.style.borderColor = '#1e293b';
        }
    });
        // On utilise la fonction applyAccentColor de common.js pour garantir la cohérence sur toutes les pages
        // (Suppose que common.js est chargé AVANT parametre.js dans le HTML)
        // Si besoin, on vérifie son existence avant de l'utiliser
    
        // function applyAccentColor(color) { ... } supprimée car déjà définie dans common.js
        applyAccentColor(userSettings.accent_gradient);

    // Devise
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        const hasOption = Array.from(currencySelect.options).some(o => o.value === userSettings.currency);
        if (hasOption) currencySelect.value = userSettings.currency;
    }

    // Langue
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        const hasLang = Array.from(languageSelect.options).some(o => o.value === userSettings.language);
        if (hasLang) languageSelect.value = userSettings.language;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserSettings();

    // --- Couleur d'accent ---
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.style.borderColor = 'transparent');
            this.style.borderColor = '#1e293b';
            const selectedColor = this.getAttribute('data-color');
            // Appliquer la couleur immédiatement pour effet instantané
            applyAccentColor(selectedColor);
            // Toujours enregistrer en linear-gradient pour la persistance
            const gradient = `linear-gradient(180deg, ${selectedColor} 0%, ${darkenColor(selectedColor, 30)} 100%)`;
            saveUserSettings({ accent_gradient: gradient });
        });
    });

    // --- MODE SOMBRE ---
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            const isDarkMode = darkModeToggle.checked;
            
            // Appliquer le mode sombre immédiatement au DOM
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            
            // Sauvegarder en BDD
            saveUserSettings({ dark_mode: isDarkMode ? 1 : 0 });
            
            // Émettre un événement pour notifier les autres pages
            window.dispatchEvent(new Event('darkModeChanged'));
            
            const msgKey = isDarkMode ? 'darkModeEnabled' : 'darkModeDisabled';
            showToast(msgKey);
        });
    }

    // --- Devise principale ---
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', () => {
            const selected = currencySelect.value;
            saveUserSettings({ currency: selected });
            showToast('currencyUpdated');
        });
    }

    // --- Langue ---
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', async () => {
            const lang = languageSelect.value;
            
            // Stocker la langue dans localStorage pour que les autres composants le détectent
            localStorage.setItem('appLanguage', lang);
            
            // Appliquer les traductions dynamiquement AVANT de sauvegarder
            if (typeof applyLanguage === 'function') {
                applyLanguage(lang);
            }
            
            // Envoyer la langue au serveur pour mise à jour en session et BDD
            try {
                const response = await fetch('php/data/update_language.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ language: lang })
                });
                const result = await response.json();
                if (result.success) {
                    // Aussi sauvegarder dans userSettings pour l'UI
                    saveUserSettings({ language: lang });
                    // Émettre un événement pour notifier les autres pages du changement de langue
                    window.dispatchEvent(new Event('languageChanged'));
                    showToast('languageChanged');
                } else {
                    showToast('languageUpdateError');
                }
            } catch (error) {
                console.error('Erreur:', error);
                saveUserSettings({ language: lang });
                // Émettre l'événement même en cas d'erreur réseau
                window.dispatchEvent(new Event('languageChanged'));
                showToast('languageChanged');
            }
        });
    }

    // ...existing code pour le reste...
});
    
    // --- 3.c GESTION DES RAPPELS DE SAISIE ---
    const reminderToggle = document.getElementById('reminderToggle');
    if (reminderToggle) {
        const savedReminder = localStorage.getItem('notificationsRappel');
        if (savedReminder === 'true') {
            reminderToggle.checked = true;
        }
        
        reminderToggle.addEventListener('change', () => {
            const enabled = reminderToggle.checked;
            if (typeof setNotificationRappel === 'function') {
                setNotificationRappel(enabled);
            }
            const msgKey = enabled ? 'remindersEnabled' : 'remindersDisabled';
            showToast(msgKey);
        });
    }
    
    // --- 3.d GESTION DES NOTIFICATIONS DE DÉPASSEMENT DE BUDGET ---
    const budgetOverrunToggle = document.getElementById('budgetOverrunToggle');
    if (budgetOverrunToggle) {
        const savedOverrun = localStorage.getItem('budgetOverrunNotification');
        if (savedOverrun === 'true') {
            budgetOverrunToggle.checked = true;
        }
        
        budgetOverrunToggle.addEventListener('change', () => {
            const enabled = budgetOverrunToggle.checked;
            localStorage.setItem('budgetOverrunNotification', enabled ? 'true' : 'false');
            const msgKey = enabled ? 'budgetOverrunEnabled' : 'budgetOverrunDisabled';
            showToast(msgKey);
        });
    }

    // --- 3.e GESTION DU CHANGEMENT DE MOT DE PASSE ---
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const toggleOld = document.querySelector('.toggle-password-old');
    const toggleNew = document.querySelector('.toggle-password');
    const toggleConfirm = document.querySelector('.toggle-password-confirm');

    // Toggle password visibility for all three fields
    if (toggleOld) {
        toggleOld.addEventListener('click', (e) => {
            e.preventDefault();
            const isPassword = oldPasswordInput.type === 'password';
            oldPasswordInput.type = isPassword ? 'text' : 'password';
            toggleOld.innerHTML = isPassword ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    if (toggleNew) {
        toggleNew.addEventListener('click', (e) => {
            e.preventDefault();
            const isPassword = newPasswordInput.type === 'password';
            newPasswordInput.type = isPassword ? 'text' : 'password';
            toggleNew.innerHTML = isPassword ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    if (toggleConfirm) {
        toggleConfirm.addEventListener('click', (e) => {
            e.preventDefault();
            const isPassword = confirmPasswordInput.type === 'password';
            confirmPasswordInput.type = isPassword ? 'text' : 'password';
            toggleConfirm.innerHTML = isPassword ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Save password button
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', () => {
            const oldPass = oldPasswordInput ? oldPasswordInput.value.trim() : '';
            const newPass = newPasswordInput ? newPasswordInput.value.trim() : '';
            const confirmPass = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

            // Validation côté client
            if (!oldPass || !newPass || !confirmPass) {
                showModernPopup(getTranslation('popupErrorTitle'), getTranslation('errorPasswordFieldsRequired'), "error");
                return;
            }
            if (newPass.length < 8) {
                showModernPopup(getTranslation('popupErrorTitle'), getTranslation('errorPasswordMinLength'), "error");
                return;
            }
            if (newPass !== confirmPass) {
                showModernPopup(getTranslation('popupErrorTitle'), getTranslation('errorPasswordMismatch'), "error");
                return;
            }
            if (oldPass === newPass) {
                showModernPopup(getTranslation('popupErrorTitle'), getTranslation('errorPasswordSame'), "error");
                return;
            }

            // Envoi au serveur
            savePasswordBtn.disabled = true;
            fetch('php/data/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ old_password: oldPass, new_password: newPass })
            })
            .then(resp => resp.json())
            .then(result => {
                savePasswordBtn.disabled = false;
                oldPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                if (result.success) {
                    showModernPopup(getTranslation('popupSuccessTitle'), getTranslation('passwordChangeSuccess'), "success");
                } else {
                    showModernPopup(getTranslation('popupErrorTitle'), getTranslation('passwordChangeError'), "error");
                }
            })
            .catch(err => {
                savePasswordBtn.disabled = false;
                showModernPopup(getTranslation('popupErrorTitle'), getTranslation('networkError2'), "error");
            });
        });
    }
    // --- 4. EXPORTATION DES DONNÉES (DEPUIS LA BASE DE DONNÉES) ---
    const exportBtn = document.getElementById('exportCSVBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            // Désactiver le bouton pendant l'export
            exportBtn.disabled = true;
            
            // Appeler directement l'endpoint PHP qui génère le CSV depuis la BDD
            fetch('php/data/export_data.php', {
                method: 'GET',
                credentials: 'same-origin'
            })
            .then(response => {
                exportBtn.disabled = false;
                
                if (!response.ok) {
                    showModernPopup(
                        getTranslation('popupErrorTitle'),
                        getTranslation('exportError'),
                        "error"
                    );
                    return;
                }
                
                // Récupérer le CSV depuis la réponse
                return response.blob().then(blob => {
                    // Créer un lien de téléchargement
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `Export_Numera_${new Date().toISOString().slice(0,10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Succès -> Toast
                    showToast('dataExported');
                    
                    // Mettre à jour la date de dernière sauvegarde
                    const lastBackupSpan = document.getElementById('lastBackupSpan');
                    if (lastBackupSpan) {
                        lastBackupSpan.textContent = new Date().toLocaleString('fr-FR');
                    }
                });
            })
            .catch(error => {
                exportBtn.disabled = false;
                console.error('Erreur export:', error);
                showModernPopup(
                    getTranslation('popupErrorTitle'),
                    getTranslation('exportErrorNetwork'),
                    "error"
                );
            });
        });
    }

    // --- 5. RÉINITIALISATION DES DONNÉES ---
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            showResetConfirmModal(
                getTranslation('resetConfirmTitle'), 
                getTranslation('resetConfirmMessage')
            );
        });

// --- 6. FONCTION TOAST (SUCCÈS) ---
function showToast(message) {
    // Essayer de traduire le message s'il s'agit d'une clé
    let displayMessage = message;
    try {
        if (typeof translations !== 'undefined') {
            const lang = localStorage.getItem('appLanguage') || 'fr';
            if (translations[lang] && translations[lang][message]) {
                displayMessage = translations[lang][message];
            }
        }
    } catch (e) {
        // En cas d'erreur, afficher le message tel quel
    }
    
    const toast = document.createElement('div');
    toast.style = `
        position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white;
        padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 15px rgba(0,0,0,0.2);
        z-index: 10005; display: flex; align-items: center; gap: 10px;
        font-weight: 600; font-family: sans-serif; animation: slideInRight 0.5s ease forwards;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${displayMessage}`;
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
    
    const color = type === "error" ? "#ef4444" : "#36A2EB";
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
                <button id="closePopupBtn" style="background:#1e293b; color:white; border:none; padding:12px; border-radius:10px; width:100%; cursor:pointer; font-weight:600;">${getTranslation('buttonUnderstood')}</button>
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
                    <button id="btnCancelReset" style="background:#f1f5f9; color:#475569; border:none; padding:12px; border-radius:10px; font-weight:600; cursor:pointer; flex:1;">${getTranslation('buttonCancel')}</button>
                    <button id="btnConfirmReset" style="background:#ef4444; color:white; border:none; padding:12px; border-radius:10px; font-weight:600; cursor:pointer; flex:1;">${getTranslation('buttonConfirmDelete')}</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('btnCancelReset').onclick = () => overlay.remove();
        document.getElementById('btnConfirmReset').onclick = () => {
            fetch('php/data/reset_data.php', {
                method: 'POST',
                credentials: 'same-origin'
            })
            .then(resp => resp.json())
            .then(result => {
                overlay.remove();
                if (result.success) {
                    showModernPopup(getTranslation('popupSuccessTitle'), getTranslation('resetSuccess'), 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showModernPopup(getTranslation('popupErrorTitle'), getTranslation('resetError'), 'error');
                }
            })
            .catch(() => {
                overlay.remove();
                showModernPopup(getTranslation('popupErrorTitle'), getTranslation('exportErrorNetwork'), 'error');
            });
        };
}

// --- 9. APPLICATION DE L'ACCENT & UTILITAIRES ---
function applyAccentColor(color) {
    const isDark = document.body.classList.contains('dark-mode');
    let accentColor = color;
    
    // Extraire la couleur du gradient si c'est un gradient
    if (color.startsWith('linear-gradient')) {
        const match = color.match(/#([0-9a-fA-F]{6})/);
        if (match) accentColor = match[0];
    }
    
    const darkerColor = darkenColor(accentColor, 30); 
    const gradient = `linear-gradient(180deg, ${accentColor} 0%, ${darkerColor} 100%)`;

    const aside = document.querySelector('aside');
    if (aside) {
        aside.style.background = isDark ? '#2d2d2d' : gradient;
    }

    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.style.background = accentColor;
        btn.style.borderColor = accentColor;
    });

    document.querySelectorAll('.icon-box').forEach(box => {
        box.style.background = accentColor;
    });

    const accentPreview = document.querySelector('.preview-box.accent-box');
    if (accentPreview) {
        accentPreview.style.backgroundColor = accentColor;
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
        .card .card-item .setting-item .switch input:checked + .slider { background-color: ${accentColor} !important; }
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
}