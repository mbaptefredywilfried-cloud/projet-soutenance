// Vérifie si l'utilisateur vient de s'inscrire et affiche le popup
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === '1') {
        showSuccessPopup();
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

function showSuccessPopup() {
    const blurBg = document.createElement('div');
    blurBg.className = 'blur-background';
    blurBg.innerHTML = `
        <div class="success-popup">
            <div class="success-header"></div>
            <div class="success-content">
                <div class="success-icon">
                    <i class="fas fa-check"></i>
                </div>
                <h2>Succès !</h2>
                <p>Votre compte a été créé avec succès.<br>Bienvenue chez Numera!</p>
                <button class="success-btn" onclick="redirectToDashboard()">Commencer</button>
            </div>
        </div>
    `;
    
    // Ajouter les styles
    const style = document.createElement('style');
    style.textContent = `
        .blur-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            animation: fadeIn 0.3s ease-in-out;
        }
        
        .success-popup {
            background: white;
            border-radius: 20px;
            padding: 0;
            width: 90%;
            max-width: 450px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .success-header {
            height: 8px;
            background: linear-gradient(90deg, #10b981, #34d399);
        }
        
        .success-content {
            padding: 50px 35px;
            text-align: center;
        }
        
        .success-icon {
            width: 90px;
            height: 90px;
            background: linear-gradient(135deg, #d1fae5, #ecfdf5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
        }
        
        .success-icon i {
            font-size: 50px;
            color: #10b981;
        }
        
        .success-content h2 {
            margin: 0 0 12px;
            color: #1e293b;
            font-size: 28px;
            font-weight: 700;
        }
        
        .success-content p {
            margin: 0 0 35px;
            color: #64748b;
            line-height: 1.7;
            font-size: 16px;
        }
        
        .success-btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
            box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
            font-size: 16px;
        }
        
        .success-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 25px rgba(16, 185, 129, 0.35);
        }
        
        .success-btn:active {
            transform: translateY(-1px);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(30px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(blurBg);
}

function redirectToDashboard() {
    window.location.href = "./dasboard.html";
}
