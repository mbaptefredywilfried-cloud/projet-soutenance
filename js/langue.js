document.addEventListener('DOMContentLoaded', function() {
    // Récupérer la langue sauvegardée ou utiliser 'fr' par défaut
    const savedLanguage = localStorage.getItem('appLanguage') || 'fr';
    
    // Appliquer la langue au chargement
    applyLanguage(savedLanguage);
    
    // Mettre à jour le sélecteur de langue
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = savedLanguage;
        
        // Événement de changement de langue
        languageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            if (selectedLanguage) {
                localStorage.setItem('appLanguage', selectedLanguage);
                applyLanguage(selectedLanguage);
                showToast('Langue changée avec succès !');
                // Recharger la page après un court délai pour appliquer les traductions
                setTimeout(() => {
                    location.reload();
                }, 500);
            }
        });
    }
});

function applyLanguage(lang) {
    if (!translations[lang]) return;
    
    const translation = translations[lang];
    
    // Traduire les éléments avec data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translation[key]) {
            element.textContent = translation[key];
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

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
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
