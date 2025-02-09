document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se o Firebase está inicializado
    if (!window.db) {
        console.error('Firebase não inicializado');
        return;
    }

    // Função para formatar valores monetários
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }

    async function carregarResumoFinanceiro() {
        try {
            const periodo = document.getElementById('periodo').value;
            const hoje = new Date();
            let dataInicio, dataFim;

            // Definir período de datas baseado na seleção
            switch (periodo) {
                case 'mes-atual':
                    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                    break;
                case '30':
                    dataInicio = new Date(hoje);
                    dataInicio.setDate(hoje.getDate() - 30);
                    dataFim = new Date(hoje);
                    break;
                case '60':
                    dataInicio = new Date(hoje);
                    dataInicio.setDate(hoje.getDate() - 60);
                    dataFim = new Date(hoje);
                    break;
                case '90':
                    dataInicio = new Date(hoje);
                    dataInicio.setDate(hoje.getDate() - 90);
                    dataFim = new Date(hoje);
                    break;
                case '365':
                    dataInicio = new Date(hoje);
                    dataInicio.setDate(hoje.getDate() - 365);
                    dataFim = new Date(hoje);
                    break;
                case 'proximo-mes':
                    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
                    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
                    break;
                case 'futuros':
                    dataInicio = new Date(hoje);
                    dataFim = new Date(2099, 11, 31);
                    break;
                case 'todos':
                    dataInicio = new Date(2000, 0, 1);
                    dataFim = new Date(2099, 11, 31);
                    break;
            }

            // Formatar datas para string (YYYY-MM-DD)
            const dataInicioStr = dataInicio.toISOString().split('T')[0];
            const dataFimStr = dataFim.toISOString().split('T')[0];

            // Carregar saldo atual
            const saldoDoc = await db.collection('financeiro').doc('saldo').get();
            const saldoAtual = saldoDoc.exists ? saldoDoc.data().valor : 0;

            // Buscar entradas do período
            const entradasSnapshot = await db.collection('movimentacoes')
                .where('tipo', '==', 'entrada')
                .where('data', '>=', dataInicioStr)
                .where('data', '<=', dataFimStr)
                .get();

            let totalEntradas = 0;
            let numServicos = 0;
            entradasSnapshot.forEach(doc => {
                const entrada = doc.data();
                totalEntradas += parseFloat(entrada.valor) || 0;
                if (entrada.categoria === 'servico') numServicos++;
            });

            // Buscar saídas do período
            const saidasSnapshot = await db.collection('movimentacoes')
                .where('tipo', '==', 'saida')
                .where('data', '>=', dataInicioStr)
                .where('data', '<=', dataFimStr)
                .get();

            let totalSaidas = 0;
            let numDespesas = 0;
            saidasSnapshot.forEach(doc => {
                const saida = doc.data();
                totalSaidas += parseFloat(saida.valor) || 0;
                numDespesas++;
            });

            // Buscar valores previstos (pagamentos pendentes de serviços)
            const { totalPrevistos, numPendentes } = await calcularValoresPrevistos();

            // Atualizar interface
            document.getElementById('saldo-caixa').textContent = formatarMoeda(saldoAtual);
            document.getElementById('total-entradas').textContent = formatarMoeda(totalEntradas);
            document.getElementById('total-saidas').textContent = formatarMoeda(totalSaidas);
            document.getElementById('total-previstos').textContent = formatarMoeda(totalPrevistos);
            
            document.getElementById('qtd-servicos').textContent = numServicos;
            document.getElementById('qtd-saidas').textContent = numDespesas;
            document.getElementById('qtd-previstos').textContent = numPendentes;

        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
            showToast('Erro ao carregar resumo financeiro', 'error');
        }
    }

    async function carregarProximosServicos() {
        try {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataHoje = hoje.toISOString().split('T')[0];

            const servicosSnapshot = await db.collection('servicos')
                .where('status', '==', 'pendente')
                .where('data', '>=', dataHoje)
                .orderBy('data', 'asc')
                .get();

            const container = document.getElementById('proximos-servicos');
            
            if (servicosSnapshot.empty) {
                container.innerHTML = '<p class="texto-info">Nenhum serviço previsto</p>';
                return;
            }

            container.innerHTML = '';
            servicosSnapshot.forEach(doc => {
                const servico = doc.data();
                const div = document.createElement('div');
                div.className = 'servico-item card expansivel';
                div.innerHTML = `
                    <div class="card-header" onclick="toggleExpansivel(this)">
                        <div class="header-content">
                            <h3>${servico.tipo} - ${servico.clienteNome}</h3>
                            <span>R$ ${formatarMoeda(servico.valor)}</span>
                        </div>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="card-content" style="display: none;">
                        <div class="servico-info">
                            <p><i class="fas fa-calendar"></i> Data Prevista: ${formatarData(servico.data)}</p>
                            <p><i class="fas fa-ruler"></i> Área: ${servico.tamanhoArea} hectares</p>
                            <p><i class="fas fa-money-bill-wave"></i> Valor: R$ ${formatarMoeda(servico.valor)}</p>
                            <p><i class="fas fa-credit-card"></i> Forma de Pagamento: ${servico.formaPagamento}</p>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        } catch (error) {
            console.error('Erro ao carregar próximos serviços:', error);
            const container = document.getElementById('proximos-servicos');
            container.innerHTML = '<p class="texto-erro">Erro ao carregar serviços</p>';
        }
    }

    // Buscar valores previstos (pagamentos pendentes de serviços)
    async function calcularValoresPrevistos() {
        try {
            let totalPrevistos = 0;
            let numPendentes = 0;
            const hoje = new Date().toISOString().split('T')[0];

            // Buscar serviços pendentes
            const servicosPendentesSnapshot = await db.collection('servicos')
                .where('status', '==', 'pendente')
                .where('data', '>=', hoje)
                .get();

            // Somar valores dos serviços pendentes
            servicosPendentesSnapshot.forEach(doc => {
                const servico = doc.data();
                totalPrevistos += parseFloat(servico.valor) || 0;
                numPendentes++;
            });

            // Buscar serviços realizados com pagamento pendente
            const servicosRealizadosSnapshot = await db.collection('servicos')
                .where('status', '==', 'realizado')
                .get();

            // Verificar pagamentos pendentes dos serviços realizados
            servicosRealizadosSnapshot.forEach(doc => {
                const servico = doc.data();
                if (servico.pagamento) {
                    const { status, valorTotal, valorPago = 0 } = servico.pagamento;
                    if (status === 'pendente' || status === 'parcial') {
                        const valorPendente = parseFloat(valorTotal) - parseFloat(valorPago);
                        if (valorPendente > 0) {
                            totalPrevistos += valorPendente;
                            numPendentes++;
                        }
                    }
                } else {
                    // Se não tem informação de pagamento, considera o valor total como pendente
                    totalPrevistos += parseFloat(servico.valor) || 0;
                    numPendentes++;
                }
            });

            return { totalPrevistos, numPendentes };
        } catch (error) {
            console.error('Erro ao calcular valores previstos:', error);
            throw error;
        }
    }

    // Expor funções globalmente
    window.carregarResumoFinanceiro = carregarResumoFinanceiro;
    window.carregarProximosServicos = carregarProximosServicos;

    // Carregar dados iniciais
    await carregarResumoFinanceiro();
    await carregarProximosServicos();
}); 