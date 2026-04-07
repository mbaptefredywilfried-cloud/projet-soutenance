document.addEventListener('DOMContentLoaded', function () {
	// ====== ATTENDRE QUE LE TOKEN CSRF SOIT CHARGÉ ======
	async function fetchWithCSRF(url, options = {}) {
		// Attendre que window.CSRF soit disponible
		let attempts = 0;
		while (!window.CSRF && attempts < 20) {
			await new Promise(r => setTimeout(r, 50));
			attempts++;
		}
		
		if (!window.CSRF) {
			console.error('CSRF manager non disponible après timeout');
			throw new Error('Système de sécurité CSRF non disponible');
		}

		// Utiliser le method CSRF.fetch() qui gère automatiquement le token
		return window.CSRF.fetch(url, options);
	}

	// ====== VARIABLES GLOBALES ======
	let currentEmail = '';
	let currentResetToken = '';

	// ====== FONCTION POUR AFFICHER/CACHER LES FORMULAIRES ======
	function showForm(formId) {
		const forms = document.querySelectorAll('#loginForm, #forgotForm, #otpForm, #resetForm');
		forms.forEach(form => {
			form.style.display = 'none';
			form.style.opacity = '0';
		});
		
		const targetForm = document.getElementById(formId);
		if (targetForm) {
			targetForm.style.display = 'flex';
			setTimeout(() => {
				targetForm.style.opacity = '1';
			}, 10);
		}

		// Sauvegarder l'état du formulaire dans sessionStorage
		sessionStorage.setItem('currentFormId', formId);
		if (currentEmail) {
			sessionStorage.setItem('currentEmail', currentEmail);
		}
	}

	// ====== RESTAURER L'ÉTAT DU FORMULAIRE APRÈS RECHARGEMENT ======
	function restoreFormState() {
		const savedFormId = sessionStorage.getItem('currentFormId');
		const savedEmail = sessionStorage.getItem('currentEmail');

		// Seulement restaurer otpForm et resetForm (pas les formulaires de connexion)
		if (savedFormId === 'otpForm' && savedEmail) {
			currentEmail = savedEmail;
			const otpEmailEl = document.getElementById('otpEmail');
			if (otpEmailEl) {
				otpEmailEl.textContent = currentEmail;
				showForm('otpForm');
				// Continuer le timer - ne pas réinitialiser (resetTimer = false)
				startOtpTimer(false);
			}
		} else if (savedFormId === 'resetForm' && savedEmail) {
			currentEmail = savedEmail;
			showForm('resetForm');
		} else {
			// Par défaut, afficher le formulaire de connexion
			showForm('loginForm');
			sessionStorage.removeItem('currentFormId');
			sessionStorage.removeItem('currentEmail');
			sessionStorage.removeItem('otpTimerStart');
		}
	}

	// ====== STYLE DE TRANSITION POUR LES FORMULAIRES ======
	const style = document.createElement('style');
	style.textContent = `
		#loginForm, #forgotForm, #otpForm, #resetForm {
			transition: opacity 0.3s ease;
		}
	`;
	document.head.appendChild(style);

	// ====== POPUP DE SUCCÈS ======
	function showSuccessPopup(callback) {
		const popup = document.createElement('div');
		popup.className = 'modal-confirm-overlay';
		popup.innerHTML = `
			<div class="modal-confirm-content">
				<i class="fas fa-check-circle" style="color:#10b981;font-size:60px;"></i>
				<h2 style="color:#10b981;">Connexion réussie !</h2>
				<p>Bienvenue sur Numera.<br>Vous allez être redirigé vers votre dashboard.</p>
				<button id="popupOkBtn" class="btn-confirm-ok" style="background:#10b981;">OK</button>
			</div>
		`;
		document.body.appendChild(popup);
		document.getElementById('popupOkBtn').addEventListener('click', () => {
			popup.remove();
			if (callback) callback();
		});
		setTimeout(() => {
			if (popup.parentNode) {
				popup.remove();
				if (callback) callback();
			}
		}, 2500);
	}

	// ====== POPUP DE SUCCÈS POUR RÉINITIALISATION ======
	function showResetSuccessPopup(callback) {
		const popup = document.createElement('div');
		popup.className = 'modal-confirm-overlay';
		popup.innerHTML = `
			<div class="modal-confirm-content">
				<i class="fas fa-check-circle" style="color:#10b981;font-size:60px;"></i>
				<h2 style="color:#10b981;">Succès !</h2>
				<p>Votre mot de passe a été réinitialisé avec succès.</p>
				<button id="popupOkBtn" class="btn-confirm-ok" style="background:#10b981;">OK</button>
			</div>
		`;
		document.body.appendChild(popup);
		document.getElementById('popupOkBtn').addEventListener('click', () => {
			popup.remove();
			if (callback) callback();
		});
		setTimeout(() => {
			if (popup.parentNode) {
				popup.remove();
				if (callback) callback();
			}
		}, 2500);
	}

	// ====== POPUP D'ERREUR ======
	function showPopupError(message) {
		const popup = document.createElement('div');
		popup.className = 'modal-confirm-overlay';
		popup.innerHTML = `
			<div class="modal-confirm-content">
				<i class="fas fa-times-circle" style="color:#ef4444;font-size:60px;"></i>
				<h2 style="color:#ef4444;">Erreur</h2>
				<p>${message}</p>
				<button id="popupErrorBtn" class="btn-confirm-ok" style="background:#ef4444;">OK</button>
			</div>
		`;
		document.body.appendChild(popup);
		document.getElementById('popupErrorBtn').addEventListener('click', () => {
			popup.remove();
		});
		setTimeout(() => {
			if (popup.parentNode) popup.remove();
		}, 3500);
	}

	// ====== FONCTION POUR GÉRER L'ÉTAT DE CHARGEMENT DU BOUTON ======
	function setButtonLoading(button, isLoading) {
		if (isLoading) {
			button.disabled = true;
			button.dataset.originalText = button.textContent;
			button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Veuillez patienter...';
		} else {
			button.disabled = false;
			button.textContent = button.dataset.originalText || 'Envoyer';
		}
	}

	// ====== FORMULAIRE DE CONNEXION ======
	const loginForm = document.getElementById('loginForm');
	const loginFields = [
		{ id: 'loginEmail', message: "Veuillez entrer une adresse email valide." },
		{ id: 'loginPass', message: "Veuillez entrer votre mot de passe." }
	];

	// Validation à la volée (blur/input)
	loginFields.forEach(f => {
		const input = document.getElementById(f.id);
		if (input) {
			input.addEventListener('blur', function () {
				input.classList.remove('input-success');
				let isValid = false;
				if (f.id === 'loginEmail') {
					isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
				} else {
					isValid = input.value && input.value.trim().length > 0;
				}
				if (isValid) {
					input.classList.remove('input-error');
					input.classList.add('input-success');
					let error = input.parentNode.querySelector('.error-message');
					if (error) error.remove();
				} else {
					input.classList.remove('input-success');
				}
			});
			input.addEventListener('input', function () {
				input.classList.remove('input-success');
			});
		}
	});

	if (loginForm) {
		loginForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			// Réinitialiser les erreurs visuelles
			let valid = true;
			loginFields.forEach(f => {
				const input = document.getElementById(f.id);
				if (input) {
					input.classList.remove('input-error');
					input.classList.remove('input-success');
					if (input.parentNode.classList.contains('input-box')) {
						input.parentNode.classList.remove('input-error');
					}
					let error = input.parentNode.querySelector('.error-message');
					if (error) error.remove();
				}
			});

			// Validation des champs vides
			loginFields.forEach(f => {
				const input = document.getElementById(f.id);
				if (input && (!input.value || input.value.trim() === '')) {
					valid = false;
					input.classList.add('input-error');
					if (input.parentNode.classList.contains('input-box')) {
						input.parentNode.classList.add('input-error');
					}
				}
			});

			if (!valid) {
				return;
			}

			const email = document.getElementById('loginEmail').value.trim();
			const password = document.getElementById('loginPass').value;
			const browserLanguage = navigator.language || navigator.userLanguage || 'fr';
			const languageCode = browserLanguage.startsWith('en') ? 'en' : 'fr';
			
			try {
				const res = await fetchWithCSRF('./php/auth/login.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password, language: languageCode })
				});
				const data = await res.json();
				if (data.status === "success") {
					showSuccessPopup(() => {
						window.location.href = 'dasboard.html';
					});
				} else {
					showPopupError(data.message || "Échec de la connexion.");
				}
			} catch (err) {
				console.error('Erreur login:', err);
				showPopupError("Erreur lors de la connexion.");
			}
		});
	}

	// ====== FORMULAIRE MOT DE PASSE OUBLIÉ ======
	const forgotForm = document.getElementById('forgotForm');
	const forgotEmailInput = document.getElementById('forgotEmail');

	if (forgotEmailInput) {
		forgotEmailInput.addEventListener('blur', function () {
			const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim());
			if (isValid) {
				this.classList.remove('input-error');
				this.classList.add('input-success');
			} else {
				this.classList.remove('input-success');
			}
		});
		forgotEmailInput.addEventListener('input', function () {
			this.classList.remove('input-success');
		});
	}

	if (forgotForm) {
		forgotForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			
			const email = forgotEmailInput.value.trim();
			const submitBtn = forgotForm.querySelector('button[type="submit"]');

			// Validation
			if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				forgotEmailInput.classList.add('input-error');
				return;
			}

			forgotEmailInput.classList.remove('input-error');
			setButtonLoading(submitBtn, true);

			try {
				const res = await fetchWithCSRF('./php/auth/forgot_password.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});
				const data = await res.json();
				
				if (data.status === 'success') {
					currentEmail = email;
					forgotEmailInput.value = '';
					forgotEmailInput.classList.remove('input-success');
					setButtonLoading(submitBtn, false);
					// Initialiser le timestamp du timer pour un nouveau cycle de 15 minutes
						sessionStorage.setItem('otpTimerStart', Date.now().toString());
					showForm('otpForm');
					document.getElementById('otpEmail').textContent = email;
					startOtpTimer(true); // Démarrer à 15 minutes
				} else {
					setButtonLoading(submitBtn, false);
					showPopupError(data.message || 'Erreur lors de l\'envoi du code');
				}
			} catch (err) {
				setButtonLoading(submitBtn, false);
				showPopupError('Erreur lors de l\'envoi du code');
			}
		});
	}

	// ====== LIEN "MOT DE PASSE OUBLIÉ" ======
	const forgotPasswordLink = document.getElementById('forgotPasswordLink');
	if (forgotPasswordLink) {
		forgotPasswordLink.addEventListener('click', function (e) {
			e.preventDefault();
			showForm('forgotForm');
		});
	}

	// ====== LIENS DE RETOUR ======
	document.querySelectorAll('.link-return').forEach(link => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			currentEmail = '';
			currentResetToken = '';
			const forgotEmailEl = document.getElementById('forgotEmail');
			const otpCodeEl = document.getElementById('otpCode');
			const resetPasswordEl = document.getElementById('resetPassword');
			const resetPasswordConfirmEl = document.getElementById('resetPasswordConfirm');
			if (forgotEmailEl) forgotEmailEl.value = '';
			if (otpCodeEl) otpCodeEl.value = '';
			if (resetPasswordEl) resetPasswordEl.value = '';
			if (resetPasswordConfirmEl) resetPasswordConfirmEl.value = '';
			sessionStorage.removeItem('currentFormId');
			sessionStorage.removeItem('currentEmail');
			showForm('loginForm');
		});
	});

	// ====== FORMULAIRE VÉRIFICATION OTP ======
	const otpForm = document.getElementById('otpForm');
	const otpCodeInput = document.getElementById('otpCode');
	let otpTimerInterval = null;

	function startOtpTimer(resetTimer = true) {
		// Arrêter le timer précédent s'il existe
		if (otpTimerInterval) clearInterval(otpTimerInterval);

		const timerDisplay = document.getElementById('otpTimer');
		let timeRemaining;
		
		if (resetTimer) {
			// Nouveau OTP envoyé - réinitialiser à 15 minutes
			timeRemaining = 15 * 60;
			sessionStorage.setItem('otpTimerStart', Date.now().toString());
		} else {
			// Rechargement de page - récupérer le temps restant
			const timerStartTimestamp = sessionStorage.getItem('otpTimerStart');
			if (timerStartTimestamp) {
				const elapsedMs = Date.now() - parseInt(timerStartTimestamp);
				const elapsedSeconds = Math.floor(elapsedMs / 1000);
				timeRemaining = Math.max(0, 15 * 60 - elapsedSeconds);
			} else {
				timeRemaining = 15 * 60;
				sessionStorage.setItem('otpTimerStart', Date.now().toString());
			}
		}

		function updateTimer() {
			const minutes = Math.floor(timeRemaining / 60);
			const seconds = timeRemaining % 60;
			timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

			if (timeRemaining <= 0) {
				clearInterval(otpTimerInterval);
				timerDisplay.textContent = 'Expiré';
				timerDisplay.style.color = '#ef4444'; // Rouge
				otpCodeInput.disabled = true;
				const submitBtn = otpForm.querySelector('button[type="submit"]');
				submitBtn.disabled = true;
				submitBtn.style.opacity = '0.5';
				sessionStorage.removeItem('otpTimerStart');
				return;
			}

			timeRemaining--;
		}

		updateTimer(); // Afficher immédiatement
		otpTimerInterval = setInterval(updateTimer, 1000);
	}

	if (otpCodeInput) {
		otpCodeInput.addEventListener('input', function () {
			this.value = this.value.replace(/\D/g, '').slice(0, 6);
		});
	}

	if (otpForm) {
		otpForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			
			const otp = otpCodeInput.value.trim();
			const submitBtn = otpForm.querySelector('button[type="submit"]');

			if (!otp || otp.length !== 6) {
				otpCodeInput.classList.add('input-error');
				return;
			}

			otpCodeInput.classList.remove('input-error');
			setButtonLoading(submitBtn, true);

			try {
				const res = await fetchWithCSRF('./php/auth/verify_otp.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: currentEmail, otp })
				});
				const data = await res.json();
				
				if (data.status === 'success') {
					currentResetToken = data.reset_token;
					otpCodeInput.value = '';
					otpCodeInput.classList.remove('input-error');
					setButtonLoading(submitBtn, false);
					if (otpTimerInterval) clearInterval(otpTimerInterval);
					showForm('resetForm');
				} else {
					setButtonLoading(submitBtn, false);
					otpCodeInput.classList.add('input-error');
					showPopupError(data.message || 'Code invalide ou expiré');
				}
			} catch (err) {
				setButtonLoading(submitBtn, false);
				showPopupError('Erreur lors de la vérification du code');
			}
		});
	}

	// ====== LIEN RENVOYER OTP ======
	const resendOtpLink = document.getElementById('resendOtpLink');
	if (resendOtpLink) {
		resendOtpLink.addEventListener('click', async function (e) {
			e.preventDefault();
			
			const submitBtn = otpForm.querySelector('button[type="submit"]');
			setButtonLoading(submitBtn, true);

			try {
				const res = await fetchWithCSRF('./php/auth/forgot_password.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: currentEmail })
				});
				const data = await res.json();
				
				if (data.status === 'success') {
					otpCodeInput.value = '';
					setButtonLoading(submitBtn, false);
				startOtpTimer(true); // Redémarrer à 15 minutes (nouveau OTP envoyé)
					showPopupError('Un nouveau code a été envoyé à votre email');
				} else {
					setButtonLoading(submitBtn, false);
					showPopupError('Erreur lors de l\'envoi du nouveau code');
				}
			} catch (err) {
				setButtonLoading(submitBtn, false);
				showPopupError('Erreur lors de l\'envoi du code');
			}
		});
	}

	// ====== FORMULAIRE RÉINITIALISATION MOT DE PASSE ======
	const resetForm = document.getElementById('resetForm');
	const resetPasswordInput = document.getElementById('resetPassword');
	const resetPasswordConfirmInput = document.getElementById('resetPasswordConfirm');

	// Toggle show/hide password
	document.querySelectorAll('.toggle-password').forEach(btn => {
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			const targetId = this.dataset.target;
			const input = document.getElementById(targetId);
			const icon = this.querySelector('i');
			
			if (input.type === 'password') {
				input.type = 'text';
				icon.classList.remove('fa-eye');
				icon.classList.add('fa-eye-slash');
			} else {
				input.type = 'password';
				icon.classList.remove('fa-eye-slash');
				icon.classList.add('fa-eye');
			}
		});
	});

	if (resetForm) {
		resetForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			
			const password = resetPasswordInput.value;
			const passwordConfirm = resetPasswordConfirmInput.value;
			const submitBtn = resetForm.querySelector('button[type="submit"]');

			// Validation
			if (!password || password.length < 8) {
				resetPasswordInput.classList.add('input-error');
				showPopupError('Le mot de passe doit contenir au moins 8 caractères');
				return;
			}

			if (password !== passwordConfirm) {
				resetPasswordConfirmInput.classList.add('input-error');
				showPopupError('Les mots de passe ne correspondent pas');
				return;
			}

			resetPasswordInput.classList.remove('input-error');
			resetPasswordConfirmInput.classList.remove('input-error');
			setButtonLoading(submitBtn, true);

			try {
				const res = await fetchWithCSRF('./php/auth/reset_password.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ reset_token: currentResetToken, new_password: password })
				});
				const data = await res.json();
				
				if (data.status === 'success') {
					resetPasswordInput.value = '';
					resetPasswordConfirmInput.value = '';
					const savedEmail = currentEmail;
					const savedPassword = password;
					currentEmail = '';
					currentResetToken = '';
					setButtonLoading(submitBtn, false);
					
					// Afficher le popup de succès avec le bon message
					showResetSuccessPopup(() => {
						// Connexion automatique après le reset
						loginAutomatically(savedEmail, savedPassword);
					});
				} else {
					setButtonLoading(submitBtn, false);
					showPopupError(data.message || 'Erreur lors de la réinitialisation');
				}
			} catch (err) {
				setButtonLoading(submitBtn, false);
				showPopupError('Erreur lors de la réinitialisation du mot de passe');
			}
		});
	}

	// ====== FONCTION POUR CONNEXION AUTOMATIQUE ======
	function loginAutomatically(email, password) {
		const browserLanguage = navigator.language || navigator.userLanguage || 'fr';
		const languageCode = browserLanguage.startsWith('en') ? 'en' : 'fr';
		
		fetch('./php/auth/login.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ email, password, language: languageCode })
		})
		.then(res => res.json())
		.then(data => {
			if (data.status === 'success') {
				// Redirection vers le dashboard
				window.location.href = 'dasboard.html';
			} else {
				// Si l'auto-login échoue, retour au formulaire de connexion
				showForm('loginForm');
				showPopupError('Veuillez vous connecter avec votre nouveau mot de passe');
			}
		})
		.catch(err => {
			showForm('loginForm');
			showPopupError('Erreur de connexion automatique');
		});
	}

	// Réinitialiser les styles d'input au focus
	[...loginFields.map(f => f.id), 'forgotEmail', 'otpCode', 'resetPassword', 'resetPasswordConfirm'].forEach(id => {
		const input = document.getElementById(id);
		if (input) {
			input.addEventListener('focus', function () {
				this.classList.remove('input-error');
			});
		}
	});

	// Restaurer l'état au chargement de la page - DOIT être appelé APRÈS toutes les définitions
	restoreFormState();

	// Nettoyer sessionStorage quand on quitte connexion.html (sauf otpForm qui est une session en cours)
	window.addEventListener('beforeunload', () => {
		const currentForm = sessionStorage.getItem('currentFormId');
		if (currentForm !== 'otpForm') {
			sessionStorage.removeItem('currentFormId');
			sessionStorage.removeItem('currentEmail');
		}
	});
});

