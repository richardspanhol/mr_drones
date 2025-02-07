document.addEventListener('DOMContentLoaded', function() {
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
    }
    
    // Toggle do menu
    menuToggle.addEventListener('click', function(e) {
        console.log('Botão do menu clicado');
        e.stopPropagation();
        mainNav.classList.toggle('nav-open');
        console.log('Estado do menu:', mainNav.classList.contains('nav-open') ? 'aberto' : 'fechado');
    });
    
    // Fechar menu ao clicar em um link
    mainNav.addEventListener('click', function(e) {
        console.log('Clique no menu:', e.target.tagName);
        if (e.target.tagName === 'A') {
            closeMenu();
        }
    });
    
    // Fechar menu ao clicar fora dele
    document.addEventListener('click', function(e) {
        console.log('Clique no documento');
        if (!e.target.closest('header')) {
            closeMenu();
        }
    });

    // Garantir que o menu começa fechado
    closeMenu();
    console.log('Inicialização do menu concluída');
}); 