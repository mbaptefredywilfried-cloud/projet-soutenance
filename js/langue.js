document.addEventListener('DOMContentLoaded', function() {
    // Récupérer la langue sauvegardée ou utiliser 'fr' par défaut
    const savedLanguage = localStorage.getItem('appLanguage') || 'fr';
    
    // Appliquer la langue au chargement
    applyLanguage(savedLanguage);
});

// Écouter les changements de langue depuis d'autres pages/modules
window.addEventListener('languageChanged', function() {
    const savedLanguage = localStorage.getItem('appLanguage') || 'fr';
    applyLanguage(savedLanguage);
});

function applyLanguage(lang) {
    if (!translations[lang]) return;
    
    const translation = translations[lang];
    
    // Traduire les éléments avec data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translation[key]) {
            // Si l'élément a des enfants (comme des icônes), on préserve la structure
            if (element.children.length > 0) {
                // Trouver où placer le texte (après les icônes)
                const lastChild = element.lastChild;
                if (lastChild.nodeType === Node.TEXT_NODE) {
                    lastChild.textContent = ' ' + translation[key];
                } else {
                    element.appendChild(document.createTextNode(' ' + translation[key]));
                }
            } else {
                element.textContent = translation[key];
            }
        }
    });
    
    // Traduire les placeholders avec data-placeholder
    document.querySelectorAll('[data-placeholder]').forEach(element => {
        const key = element.getAttribute('data-placeholder');
        if (translation[key]) {
            element.placeholder = translation[key];
        }
    });
    
    // Traduire les titres (title attribute) avec data-title
    document.querySelectorAll('[data-title]').forEach(element => {
        const key = element.getAttribute('data-title');
        if (translation[key]) {
            element.title = translation[key];
        }
    });
    
    // Mettre à jour la langue HTML
    document.documentElement.lang = lang;
}

function getTranslation(key, defaultText = null) {
    try {
        if (typeof translations === 'undefined') {
            return defaultText || key;
        }
        const lang = localStorage.getItem('appLanguage') || 'fr';
        if (translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }
        return defaultText || key;
    } catch (e) {
        return defaultText || key;
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Essayer de traduire le message
    let displayMessage = getTranslation(message, message);
    
    toast.textContent = displayMessage;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
// Fonction pour créer un toast avec message et bouton d'action
function createToast(message, buttonLabel = null, actionUrl = null) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-custom';
    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        background: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: 'Inter', Arial, sans-serif;
        font-size: 14px;
        color: #1e293b;
        font-weight: 500;
        animation: slideInRight 0.3s ease forwards;
        min-width: 300px;
        flex-wrap: wrap;
    `;

    // Contenu du toast
    let html = `
        <i class="fas fa-bell" style="flex-shrink: 0; color: #36A2EB; font-size: 16px;"></i>
        <span style="flex: 1;">${message}</span>
    `;

    if (buttonLabel && actionUrl) {
        html += `
            <button onclick="window.location.href='${actionUrl}'" style="
                background: #36A2EB;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 13px;
                flex-shrink: 0;
                transition: background 0.2s;
            " onmouseover="this.style.background='#2185d0'" onmouseout="this.style.background='#36A2EB'">
                ${buttonLabel}
            </button>
        `;
    }

    toast.innerHTML = html;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}