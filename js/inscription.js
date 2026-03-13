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
					showFieldError(input, f.message);
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

			if (!valid) {
				return;
			}

			const name = document.getElementById('nom_input').value.trim();
			const email = document.getElementById('email_input').value.trim();
			// password déjà défini
			try {
				const res = await fetch('./php/auth/register.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name, email, password })
				});
				const data = await res.json();
				if (data.status === "success") {
					showAccountCreatedPopup();
				} else {
					showGlobalError(data.message || "Erreur lors de l'inscription.");
				}
			} catch (err) {
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
		<div class="modal-confirm-content">
			<i class="fas fa-check-circle" style="color:#10b981;font-size:60px;"></i>
			<h2 style="color:#10b981;">Compte créé avec succès !</h2>
			<p>Bienvenue sur Numera.<br>Votre compte a bien été créé.</p>
			<button id="popupOkBtn" class="btn-confirm-ok" style="background:#10b981;">OK</button>
		</div>
	`;
	document.body.appendChild(popup);
	document.getElementById('popupOkBtn').addEventListener('click', () => {
		popup.remove();
		window.location.href = 'dasboard.html';
	});
}
});
