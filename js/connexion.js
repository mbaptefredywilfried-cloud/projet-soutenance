document.addEventListener('DOMContentLoaded', function () {
	const loginForm = document.getElementById('loginForm');
	const fields = [
		{ id: 'loginEmail', message: "Veuillez entrer une adresse email valide." },
		{ id: 'loginPass', message: "Veuillez entrer votre mot de passe." }
	];

	// Validation à la volée (blur/input)
	fields.forEach(f => {
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

			if (!valid) {
				return;
			}

			const email = document.getElementById('loginEmail').value.trim();
			const password = document.getElementById('loginPass').value;
			// Récupérer la langue du navigateur
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
				// Popup de succès après connexion
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
						popup.remove();
						if (callback) callback();
					}, 2500);
				}
			} catch (err) {
				showPopupError("Erreur lors de la connexion.");
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

	// Popup d'erreur
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
});
