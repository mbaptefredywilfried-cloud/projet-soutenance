document.addEventListener('DOMContentLoaded', function () {
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
				const res = await fetch('./php/auth/login.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
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
				const res = await fetch('./php/auth/forgot_password.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
					body: JSON.stringify({ email })
				});
				const data = await res.json();
				
				if (data.status === 'success') {
					currentEmail = email;
					forgotEmailInput.value = '';
					forgotEmailInput.classList.remove('input-success');
					setButtonLoading(submitBtn, false);
					showForm('otpForm');
					document.getElementById('otpEmail').textContent = email;
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
			document.getElementById('forgotEmail').value = '';
			document.getElementById('otpCode').value = '';
			document.getElementById('resetPassword').value = '';
			document.getElementById('resetPasswordConfirm').value = '';
			showForm('loginForm');
		});
	});

	// ====== FORMULAIRE VÉRIFICATION OTP ======
	const otpForm = document.getElementById('otpForm');
	const otpCodeInput = document.getElementById('otpCode');

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
				const res = await fetch('./php/auth/verify_otp.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
					body: JSON.stringify({ email: currentEmail, otp })
				});
				const data = await res.json();
				
				if (data.status === 'success') {
					currentResetToken = data.reset_token;
					otpCodeInput.value = '';
					otpCodeInput.classList.remove('input-error');
					setButtonLoading(submitBtn, false);
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
				const res = await fetch('./php/auth/forgot_password.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
					body: JSON.stringify({ email: currentEmail })
				});
				const data = await res.json();
				
				if (data.status === 'success') {
					otpCodeInput.value = '';
					setButtonLoading(submitBtn, false);
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
				const res = await fetch('./php/auth/reset_password.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
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
});

