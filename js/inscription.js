document.addEventListener('DOMContentLoaded', function () {
	const signupForm = document.getElementById('signupForm');
	if (signupForm) {
		signupForm.addEventListener('submit', async function (e) {
			console.log('[SUBMIT] Formulaire soumis');
			e.preventDefault();
			// Réinitialiser les erreurs visuelles
			const fields = [
				{ id: 'nom_input', message: "Veuillez entrer un nom d'utilisateur." },
				{ id: 'email_input', message: "Veuillez entrer une adresse email." },
				{ id: 'password_input', message: "Veuillez entrer un mot de passe." },
				{ id: 'confirm_password_input', message: "Veuillez confirmer le mot de passe." }
			];
			let valid = true;
			fields.forEach(f => {
				const input = document.getElementById(f.id);
				if (input) {
					input.classList.remove('input-error');
					let error = input.parentNode.querySelector('.error-message');
					if (error) error.remove();
					console.log('[RESET]', f.id, 'input-error retiré');
				} else {
					console.warn('[RESET] input non trouvé:', f.id);
				}
			});

			// Validation des champs vides
			fields.forEach(f => {
				const input = document.getElementById(f.id);
				if (input && (!input.value || input.value.trim() === '')) {
					valid = false;
					input.classList.add('input-error');
					showFieldError(input, f.message);
					console.log('[VALIDATION] Champ vide:', f.id, '-> input-error ajouté');
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
					showFieldError(confirmInput, "Les mots de passe ne correspondent pas.");
					console.log('[VALIDATION] MDP différents -> input-error ajouté sur confirm_password_input');
				}
			}

			if (!valid) {
				console.warn('[VALIDATION] Formulaire non valide, soumission bloquée');
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
					// Afficher un popup de succès
					showAccountCreatedPopup(() => {
						window.location.href = 'dasboard.html';
					});
				} else {
					alert(data.message || "Erreur lors de l'inscription.");
				}
			} catch (err) {
				alert("Erreur lors de l'inscription.");
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
function showAccountCreatedPopup(callback) {
	const popup = document.createElement('div');
	popup.className = 'modal-confirm-overlay';
	popup.innerHTML = `
		<div class="modal-confirm-content">
			<i class="fas fa-check-circle"></i>
			<h2>Compte créé avec succès !</h2>
			<p>Bienvenue sur Numera.<br>Vous allez être redirigé vers votre dashboard.</p>
			<button id="popupOkBtn" class="btn-confirm-ok">OK</button>
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
	}, 3500);
}
});
