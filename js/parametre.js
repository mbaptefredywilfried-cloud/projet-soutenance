document.addEventListener('DOMContentLoaded', function () {
    // --- 1. INITIALISATION DU THÈME ET COULEUR ---
    const savedTheme = localStorage.getItem('darkMode');
    const savedColor = localStorage.getItem('accentColor') || '#2563eb';
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Appliquer le mode sombre au chargement
    if (savedTheme === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    // Appliquer la couleur d'accent au chargement
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
            
            // Re-appliquer la couleur pour ajuster l'Aside et les composants
            const currentAccent = localStorage.getItem('accentColor') || '#2563eb';
            applyAccentColor(currentAccent);
        });
    }

    // --- 3. LOGIQUE DES COULEURS D'ACCENT ---
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        // Marquer l'option active au chargement
        if (option.getAttribute('data-color') === savedColor) {
            option.style.borderColor = '#1e293b'; // Petit indicateur visuel
        }

        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.style.borderColor = 'transparent');
            this.style.borderColor = '#1e293b';
            
            const selectedColor = this.getAttribute('data-color');
            localStorage.setItem('accentColor', selectedColor);
            applyAccentColor(selectedColor);
        });
    });

    // --- 4. GESTION DE LA SIDEBAR (Persistance des liens) ---
    const links = document.querySelectorAll('aside .nav a');
    if (links.length) {
        links.forEach((link, i) => { if (!link.dataset.id) link.dataset.id = i; });
        const savedLink = localStorage.getItem('activeSidebarLink');
        
        if (savedLink) {
            const el = document.querySelector(`aside .nav a[data-id="${savedLink}"]`);
            if (el) {
                links.forEach(l => l.classList.remove('active'));
                el.classList.add('active');
            }
        }

        links.forEach(link => {
            link.addEventListener('click', function () {
                links.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                localStorage.setItem('activeSidebarLink', this.dataset.id);
            });
        });
    }
});

// --- 5. FONCTION D'APPLICATION GLOBALE DE L'ACCENT ---
function applyAccentColor(color) {
    const isDark = document.body.classList.contains('dark-mode');
    
    // Calcul d'une nuance plus sombre pour le dégradé (30% plus sombre)
    const darkerColor = darkenColor(color, 30); 
    const gradient = `linear-gradient(180deg, ${color} 0%, ${darkerColor} 100%)`;

    // A. Gestion de la Sidebar (Aside)
    const aside = document.querySelector('aside');
    if (aside) {
        // En mode sombre, l'aside reste neutre (Midnight), en clair il prend le dégradé
        aside.style.background = isDark ? '#2d2d2d' : gradient;
    }

    // B. Gestion des Boutons Primaires
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.style.background = gradient;
        btn.style.borderColor = color;
    });

    // C. MISE À JOUR : Gestion des Icon-Boxes dans les cartes
    document.querySelectorAll('.icon-box').forEach(box => {
        box.style.background = gradient;
    });

    // D. Mise à jour de l'aperçu du thème
    const accentPreview = document.querySelector('.preview-box.accent-box');
    if (accentPreview) {
        accentPreview.style.backgroundColor = color;
    }

    // E. Styles dynamiques (Switches, Hovers, etc.)
    let dynamicStyle = document.getElementById('dynamic-accent-style');
    if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'dynamic-accent-style';
        document.head.appendChild(dynamicStyle);
    }
    
    dynamicStyle.textContent = `
        .card .card-item .setting-item .switch input:checked + .slider {
            background-color: ${color} !important;
        }
        .btn-primary:hover { 
            filter: brightness(1.1) !important; 
            transform: translateY(-1px);
        }
        .icon-box:hover {
            filter: contrast(1.2);
            transform: scale(1.05);
        }
        .side .nav a:hover:not(.active) { 
            background-color: rgba(255, 255, 255, 0.1); 
        }
    `;
}

// --- 6. FONCTION UTILITAIRE : DARKEN COLOR ---
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