// common.js - Script commun pour appliquer la couleur d'accent et gérer la navigation



document.addEventListener('DOMContentLoaded', function() {
    const accentColor = localStorage.getItem('accentColor') || '#3b82f6';
    console.log('Accent color from localStorage:', accentColor);
    
    applyAccentColor(accentColor);
    updateActiveMenu(); // Ajout de la vérification du menu actif
});

// --- NOUVEAU : GESTION DYNAMIQUE DU MENU ACTIF ---
function updateActiveMenu() {
    const links = document.querySelectorAll('aside .nav a');
    const currentPath = window.location.pathname.split('/').pop(); // Récupère juste "profil.html" ou "budget.html"

    links.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        
        // On compare le nom de fichier actuel avec le href du lien
        if (currentPath === linkPath) {
            link.classList.add('active');
        } else {
            // On retire la classe active si ce n'est pas la bonne page
            link.classList.remove('active');
        }
    });
}

function applyAccentColor(color) {
    const darkerColor = darkenColor(color, 30);
    const gradient = `linear-gradient(180deg, ${color} 0%, ${darkerColor} 100%)`;

    // Aside
    const aside = document.querySelector('aside');
    if (aside) {
        aside.style.background = gradient;
    }

    // Boutons primaires
    const btnPrimaries = document.querySelectorAll('.btn-primary');
    btnPrimaries.forEach(btn => {
        btn.style.background = gradient;
        btn.style.borderColor = color;
    });

    // Switches
    const switches = document.querySelectorAll('.switch');
    switches.forEach(switchEl => {
        const input = switchEl.querySelector('input[type="checkbox"]');
        const slider = switchEl.querySelector('.slider');
        if (input && slider) {
            if (input.checked) {
                slider.style.backgroundColor = color;
                slider.classList.add('accent-active');
            }
        }
    });

    // Écouteurs pour les switches
    const switchInputs = document.querySelectorAll('.switch input[type="checkbox"]');
    switchInputs.forEach(input => {
        input.addEventListener('change', function() {
            const slider = this.parentElement.querySelector('.slider');
            if (this.checked) {
                slider.style.backgroundColor = color;
                slider.classList.add('accent-active');
            } else {
                slider.style.backgroundColor = '';
                slider.classList.remove('accent-active');
            }
        });
    });

    // Profil Header & Navigation rapide
    document.querySelectorAll('.side-header').forEach(header => {
        header.style.setProperty('background', gradient, 'important');
    });

    document.querySelectorAll('.navigation ul li').forEach(li => {
        li.style.setProperty('background', gradient, 'important');
    });

    addHoverStyles(color);
}

function addHoverStyles(color) {
    const darkerColor = darkenColor(color, 30);
    const evenDarker = darkenColor(color, 50);
    const hoverGradient = `linear-gradient(180deg, ${darkerColor} 0%, ${evenDarker} 100%)`;
    
    // Pour éviter de dupliquer la balise style à chaque appel
    let styleTag = document.getElementById('dynamic-accent-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-accent-styles';
        document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
        .btn-primary:hover { background: ${hoverGradient} !important; border-color: ${darkerColor} !important; }
        .navigation ul li:hover { background: ${hoverGradient} !important; }
        aside .nav a.active { background: rgba(255,255,255,0.2); font-weight: bold; }
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


