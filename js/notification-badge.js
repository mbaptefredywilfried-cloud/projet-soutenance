// Notification Badge System - Server-based
(function() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');

    if (!notificationBtn) return;

    // Charger les notifications du serveur
    async function loadNotifications() {
        try {
            const response = await fetch('./php/notifications/get_notifications.php');
            const data = await response.json();

            if (data.status === 'success') {
                updateBadge(data.unread_count);
                renderNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des notifications:', error);
        }
    }

    // Mettre à jour le badge
    function updateBadge(count) {
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }

    // Traduire les noms de catégories dans les messages
    function translateMessageCategories(message) {
        const currentLang = localStorage.getItem('appLanguage') || 'fr';
        const trans = translations[currentLang];
        
        if (!trans) return message;
        
        let translatedMessage = message;
        
        // Traductions des textes statiques du message
        if (currentLang === 'en') {
            translatedMessage = translatedMessage
                .replace(/Dépense de /g, 'Expense of ')
                .replace(/enregistrée dans /g, 'recorded in ')
                .replace(/Revenu de /g, 'Income of ')
                .replace(/enregistré dans /g, 'recorded in ');
        }
        
        // Remplacer EUR par la devise de l'utilisateur
        const userCurrency = window.appCurrency || 'EUR';
        translatedMessage = translatedMessage.replace(/EUR/g, userCurrency);
        
        // Liste des catégories à traduire
        const categories = [
            'food', 'salary', 'bonus', 'clothing', 'communication', 'finance', 'insurance', 'taxes', 
            'subscriptions', 'gifts', 'other', 'side_activity', 'business', 'stock_market', 
            'family_support', 'investments', 'sales', 'refunds', 'exceptional_gains', 'other_income',
            'transport', 'leisure', 'health', 'housing', 'education'
        ];
        
        // Pour chaque catégorie, chercher le nom français et le remplacer par la traduction
        for (let category of categories) {
            // Obtenir le nom de la catégorie dans la langue française
            const frenchName = translations['fr'] ? translations['fr'][category] : null;
            if (frenchName) {
                const translatedName = trans[category] || frenchName;
                // Remplacer le nom français par la traduction
                translatedMessage = translatedMessage.replace(frenchName, translatedName);
            }
        }
        
        return translatedMessage;
    }

    // Traduire les titres des notifications
    function translateNotificationTitle(title) {
        const currentLang = localStorage.getItem('appLanguage') || 'fr';
        const trans = translations[currentLang];
        const frenchTrans = translations['fr'];
        
        if (!trans || !frenchTrans) return title;
        
        // Mapping des titres français vers les clés de traduction
        const titleMappings = {
            [frenchTrans?.notif_income_title]: 'notif_income_title',
            [frenchTrans?.notif_expense_title]: 'notif_expense_title',
            [frenchTrans?.notif_budget_exceeded_title]: 'notif_budget_exceeded_title',
            [frenchTrans?.notif_budget_warning_title]: 'notif_budget_warning_title',
            [frenchTrans?.notif_budget_info_title]: 'notif_budget_info_title',
        };
        
        const translationKey = titleMappings[title];
        if (translationKey && trans[translationKey]) {
            return trans[translationKey];
        }
        
        return title;
    }

    // Rendre les notifications
    function renderNotifications(notifications) {
        if (!notifications || notifications.length === 0) {
            notificationList.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 14px;">Aucune notification</div>';
            return;
        }

        notificationList.innerHTML = notifications.map(notif => {
            const date = new Date(notif.created_at);
            const timeAgo = getTimeAgo(date);
            const bgColor = notif.is_read ? '#f8fafc' : '#f0f4f8';
            const borderLeft = notif.is_read ? '#e2e8f0' : '#36A2EB';
            const typeIcon = getIconForType(notif.type);
            const translatedMessage = translateMessageCategories(notif.message);
            const translatedTitle = translateNotificationTitle(notif.title);

            return `
                <div class="notification-item" data-id="${notif.id}" style="
                    padding: 12px 16px;
                    border-left: 3px solid ${borderLeft};
                    background-color: ${bgColor};
                    border-bottom: 1px solid #e2e8f0;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    opacity: ${notif.is_read ? '0.7' : '1'};
                " onmouseover="this.style.backgroundColor='#f1f5f9'" onmouseout="this.style.backgroundColor='${bgColor}'">
                    <div style="display: flex; gap: 10px;">
                        <div style="font-size: 18px; color: ${getColorForType(notif.type)}; flex-shrink: 0;">
                            <i class="fas fa-${typeIcon}"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 4px;">
                                ${translatedTitle}
                            </div>
                            <div style="color: #64748b; font-size: 12px; line-height: 1.4; margin-bottom: 6px;">
                                ${translatedMessage}
                            </div>
                            <div style="color: #94a3b8; font-size: 11px;">
                                ${timeAgo}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Ajouter les event listeners pour marquer comme lus
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id;
                markAsRead(id);
            });
        });
    }

    // Obtenir l'icône selon le type
    function getIconForType(type) {
        const icons = {
            'info': 'circle-info',
            'warning': 'exclamation-triangle',
            'error': 'circle-xmark',
            'success': 'check-circle',
            'budget': 'piggy-bank',
            'transaction': 'exchange-alt'
        };
        return icons[type] || 'bell';
    }

    // Obtenir la couleur selon le type
    function getColorForType(type) {
        const colors = {
            'info': '#36A2EB',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'success': '#10b981',
            'budget': '#8b5cf6',
            'transaction': '#06b6d4'
        };
        return colors[type] || '#64748b';
    }

    // Calculer le temps écoulé avec traduction
    function getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Déterminer la langue actuelle
        const currentLang = localStorage.getItem('appLanguage') || 'fr';
        const trans = translations[currentLang];

        if (diffMins < 1) return trans?.justNow || 'À l\'instant';
        if (diffMins < 60) return (trans?.minutesAgo || 'Il y a {count}m').replace('{count}', diffMins);
        if (diffHours < 24) return (trans?.hoursAgo || 'Il y a {count}h').replace('{count}', diffHours);
        if (diffDays < 7) return (trans?.daysAgo || 'Il y a {count}j').replace('{count}', diffDays);
        
        return date.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR');
    }

    // Marquer comme lues
    async function markAsRead(notificationId) {
        try {
            const formData = new FormData();
            formData.append('notification_id', notificationId);

            await fetch('./php/notifications/mark_as_read.php', {
                method: 'POST',
                body: formData
            });

            // Recharger les notifications
            loadNotifications();
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
        }
    }

    // Basculer le dropdown
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.style.display = notificationDropdown.style.display === 'none' ? 'block' : 'none';
        if (notificationDropdown.style.display === 'block') {
            loadNotifications();
        }
    });

    // Fermer le dropdown en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.style.display = 'none';
        }
    });

    // Charger les notifications au chargement de la page
    document.addEventListener('DOMContentLoaded', loadNotifications);

    // Recharger les notifications toutes les 30 secondes
    setInterval(loadNotifications, 30000);

    // Écouter les changements de langue et retraduite les notifications
    window.addEventListener('languageChanged', () => {
        loadNotifications();
    });

    // Écouter les changements de devise et retraduite les notifications
    window.addEventListener('appCurrencyChanged', () => {
        loadNotifications();
    });

    // Écouter les changements de langue via localStorage (pour les onglets multiples)
    window.addEventListener('storage', (e) => {
        if (e.key === 'appLanguage' && e.newValue !== e.oldValue) {
            loadNotifications();
        }
    });

    // Exposer la fonction pour créer des notifications depuis d'autres scripts
    window.createNotification = function(title, message, type = 'info') {
        // Cette fonction peut être appelée par d'autres scripts
        // Elle va créer une notification côté serveur
        // À implémenter si nécessaire
    };

    // Exposer la fonction pour rafraîchir les notifications immédiatement
    window.refreshNotifications = function() {
        loadNotifications();
    };
})();
