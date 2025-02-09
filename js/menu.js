document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando script do menu');
    
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    // Verificar se estamos na home ou em uma subpágina
    const isHome = window.location.pathname.endsWith('home.html') || 
                  window.location.pathname.endsWith('index.html') ||
                  window.location.pathname.endsWith('mr_drones/');
    
    // Ajustar os caminhos baseado na localização
    const prefix = isHome ? 'pages/' : '';
    const homePrefix = isHome ? '' : '../';

    console.log('Elementos encontrados:', {
        menuToggle: !!menuToggle,
        mainNav: !!mainNav
    });
    
    if (!menuToggle || !mainNav) {
        console.error('Elementos do menu não encontrados');
        return;
    }
    
    // Função para fechar o menu
    function closeMenu() {
        console.log('Fechando menu');
        mainNav.classList.remove('nav-open');
        mainNav.classList.add('nav-closed');
    }
    
    // Toggle do menu
    menuToggle.addEventListener('click', () => {
        console.log('Botão do menu clicado');
        mainNav.classList.toggle('nav-open');
        mainNav.classList.toggle('nav-closed');
        console.log('Estado do menu:', mainNav.classList.contains('nav-open') ? 'aberto' : 'fechado');
    });
    
    // Fechar menu ao clicar em um link
    const menuLinks = mainNav.getElementsByTagName('a');
    for (let link of menuLinks) {
        link.addEventListener('click', () => {
            console.log('Clique no menu:', link.tagName);
            closeMenu();
        });
    }
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        console.log('Clique no documento');
        if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });

    // Garantir que o menu começa fechado
    closeMenu();
    console.log('Inicialização do menu concluída');

    // Preencher o menu com os caminhos corretos
    mainNav.innerHTML = `
        <a href="${homePrefix}home.html"><i class="fas fa-home"></i> Início</a>
        <a href="${prefix}clientes.html"><i class="fas fa-users"></i> Clientes</a>
        <a href="${prefix}servicos.html"><i class="fas fa-helicopter"></i> Serviços</a>
        <a href="${prefix}relatorios.html"><i class="fas fa-chart-bar"></i> Relatórios</a>
        <a href="${prefix}financeiro.html"><i class="fas fa-wallet"></i> Financeiro</a>
        <a href="${prefix}calculadora.html"><i class="fas fa-calculator"></i> Calculadora</a>
    `;
}); 