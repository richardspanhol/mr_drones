// No início do arquivo
console.log('Inicializando Firebase...');

// Primeiro importar os módulos necessários
if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyBzguzTg54A5KgOH_2-UtNMSiLzUwmWlnE",
        authDomain: "mr-drones.firebaseapp.com",
        projectId: "mr-drones",
        storageBucket: "mr-drones.appspot.com",
        messagingSenderId: "891587224313",
        appId: "1:891587224313:web:3cad5fc9bdcde4d1293828"
    });
}

// Aguardar carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth.js carregado');
    
    // Verificar estado da autenticação
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Estado de autenticação:', user ? 'Logado' : 'Não logado');
        
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');
        
        if (!user && !isLoginPage) {
            window.location.href = 'login.html';
        } else if (user && isLoginPage) {
            window.location.href = 'home.html';
        }
    });

    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');
            const submitButton = loginForm.querySelector('button[type="submit"]');
            
            try {
                // Desabilitar botão e mostrar loading
                submitButton.disabled = true;
                const loadingToast = showToast('Conectando...', 'loading');
                
                await firebase.auth().signInWithEmailAndPassword(email, password);
                
                // Remover toast de loading e mostrar sucesso
                loadingToast.remove();
                showToast('Login realizado com sucesso!', 'success');
                
                // Redirecionar após um pequeno delay
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1000);
                
            } catch (error) {
                console.error('Erro no login:', error);
                errorMessage.textContent = 'Email ou senha inválidos';
                submitButton.disabled = false;
                
                // Remover loading e mostrar erro
                document.querySelector('.toast')?.remove();
            }
        });
    }
});

// Função de logout
window.logout = async () => {
    // Mostrar confirmação antes de sair
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        try {
            // Mostrar toast de loading
            const loadingToast = showToast('Finalizando sessão...', 'loading');
            
            await firebase.auth().signOut();
            
            // Remover toast de loading e mostrar sucesso
            loadingToast.remove();
            showToast('Sessão finalizada com sucesso!', 'success');
            
            // Redirecionar após um pequeno delay
            setTimeout(() => {
                // Verificar se estamos em uma subpasta
                const currentPath = window.location.pathname;
                const loginPath = currentPath.includes('/pages/') ? '../login.html' : 'login.html';
                window.location.href = loginPath;
            }, 1000);
            
        } catch (error) {
            console.error('Erro no logout:', error);
            // Remover loading e mostrar erro
            document.querySelector('.toast')?.remove();
            showToast('Erro ao finalizar sessão', 'error');
        }
    }
};

// Exportar instância do Firestore
window.db = firebase.firestore();

// Após inicializar o Firebase
console.log('Firebase inicializado com sucesso');

// Adicionar função para mostrar toast
function showToast(message, type = 'default') {
    // Criar container se não existir
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Criar toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Conteúdo baseado no tipo
    if (type === 'loading') {
        toast.innerHTML = `
            <div class="spinner"></div>
            <span>${message}</span>
        `;
    } else if (type === 'success') {
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
    } else if (type === 'error') {
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        toast.style.background = '#f44336'; // Vermelho para erro
        toast.style.color = 'white';
    }

    // Adicionar ao container
    container.appendChild(toast);

    // Remover após delay (exceto se for loading)
    if (type !== 'loading') {
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                container.removeChild(toast);
                if (container.children.length === 0) {
                    document.body.removeChild(container);
                }
            }, 300);
        }, 2000);
    }

    return toast; // Retornar para poder remover depois
} 