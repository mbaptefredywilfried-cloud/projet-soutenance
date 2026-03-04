document.addEventListener('DOMContentLoaded', function () {
	const loginForm = document.getElementById('loginForm');
	if (loginForm) {
		loginForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			const email = document.getElementById('loginEmail').value.trim();
			const password = document.getElementById('loginPass').value;
			try {
				const res = await fetch('./php/auth/login.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
					body: JSON.stringify({ email, password })
				});
				const data = await res.json();
				console.log('Réponse serveur login:', data);
				if (data.status === "success") {
					window.location.href = 'dasboard.html';
				} else {
					alert(data.message || "Échec de la connexion.");
				}
			} catch (err) {
				alert("Erreur lors de la connexion.");
			}
		});
	}
});
