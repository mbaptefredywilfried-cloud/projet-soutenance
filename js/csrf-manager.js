/**
 * csrf-manager.js
 * Gère les tokens CSRF pour toutes les requêtes AJAX
 * 
 * IMPORTANT: Ce script doit être inclus AVANT tout autre script qui fait des requêtes
 * Il patche automatiquement fetch() pour ajouter le token CSRF à TOUTES les requêtes
 */

(function() {
    'use strict';

    // Stockage du token CSRF en mémoire
    let csrfToken = null;
    let csrfPromise = null; // Promise pour attendre le token
    let fetchPatched = false;

    /**
     * Récupère le token CSRF du serveur
     * @returns {Promise<string>} Le token CSRF
     */
    async function fetchCSRFToken() {
        if (csrfToken) {
            return csrfToken;
        }

        try {
            // Utiliser XMLHttpRequest pour éviter les boucles infinies avec fetch patchée
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', 'php/api/get-csrf-token.php', true);
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (data.token) {
                                csrfToken = data.token;
                                resolve(csrfToken);
                            } else {
                                reject(new Error('Token vide dans la réponse'));
                            }
                        } catch (e) {
                            reject(new Error('Réponse JSON invalide: ' + e.message));
                        }
                    } else {
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                };
                xhr.onerror = function() {
                    reject(new Error('Erreur réseau'));
                };
                xhr.onabort = function() {
                    reject(new Error('Requête annulée'));
                };
                xhr.timeout = 5000;
                xhr.ontimeout = function() {
                    reject(new Error('Timeout'));
                };
                xhr.send();
            });
        } catch (error) {
            console.error('[CSRF] ✗ Erreur lors de la récupération du token:', error);
            throw error;
        }
    }

    /**
     * Récupère le token CSRF actuellement en mémoire (synchrone)
     * @returns {string|null} Le token CSRF ou null si non chargé
     */
    function getCSRFToken() {
        return csrfToken;
    }

    /**
     * Définit le token CSRF manuellement
     * @param {string} token Le token à définir
     */
    function setCSRFToken(token) {
        csrfToken = token;
    }

    /**
     * Patch automatique de fetch global pour ajouter CSRF
     * Modifie le comportement de window.fetch pour toutes les requêtes POST/PUT/DELETE/PATCH
     */
    function patchFetch() {
        if (fetchPatched) return;
        fetchPatched = true;

        const originalFetch = window.fetch;

        window.fetch = async function(url, options = {}) {
            const method = (options.method || 'GET').toUpperCase();

            // Seulement pour les méthodes qui modifient (POST, PUT, DELETE, PATCH)
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                // Récupérer le token si pas en mémoire
                if (!csrfToken) {
                    try {
                        await fetchCSRFToken();
                    } catch (error) {
                        console.error('[CSRF] ✗ Impossible de récupérer le token CSRF, requête bloquée');
                        throw new Error('CSRF Protection: Token indisponible');
                    }
                }

                // Ajouter le header X-CSRF-Token
                if (!options.headers) {
                    options.headers = {};
                }
                options.headers['X-CSRF-Token'] = csrfToken;
            }

            // Assurer credentials
            if (!options.credentials) {
                options.credentials = 'same-origin';
            }

            return originalFetch.call(window, url, options);
        };
    }

    /**
     * Initialise le système CSRF
     */
    function initCSRF() {
        // Patch fetch EN PREMIER, avant de charger le token
        // Cela garantit que TOUTES les requêtes qui arrivent après seront protégées
        patchFetch();
        
        // Puis charger le token en arrière-plan
        csrfPromise = fetchCSRFToken().then(() => {
            // Token chargé avec succès
        }).catch(error => {
            console.error('[CSRF] ✗ Erreur lors du chargement du token:', error);
            // Continuer quand même, le token sera chargé à la première requête
        });
    }

    /**
     * Wrapper pour fetch avec gestion CSRF
     */
    async function csrfFetch(url, options = {}) {
        return window.fetch(url, options); // Utilise le fetch patchée
    }

    // Initialiser IMMÉDIATEMENT, avant même DOMContentLoaded
    // Cela garantit que fetch est patchée avant que d'autres scripts ne chargent
    initCSRF();

    // Ensuite charger le token dès que possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Token déjà en cours de chargement
        });
    }

    // Exporter les fonctions globalement
    window.CSRF = {
        getToken: getCSRFToken,
        setToken: setCSRFToken,
        fetchToken: fetchCSRFToken,
        fetch: csrfFetch,  // Wrapper pour fetch avec CSRF
        ready: () => csrfPromise || Promise.resolve(), // Retourne une promise
        isReady: () => !!csrfToken // Check synchrone
    };

})();
