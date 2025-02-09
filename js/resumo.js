document.addEventListener('DOMContentLoaded', () => {
    // Função para formatar valores monetários
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }

    // Atualizar a função que exibe os valores
    window.carregarResumoFinanceiro = async function() {
        try {
            // Carregar saldo
            const saldoDoc = await db.collection('financeiro').doc('saldo').get();
            const saldo = saldoDoc.exists ? saldoDoc.data().valor : 0;
            document.getElementById('saldo-caixa').textContent = `R$ ${formatarMoeda(saldo)}`;

            // Carregar movimentações do período
            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            
            // Calcular entradas
            const entradasSnapshot = await db.collection('movimentacoes')
                .where('tipo', '==', 'entrada')
                .where('data', '>=', inicioMes.toISOString().split('T')[0])
                .get();
                
            let totalEntradas = 0;
            let numServicos = 0;
            
            entradasSnapshot.forEach(doc => {
                const mov = doc.data();
                totalEntradas += parseFloat(mov.valor) || 0;
                if (mov.categoria === 'servico') numServicos++;
            });
            
            document.getElementById('total-entradas').textContent = `R$ ${formatarMoeda(totalEntradas)}`;
            document.getElementById('num-servicos').textContent = `Serviços Realizados: ${numServicos}`;

            // Calcular saídas
            const saidasSnapshot = await db.collection('movimentacoes')
                .where('tipo', '==', 'saida')
                .where('data', '>=', inicioMes.toISOString().split('T')[0])
                .get();
                
            let totalSaidas = 0;
            let numDespesas = 0;
            
            saidasSnapshot.forEach(doc => {
                const mov = doc.data();
                totalSaidas += parseFloat(mov.valor) || 0;
                numDespesas++;
            });
            
            document.getElementById('total-saidas').textContent = `R$ ${formatarMoeda(totalSaidas)}`;
            document.getElementById('num-despesas').textContent = `Despesas: ${numDespesas}`;

        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
            alert('Erro ao carregar resumo financeiro: ' + error.message);
        }
    };

    // Carregar dados iniciais
    carregarResumoFinanceiro();
}); 