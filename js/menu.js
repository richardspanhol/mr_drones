document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando script do menu');
    
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
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
}); 