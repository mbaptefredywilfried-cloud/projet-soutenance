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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <h2 class="mobile-top-bar-title" id="mobilePageTitle">Dashboard</h2>
        <div class="mobile-top-bar-right" id="mobileTopBarRight">
          <div class="notification-wrapper-mobile" style="position: relative;">
            <button id="notificationBtnMobile" class="notification-btn-mobile" title="Afficher les notifications">
              <i class="fas fa-bell"></i>
              <span id="notificationBadgeMobile" class="notification-badge-mobile" style="display: none; position: absolute; top: -7px; right: -7px; background-color: #ef4444; color: white; font-size: 10px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; z-index: 10;">0</span>
            </button>
            <div id="notificationDropdownMobile" class="notification-dropdown-mobile" style="display: none; position: absolute; top: 100%; right: 0; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.12); width: 300px; max-height: 400px; overflow: hidden; z-index: 1000; margin-top: 10px; border: 1px solid #f1f5f9;">
              <div id="notificationListMobile" style="max-height: 400px; overflow-y: auto;">
                <div style="padding: 30px 20px; text-align: center; color: #94a3b8; font-size: 14px;"><i class="fas fa-bell" style="font-size: 28px; margin-bottom: 10px; opacity: 0.5; display: block;"></i><span data-i18n="noNotifications">Aucune notification</span></div>
              </div>
            </div>
          </div>
          <div class="profile-circle-mobile">
            <img id="userPhotoDisplayMobile" src="./assets/default-avatar.png" alt="Profil">
          </div>
        </div>
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
  // 6-A. SHOW/HIDE NOTIFICATION AND PROFILE ON MOBILE
  // ============================================

  function toggleMobileTopBarRight() {
    const currentPage = getCurrentPage();
    const topBarRight = document.getElementById('mobileTopBarRight');

    if (topBarRight) {
      // Afficher notification et profil SEULEMENT sur dashboard
      if (currentPage === 'dasboard') {
        topBarRight.style.display = 'flex';
      } else {
        topBarRight.style.display = 'none';
      }
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
  // 8-A. SYNC MOBILE PROFILE WITH DESKTOP
  // ============================================

  function syncMobileProfile() {
    // Wait a bit for DOM to be fully loaded and images to be set
    setTimeout(function() {
      const desktopPhoto = document.getElementById('userPhotoDisplay');
      const mobilePhoto = document.getElementById('userPhotoDisplayMobile');
      
      if (desktopPhoto && mobilePhoto) {
        // Initial sync
        mobilePhoto.src = desktopPhoto.src;
        mobilePhoto.alt = desktopPhoto.alt;
        
        // Observe changes on desktop photo to keep mobile synced
        const photoObserver = new MutationObserver(function() {
          if (desktopPhoto.src) {
            mobilePhoto.src = desktopPhoto.src;
          }
        });
        
        photoObserver.observe(desktopPhoto, {
          attributes: true,
          attributeFilter: ['src']
        });

        // Also listen for load events
        desktopPhoto.addEventListener('load', function() {
          mobilePhoto.src = desktopPhoto.src;
        });
      }
    }, 100);
  }

  // ============================================
  // 8-B. SYNC MOBILE NOTIFICATIONS WITH DESKTOP
  // ============================================

  function syncMobileNotifications() {
    // Sync notification badge
    const desktopBadge = document.getElementById('notificationBadge');
    const mobileBadge = document.getElementById('notificationBadgeMobile');
    
    if (desktopBadge && mobileBadge) {
      // Set initial value
      mobileBadge.textContent = desktopBadge.textContent;
      mobileBadge.style.display = desktopBadge.style.display;
      
      // Observe changes with more comprehensive mutation observer
      const badgeObserver = new MutationObserver(function() {
        mobileBadge.textContent = desktopBadge.textContent;
        mobileBadge.style.display = desktopBadge.style.display;
      });
      
      badgeObserver.observe(desktopBadge, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    // Sync notification list
    const desktopList = document.getElementById('notificationList');
    const mobileList = document.getElementById('notificationListMobile');
    
    if (desktopList && mobileList) {
      // Set initial value
      mobileList.innerHTML = desktopList.innerHTML;
      
      // Observe changes
      const listObserver = new MutationObserver(function() {
        mobileList.innerHTML = desktopList.innerHTML;
      });
      
      listObserver.observe(desktopList, {
        childList: true,
        subtree: true
      });
    }

    // Sync notification button click handlers
    const desktopBtn = document.getElementById('notificationBtn');
    const mobileBtn = document.getElementById('notificationBtnMobile');
    const desktopDropdown = document.getElementById('notificationDropdown');
    const mobileDropdown = document.getElementById('notificationDropdownMobile');
    
    if (mobileBtn) {
      mobileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = mobileDropdown.style.display !== 'none';
        mobileDropdown.style.display = isVisible ? 'none' : 'flex';
        mobileDropdown.style.flexDirection = 'column';
      });
    }

    // Close notification dropdown on click outside
    document.addEventListener('click', function(e) {
      if (mobileDropdown && mobileBtn && !mobileDropdown.contains(e.target) && !mobileBtn.contains(e.target)) {
        mobileDropdown.style.display = 'none';
      }
    });
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

  let darkModeObserver = null;

  function observeDarkModeChanges() {
    // Watch for dark mode class changes on body
    darkModeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          applyDarkModeToMobileElements();
        }
      });
    });

    darkModeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Nettoyer l'observer quand on quitte la page
    window.addEventListener('beforeunload', () => {
      if (darkModeObserver) {
        darkModeObserver.disconnect();
      }
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
    toggleMobileTopBarRight();

    // Apply responsive styles
    setMainPadding();
    hideRedundantElements();

    // Sync mobile profile and notifications with desktop
    syncMobileProfile();
    syncMobileNotifications();

    // Handle dark mode
    applyDarkModeToMobileElements();
    observeDarkModeChanges();

    // Handle window resize
    handleWindowResize();

    // Log initialization (for debugging)
    if (window.location.search.includes('debug')) {
      // Debug mode enabled
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
