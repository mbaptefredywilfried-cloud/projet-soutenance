document.addEventListener('DOMContentLoaded', function () {
	const signupForm = document.getElementById('signupForm');
	const fields = [
		{ id: 'nom_input', message: "Veuillez entrer un nom d'utilisateur." },
		{ id: 'email_input', message: "Veuillez entrer une adresse email valide." },
		{ id: 'password_input', message: "Veuillez entrer un mot de passe." },
		{ id: 'confirm_password_input', message: "Veuillez confirmer le mot de passe." }
	];

	// Ajout de l'état succès sur blur
	fields.forEach(f => {
		const input = document.getElementById(f.id);
		if (input) {
			input.addEventListener('blur', function () {
				input.classList.remove('input-success');
				// Validation simple : champ non vide (et pour email, format)
				let isValid = false;
				if (f.id === 'email_input') {
					isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
				} else if (f.id === 'confirm_password_input') {
					const pwd = document.getElementById('password_input').value;
					isValid = input.value && input.value === pwd;
				} else {
					isValid = input.value && input.value.trim().length > 0;
				}
				if (isValid) {
					input.classList.remove('input-error');
					input.classList.add('input-success');
					// Supprimer le message d'erreur s'il existe
					let error = input.parentNode.querySelector('.error-message');
					if (error) error.remove();
				} else {
					input.classList.remove('input-success');
				}
			});
			// Retire l'état succès si on modifie le champ
			input.addEventListener('input', function () {
				input.classList.remove('input-success');
			});
		}
	});

	if (signupForm) {
		signupForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			// Réinitialiser les erreurs visuelles
			let valid = true;
			fields.forEach(f => {
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
			fields.forEach(f => {
				const input = document.getElementById(f.id);
				if (input && (!input.value || input.value.trim() === '')) {
					valid = false;
					input.classList.add('input-error');
					if (input.parentNode.classList.contains('input-box')) {
						input.parentNode.classList.add('input-error');
					}
					// Ne plus afficher de message sous l'input
				}
			});

			// Validation mot de passe identique
			const passwordInput = document.getElementById('password_input');
			const confirmInput = document.getElementById('confirm_password_input');
			const password = passwordInput ? passwordInput.value : '';
			const confirmPassword = confirmInput ? confirmInput.value : '';
			if (password && confirmPassword && password !== confirmPassword) {
				valid = false;
				if (confirmInput) {
					confirmInput.classList.add('input-error');
					if (confirmInput.parentNode.classList.contains('input-box')) {
						confirmInput.parentNode.classList.add('input-error');
					}
				}
				// Afficher le message dans un popup
				showPopupError("Les mots de passe ne correspondent pas.");
			}
// Affiche un popup d'erreur simple
function showPopupError(message) {
	const popup = document.createElement('div');
	popup.className = 'modal-confirm-overlay';
	popup.innerHTML = `
		<div class="modal-confirm-content" style="background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%); border-left: 5px solid #ef4444;">
			<i class="fas fa-exclamation-circle" style="color:#ef4444;font-size:50px;margin-bottom:15px;"></i>
			<h2 style="color:#c53030; font-size: 20px; margin: 0 0 10px 0;">Erreur</h2>
			<p style="color: #742a2a; margin: 0 0 20px 0; font-size: 14px;">${message}</p>
			<button id="popupErrorBtn" class="btn-confirm-ok" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; color: white; font-weight: 600;">OK</button>
		</div>
	`;
	document.body.appendChild(popup);
	document.getElementById('popupErrorBtn').addEventListener('click', () => {
		popup.remove();
	});
	setTimeout(() => {
		if (popup.parentNode) popup.remove();
	}, 4000);
}

			if (!valid) {
				return;
			}

			const name = document.getElementById('nom_input').value.trim();
			const email = document.getElementById('email_input').value.trim();
			// password déjà défini
			
			// Afficher le popup de chargement
			showLoadingPopup();
			
			try {
				const res = await fetch('./php/auth/register.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name, email, password })
				});
				const data = await res.json();
				
				// Masquer le popup de chargement
				hideLoadingPopup();
				
				if (data.status === "success") {
					showAccountCreatedPopup();
				} else {
					showGlobalError(data.message || "Erreur lors de l'inscription.");
				}
			} catch (err) {
				hideLoadingPopup();
				showGlobalError("Erreur lors de l'inscription.");
			}
		// Affiche un message global d'erreur au-dessus du titre
		function showGlobalError(message) {
			let msg = document.getElementById('global-message');
			if (!msg) return;
			msg.innerHTML = `
				<div class="alert-global-error">
					<i class="fas fa-exclamation-triangle"></i>
					<span>${message}</span>
				</div>
			`;
			setTimeout(() => { msg.innerHTML = ''; }, 4000);
		}
		});
	}

	// Affiche un message d'erreur sous l'input
	function showFieldError(input, message) {
		let error = document.createElement('div');
		error.className = 'error-message';
		error.textContent = message;
		error.style.color = '#ef4444';
		error.style.fontSize = '0.85em';
		error.style.marginTop = '4px';
		error.style.fontWeight = '500';
		input.parentNode.appendChild(error);
	}
// Popup de succès
function showAccountCreatedPopup() {
	const popup = document.createElement('div');
	popup.className = 'modal-confirm-overlay';
	popup.innerHTML = `
		<div class="modal-confirm-content" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 5px solid #10b981;">
			<div style="font-size: 60px; margin-bottom: 15px;">
				<i class="fas fa-check-circle" style="color:#10b981; animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);"></i>
			</div>
			<h2 style="color:#065f46; font-size: 22px; font-weight: 600; margin: 0 0 10px 0;">Compte créé avec succès !</h2>
			<p style="color: #15803d; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
				Bienvenue sur Numera ! 🎉<br>
				Votre compte est prêt et un email de confirmation a été envoyé.
			</p>
			<button id="popupOkBtn" class="btn-confirm-ok" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; color: white; font-weight: 600;">Accéder à Numera</button>
		</div>
	`;
	document.body.appendChild(popup);
	
	// Ajouter l'animation d'entrée si elle n'existe pas
	if (!document.getElementById('successAnimation')) {
		const style = document.createElement('style');
		style.id = 'successAnimation';
		style.innerHTML = `
			@keyframes scaleIn {
				0% {
					transform: scale(0.5);
					opacity: 0;
				}
				50% {
					transform: scale(1.1);
				}
				100% {
					transform: scale(1);
					opacity: 1;
				}
			}
			
			@keyframes fadeOut {
				0% {
					opacity: 1;
				}
				100% {
					opacity: 0;
				}
			}
		`;
		document.head.appendChild(style);
	}
	
	document.getElementById('popupOkBtn').addEventListener('click', () => {
		popup.remove();
		window.location.href = 'dasboard.html';
	});
}

// Popup de chargement pendant l'inscription
function showLoadingPopup() {
	const popup = document.createElement('div');
	popup.className = 'modal-confirm-overlay';
	popup.id = 'loadingPopup';
	popup.innerHTML = `
		<div class="modal-confirm-content" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
			<div style="display: flex; justify-content: center; margin-bottom: 25px;">
				<div class="spinner-modern"></div>
			</div>
			<h2 style="color:#2d3748; font-size: 22px; font-weight: 600; margin: 0 0 10px 0;">Création de votre compte</h2>
			<p style="color: #718096; font-size: 14px; margin: 0; letter-spacing: 0.5px;">
				Vérification des informations<span class="dots-loader">...</span>
			</p>
		</div>
	`;
	document.body.appendChild(popup);
	
	// Ajouter les animations CSS si elles n'existent pas
	if (!document.getElementById('advancedLoadingStyles')) {
		const style = document.createElement('style');
		style.id = 'advancedLoadingStyles';
		style.innerHTML = `
			@keyframes spin-modern {
				0% {
					transform: rotate(0deg);
					box-shadow: 0 0 0 1px transparent, 0 0 20px rgba(45, 55, 72, 0.1);
				}
				50% {
					box-shadow: 0 0 0 8px rgba(45, 55, 72, 0.05), 0 0 20px rgba(45, 55, 72, 0.2);
				}
				100% {
					transform: rotate(360deg);
					box-shadow: 0 0 0 1px transparent, 0 0 20px rgba(45, 55, 72, 0.1);
				}
			}
			
			.spinner-modern {
				width: 60px;
				height: 60px;
				border: 3px solid rgba(45, 55, 72, 0.1);
				border-top-color: #2d3748;
				border-radius: 50%;
				animation: spin-modern 1s linear infinite;
			}
			
			@keyframes dots-blink {
				0%, 20% { content: '.'; }
				40% { content: '..'; }
				60%, 100% { content: '...'; }
			}
			
			.dots-loader::after {
				content: '.';
				animation: dots-blink 1.4s infinite;
				display: inline-block;
				width: 12px;
			}
		`;
		document.head.appendChild(style);
	}
}

function hideLoadingPopup() {
	const popup = document.getElementById('loadingPopup');
	if (popup) {
		popup.style.animation = 'fadeOut 0.3s ease-out forwards';
		setTimeout(() => {
			if (popup && popup.parentNode) popup.remove();
		}, 300);
	}
}
});
