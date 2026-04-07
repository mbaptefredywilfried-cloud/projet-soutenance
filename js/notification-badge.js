// Notification Badge System - Server-based
(function() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');

    if (!notificationBtn) return;

    // Charger les notifications du serveur
    async function loadNotifications() {
        console.log('[NOTIF] Chargement des notifications...');
        try {
            const response = await fetch('./php/notifications/get_notifications.php');
            const data = await response.json();

            if (data.status === 'success') {
                console.log('[NOTIF] Notifications reçues:', data.notifications);
                console.log('[NOTIF] Nombre total de notifications:', data.notifications ? data.notifications.length : 0);
                console.log('[NOTIF] Nombre non lues:', data.unread_count);
                
                // Log les types de notifications reçues
                if (data.notifications && data.notifications.length > 0) {
                    const typeCount = {};
                    data.notifications.forEach(notif => {
                        typeCount[notif.type] = (typeCount[notif.type] || 0) + 1;
                    });
                    console.log('[NOTIF] Répartition par type:', typeCount);
                }
                
                updateBadge(data.unread_count);
                // Toujours re-rendre les notifications pour appliquer les traductions mises à jour
                renderNotifications(data.notifications);
            } else {
                console.error('[NOTIF] Erreur du serveur:', data.message);
            }
        } catch (error) {
            console.error('[NOTIF] Erreur lors du chargement:', error);
        }
    }

    // Mettre à jour le badge
    function updateBadge(count) {
        if (count > 0) {
            notificationBadge.textContent = count > 100 ? '99+' : count;
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

    // Traduire les titres des notifications à partir de la clée de traduction
    function translateNotificationTitle(title) {
        const currentLang = localStorage.getItem('appLanguage') || 'fr';
        const trans = translations[currentLang];
        
        console.log(`[NOTIF] Traduction titre: "${title}" (langue: ${currentLang})`);
        
        if (!trans) {
            console.warn('[NOTIF] Traductions manquantes');
            return title;
        }
        
        // Si le titre commence par 'notif_', c'est une clée de traduction
        if (title.startsWith('notif_') && trans[title]) {
            const translated = trans[title];
            console.log(`[NOTIF] Traduction appliquée via clée: "${translated}"`);
            return translated;
        }
        
        console.log('[NOTIF] Titre original retourné (pas une clée)');
        return title;
    }

    // Rendre les notifications
    function renderNotifications(notifications) {
        if (!notifications || notifications.length === 0) {
            const lang = localStorage.getItem('appLanguage') || 'fr';
            const trans = translations?.[lang] || translations?.fr || {};
            const noNotifText = trans.noNotifications || (lang === 'en' ? 'No notifications' : 'Aucune notification');
            notificationList.innerHTML = '<div style="padding: 30px 20px; text-align: center; color: #94a3b8; font-size: 14px;"><i class="fas fa-bell" style="font-size: 28px; margin-bottom: 10px; opacity: 0.5; display: block;"></i>' + noNotifText + '</div>';
            return;
        }

        // Créer l'en-tête avec options
        const unreadCount = notifications.filter(n => !n.is_read).length;
        const lang = localStorage.getItem('appLanguage') || 'fr';
        const trans = translations?.[lang] || translations?.fr || {};
        
        let headerLabel = '';
        if (unreadCount > 0) {
            const newText = trans.newNotifications || (lang === 'en' ? '{count} new' : '{count} nouveau{plural}');
            const plural = lang === 'fr' ? (unreadCount > 1 ? 'x' : '') : '';
            headerLabel = newText.replace('{count}', unreadCount).replace('{plural}', plural);
        } else {
            headerLabel = trans.notificationsLabel || 'Notifications';
        }
        
        const markAllReadTitle = trans.markAllAsRead || (lang === 'en' ? 'Mark all as read' : 'Tout marquer comme lu');
        const deleteAllTitle = trans.deleteAllNotifications || (lang === 'en' ? 'Delete all' : 'Tout supprimer');
        
        const headerHTML = `
            <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background-color: white; z-index: 10;">
                <div style="font-weight: 600; color: #1e293b; font-size: 13px;">
                    ${headerLabel}
                </div>
                <div style="display: flex; gap: 6px;">
                    ${unreadCount > 0 ? `<button id="markAllRead" class="notif-action-btn" title="${markAllReadTitle}" style="
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #36A2EB;
                        font-size: 12px;
                        padding: 4px 8px;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.backgroundColor='rgba(54, 162, 235, 0.1)'" onmouseout="this.style.backgroundColor='transparent'">
                        <i class="fas fa-check-double"></i>
                    </button>` : ''}
                    ${notifications.length > 0 ? `<button id="deleteAllNotif" class="notif-action-btn" title="${deleteAllTitle}" style="
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #ef4444;
                        font-size: 12px;
                        padding: 4px 8px;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.backgroundColor='rgba(239, 68, 68, 0.1)'" onmouseout="this.style.backgroundColor='transparent'">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>
            </div>
        `;

        notificationList.innerHTML = headerHTML + notifications.map(notif => {
            const date = new Date(notif.created_at);
            const timeAgo = getTimeAgo(date);
            const bgColor = notif.is_read ? 'transparent' : 'rgba(54, 162, 235, 0.05)';
            const typeIcon = getIconForType(notif.type);
            const translatedMessage = translateMessageCategories(notif.message);
            const translatedTitle = translateNotificationTitle(notif.title);
            const typeColor = getColorForType(notif.type);
            const borderLeft = typeColor;
            const readDot = notif.is_read ? '' : `<div style="width: 8px; height: 8px; background-color: ${typeColor}; border-radius: 50%; flex-shrink: 0;"></div>`;

            return `
                <div class="notification-item" data-id="${notif.id}" style="
                    padding: 14px 16px;
                    border-left: 3px solid ${borderLeft};
                    background-color: ${bgColor};
                    border-bottom: 1px solid #f1f5f9;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='${bgColor}'">
                    <div style="
                        font-size: 20px;
                        color: ${typeColor};
                        flex-shrink: 0;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: ${typeColor}15;
                        border-radius: 8px;
                    ">
                        <i class="fas fa-${typeIcon}"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                            <div style="font-weight: 600; color: #1e293b; font-size: 13px; flex: 1;">
                                ${translatedTitle}
                            </div>
                            ${readDot}
                        </div>
                        <div style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 6px;">
                            ${translatedMessage}
                        </div>
                        <div style="color: #94a3b8; font-size: 11px;">
                            ${timeAgo}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Ajouter l'event listener pour "Tout marquer comme lu"
        const markAllBtn = notificationList.querySelector('#markAllRead');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                markAllAsRead();
            });
        }

        // Ajouter l'event listener pour "Tout supprimer"
        const deleteAllBtn = notificationList.querySelector('#deleteAllNotif');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteAllNotifications();
            });
        }

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
            'error': 'times-circle',
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
        }
    }

    // Marquer toutes les notifications comme lues
    async function markAllAsRead() {
        try {
            const response = await fetch('./php/notifications/get_notifications.php');
            const data = await response.json();
            
            if (data.status === 'success' && data.notifications) {
                for (const notif of data.notifications) {
                    if (!notif.is_read) {
                        const formData = new FormData();
                        formData.append('notification_id', notif.id);
                        await fetch('./php/notifications/mark_as_read.php', {
                            method: 'POST',
                            body: formData
                        });
                    }
                }
                loadNotifications();
            }
        } catch (error) {
        }
    }

    // Supprimer toutes les notifications
    async function deleteAllNotifications() {
        try {
            const response = await fetch('./php/notifications/get_notifications.php');
            const data = await response.json();
            
            if (data.status === 'success' && data.notifications) {
                for (const notif of data.notifications) {
                    const formData = new FormData();
                    formData.append('notification_id', notif.id);
                    await fetch('./php/notifications/delete.php', {
                        method: 'POST',
                        body: formData
                    }).catch(() => {}); // Continuer même si une suppression échoue
                }
                loadNotifications();
            }
        } catch (error) {
        }
    }

    // Basculer le dropdown avec animations
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = notificationDropdown.style.display === 'none';
        
        if (isHidden) {
            notificationDropdown.style.display = 'block';
            // Force reflow
            notificationDropdown.offsetHeight;
            loadNotifications();
        } else {
            notificationDropdown.style.display = 'none';
        }
    });

    // Fermer le dropdown en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.style.display = 'none';
        }
    });

    // Fermer avec la touche Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && notificationDropdown.style.display !== 'none') {
            notificationDropdown.style.display = 'none';
        }
    });

    // Charger les notifications au chargement de la page
    document.addEventListener('DOMContentLoaded', loadNotifications);

    // Écouter les changements de langue et retraduite les notifications
    window.addEventListener('languageChanged', () => {
        console.log('[NOTIF] Événement languageChanged détecté');
        // Recharger les notifications chaque fois que la langue change, même si le dropdown est fermé
        loadNotifications();
    });

    // Écouter les changements de devise et retraduite les notifications
    window.addEventListener('appCurrencyChanged', () => {
        console.log('[NOTIF] Événement appCurrencyChanged détecté');
        loadNotifications();
    });

    // Écouter les changements de langue via localStorage (pour les onglets multiples)
    window.addEventListener('storage', (e) => {
        if (e.key === 'appLanguage' && e.newValue !== e.oldValue) {
            console.log(`[NOTIF] Changement de langue détecté via storage: ${e.oldValue} → ${e.newValue}`);
            // Recharger les notifications pour que la langue soit appliquée
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
