// Criar namespace para nossas funções utilitárias
window.MRDrones = window.MRDrones || {};

// Função para expandir/colapsar
window.MRDrones.toggleExpansivel = function(header) {
    if (!header) {
        console.error('Header element não encontrado');
        return;
    }
    
    const content = header.nextElementSibling;
    const icon = header.querySelector('i.fas');
    
    if (!content || !icon) {
        console.error('Elementos necessários não encontrados', { content, icon });
        return;
    }
    
    const isHidden = content.style.display === 'none' || !content.style.display;
    content.style.display = isHidden ? 'block' : 'none';
    icon.classList.toggle('fa-chevron-down', !isHidden);
    icon.classList.toggle('fa-chevron-up', isHidden);
};

// Outras funções utilitárias
window.MRDrones.formatarData = function(data) {
    if (!data) return 'Não definida';
    try {
        if (data.toDate) { // Timestamp do Firestore
            data = data.toDate();
        } else if (typeof data === 'string') {
            data = new Date(data);
        }
        return data.toLocaleDateString('pt-BR');
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Data inválida';
    }
};

window.MRDrones.formatarMoeda = function(valor) {
    if (!valor) return '0,00';
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    } catch (error) {
        console.error('Erro ao formatar moeda:', error);
        return '0,00';
    }
};

// Criar aliases para compatibilidade
window.toggleExpansivel = window.MRDrones.toggleExpansivel;
window.formatarData = window.MRDrones.formatarData;
window.formatarMoeda = window.MRDrones.formatarMoeda;

// Verificar se as funções foram carregadas corretamente
console.log('Utils carregado:', {
    toggleExpansivel: !!window.toggleExpansivel,
    formatarData: !!window.formatarData,
    formatarMoeda: !!window.formatarMoeda
}); 