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
