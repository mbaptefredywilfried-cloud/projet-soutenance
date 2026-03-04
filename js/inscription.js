document.addEventListener('DOMContentLoaded', function () {
	const signupForm = document.getElementById('signupForm');
	if (signupForm) {
		signupForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			const name = document.getElementById('nom_input').value.trim();
			const email = document.getElementById('email_input').value.trim();
			const password = document.getElementById('password_input').value;
			const confirmPassword = document.getElementById('confirm_password_input').value;
			if (password !== confirmPassword) {
				alert("Les mots de passe ne correspondent pas.");
				return;
			}
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
