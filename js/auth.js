// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzguzTg54A5KgOH_2-UtNMSiLzUwmWlnE",
    authDomain: "mr-drones.firebaseapp.com",
    projectId: "mr-drones",
    storageBucket: "mr-drones.appspot.com",
    messagingSenderId: "891587224313",
    appId: "1:891587224313:web:3cad5fc9bdcde4d1293828"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Verificar estado da autenticação em todas as páginas
firebase.auth().onAuthStateChanged((user) => {
    console.log('Estado de autenticação alterado:', user ? 'Logado' : 'Não logado');
    
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    const baseUrl = currentPath.includes('/pages/') ? '../' : '';
    
    if (!user && !isLoginPage) {
        // Se não estiver autenticado e não estiver na página de login, redireciona
        console.log('Redirecionando para login...');
        window.location.href = baseUrl + 'login.html';
    } else if (user && isLoginPage) {
        // Se estiver autenticado e estiver na página de login, redireciona para home
        console.log('Redirecionando para home...');
        window.location.href = baseUrl + 'home.html';
    }
});

// Função de login
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(() => {
                console.log('Login bem-sucedido');
                window.location.href = 'home.html';
            })
            .catch((error) => {
                console.error('Erro no login:', error);
                errorMessage.textContent = 'Email ou senha inválidos';
            });
    });
}

// Função de logout
function logout() {
    console.log('Iniciando logout...');
    firebase.auth().signOut()
        .then(() => {
            console.log('Logout bem-sucedido');
            const baseUrl = window.location.pathname.includes('/pages/') ? '../' : '';
            window.location.href = baseUrl + 'login.html';
        })
        .catch((error) => {
            console.error('Erro ao fazer logout:', error);
        });
}

// Expor função de logout globalmente
window.logout = logout; 