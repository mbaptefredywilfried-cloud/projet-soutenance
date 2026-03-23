/**
 * RESPONSIVE.JS - Numera Responsive System
 * Handles mobile navigation, top bar injection, and responsive behavior
 */

(function() {
  'use strict';

  // ============================================
  // 1. DEFINE PAGE MAPPING
  // ============================================

  const PAGE_TITLES = {
    'dasboard': 'Dashboard',
    'transaction': 'Transactions',
    'budget': 'Budget',
    'profil': 'Profil',
    'parametre': 'Paramètres'
  };

  // ============================================
  // 2. DETECT CURRENT PAGE
  // ============================================

  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename.replace('.html', '').toLowerCase();
  }

  // ============================================
  // 3. INJECT MOBILE TOP BAR HTML
  // ============================================

  function injectMobileTopBar() {
    // Check if already exists
    if (document.getElementById('mobileTopBar')) {
      return;
    }

    const topBarHTML = `
      <header class="mobile-top-bar" id="mobileTopBar">
        <div class="mobile-top-bar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Numera</span>
        </div>
        <h2 class="mobile-top-bar-title" id="mobilePageTitle">Dashboard</h2>
      </header>
    `;

    // Insert before .content or at the beginning of body
    const content = document.querySelector('.content');
    if (content) {
      content.insertAdjacentHTML('beforebegin', topBarHTML);
    } else {
      document.body.insertAdjacentHTML('afterbegin', topBarHTML);
    }
  }

  // ============================================
  // 4. INJECT TAB NAVIGATION HTML
  // ============================================

  function injectTabNav() {
    // Check if already exists
    if (document.getElementById('tabNav')) {
      return;
    }

    const tabNavHTML = `
      <nav class="tab-nav" id="tabNav">
        <a href="./dasboard.html" class="tab-item" data-page="dasboard" aria-label="Aller au Dashboard">
          <i class="fas fa-home"></i>
          <span>Dashboard</span>
        </a>
        <a href="./transaction.html" class="tab-item" data-page="transaction" aria-label="Aller aux Transactions">
          <i class="fas fa-exchange-alt"></i>
          <span>Transactions</span>
        </a>
        <a href="./budget.html" class="tab-item" data-page="budget" aria-label="Aller au Budget">
          <i class="fas fa-piggy-bank"></i>
          <span>Budget</span>
        </a>
        <a href="./profil.html" class="tab-item" data-page="profil" aria-label="Aller au Profil">
          <i class="fas fa-user"></i>
          <span>Profil</span>
        </a>
        <a href="./parametre.html" class="tab-item" data-page="parametre" aria-label="Aller aux Paramètres">
          <i class="fas fa-cog"></i>
          <span>Params</span>
        </a>
      </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', tabNavHTML);
  }

  // ============================================
  // 5. SET ACTIVE TAB
  // ============================================

  function setActiveTab() {
    const currentPage = getCurrentPage();
    const tabItems = document.querySelectorAll('.tab-item');

    tabItems.forEach(item => {
      if (item.dataset.page === currentPage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // ============================================
  // 6. UPDATE MOBILE PAGE TITLE
  // ============================================

  function updateMobilePageTitle() {
    const currentPage = getCurrentPage();
    const titleElement = document.getElementById('mobilePageTitle');

    if (titleElement) {
      let title = PAGE_TITLES[currentPage] || 'Numera';

      // Try to get translated title if i18n is available
      if (window.traduction && typeof window.traduction === 'object') {
        const translationKey = getTranslationKey(currentPage);
        if (translationKey && window.traduction[translationKey]) {
          title = window.traduction[translationKey];
        }
      }

      titleElement.textContent = title;
    }
  }

  // ============================================
  // 7. HELPER: GET TRANSLATION KEY
  // ============================================

  function getTranslationKey(page) {
    const keys = {
      'dasboard': 'dashboard',
      'transaction': 'navTransaction',
      'budget': 'navBudget',
      'profil': 'navProfil',
      'parametre': 'navParametres'
    };
    return keys[page] || null;
  }

  // ============================================
  // 8. SET MAIN PADDING FOR MOBILE
  // ============================================

  function setMainPadding() {
    if (window.innerWidth <= 768) {
      const main = document.querySelector('main');
      if (main) {
        main.style.paddingBottom = '80px';
      }
    }
  }

  // ============================================
  // 9. HIDE REDUNDANT ELEMENTS ON MOBILE
  // ============================================

  function hideRedundantElements() {
    if (window.innerWidth <= 768) {
      // Hide existing mobile-header if present (transaction.html)
      const mobileHeader = document.querySelector('header.mobile-header');
      if (mobileHeader) {
        mobileHeader.style.display = 'none';
      }

      // Mark top-bar for desktop only
      const topBar = document.querySelector('.top-bar');
      if (topBar) {
        topBar.classList.add('desktop-only');
      }
    }
  }

  // ============================================
  // 10. HANDLE DARK MODE
  // ============================================

  function applyDarkModeToMobileElements() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const tabNav = document.getElementById('tabNav');

    if (tabNav) {
      if (isDarkMode) {
        tabNav.classList.add('dark-mode');
      } else {
        tabNav.classList.remove('dark-mode');
      }
    }
  }

  // ============================================
  // 11. OBSERVE DARK MODE CHANGES
  // ============================================

  function observeDarkModeChanges() {
    // Watch for dark mode class changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          applyDarkModeToMobileElements();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // ============================================
  // 12. HANDLE WINDOW RESIZE
  // ============================================

  function handleWindowResize() {
    let resizeTimeout;

    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        setMainPadding();
        hideRedundantElements();
      }, 250);
    });
  }

  // ============================================
  // 13. INITIALIZE RESPONSIVE SYSTEM
  // ============================================

  function initialize() {
    // Check if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeAfterDOM);
    } else {
      initializeAfterDOM();
    }
  }

  function initializeAfterDOM() {
    // Inject HTML elements
    injectMobileTopBar();
    injectTabNav();

    // Set active states and titles
    setActiveTab();
    updateMobilePageTitle();

    // Apply responsive styles
    setMainPadding();
    hideRedundantElements();

    // Handle dark mode
    applyDarkModeToMobileElements();
    observeDarkModeChanges();

    // Handle window resize
    handleWindowResize();

    // Log initialization (for debugging)
    if (window.location.search.includes('debug')) {
      console.log('[Responsive.js] Initialized for page: ' + getCurrentPage());
    }
  }

  // ============================================
  // 14. EXPORT FOR GLOBAL ACCESS (if needed)
  // ============================================

  window.ResponsiveSystem = {
    getCurrentPage: getCurrentPage,
    setActiveTab: setActiveTab,
    updateMobilePageTitle: updateMobilePageTitle,
    applyDarkMode: applyDarkModeToMobileElements
  };

  // ============================================
  // 15. START INITIALIZATION
  // ============================================

  initialize();
})();
