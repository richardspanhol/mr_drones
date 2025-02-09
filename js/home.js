document.addEventListener('DOMContentLoaded', () => {
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

    // Função para carregar o resumo na página inicial
    async function carregarResumoHome() {
        try {
            // Carregar saldo
            const saldoDoc = await db.collection('financeiro').doc('saldo').get();
            let saldoAtual = 0;
            
            if (saldoDoc.exists) {
                saldoAtual = typeof saldoDoc.data().valor === 'number' ? 
                    saldoDoc.data().valor : 
                    parseFloat(saldoDoc.data().valor) || 0;
            }

            document.getElementById('saldo-caixa').textContent = formatarMoeda(saldoAtual);

            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const dataInicio = inicioMes.toISOString().split('T')[0];
            
            // Buscar todas as movimentações do mês atual
            const movimentacoesSnapshot = await db.collection('movimentacoes')
                .orderBy('data')
                .startAt(dataInicio)
                .get();
                
            let totalEntradas = 0;
            let totalSaidas = 0;
            let numServicos = 0;
            let numDespesas = 0;
            
            movimentacoesSnapshot.forEach(doc => {
                const mov = doc.data();
                if (mov.tipo === 'entrada') {
                    totalEntradas += parseFloat(mov.valor) || 0;
                    if (mov.categoria === 'servico') numServicos++;
                } else if (mov.tipo === 'saida') {
                    totalSaidas += parseFloat(mov.valor) || 0;
                    numDespesas++;
                }
            });
            
            // Carregar valores previstos (pagamentos pendentes)
            const servicosSnapshot = await db.collection('servicos')
                .where('status', '==', 'realizado')
                .get();

            let totalPrevistos = 0;
            let qtdPrevistos = 0;

            servicosSnapshot.forEach(doc => {
                const servico = doc.data();
                if (servico.pagamento && 
                    (servico.pagamento.status === 'prazo' || servico.pagamento.status === 'parcial')) {
                    
                    if (servico.pagamento.status === 'prazo') {
                        totalPrevistos += parseFloat(servico.valor) || 0;
                    } else if (servico.pagamento.status === 'parcial') {
                        // Se for pagamento parcial, adiciona apenas o valor restante
                        const valorPago = parseFloat(servico.pagamento.valorPago) || 0;
                        const valorTotal = parseFloat(servico.valor) || 0;
                        totalPrevistos += (valorTotal - valorPago);
                    }
                    qtdPrevistos++;
                }
            });

            // Atualizar valores na tela
            document.getElementById('total-entradas').textContent = formatarMoeda(totalEntradas);
            document.getElementById('total-saidas').textContent = formatarMoeda(totalSaidas);
            document.getElementById('qtd-servicos').textContent = numServicos;
            document.getElementById('qtd-saidas').textContent = numDespesas;
            document.getElementById('total-previstos').textContent = formatarMoeda(totalPrevistos);
            document.getElementById('qtd-previstos').textContent = qtdPrevistos;

            await carregarProximosServicos();

        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
            alert('Erro ao carregar resumo financeiro: ' + error.message);
        }
    }

    async function carregarProximosServicos() {
        try {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataHoje = hoje.toISOString().split('T')[0];

            // Query simplificada
            const servicosSnapshot = await db.collection('servicos')
                .orderBy('dataPrevista')
                .get();

            const container = document.getElementById('proximos-servicos');
            container.innerHTML = '';

            // Filtrar em memória
            const servicosFiltrados = servicosSnapshot.docs
                .map(doc => ({id: doc.id, ...doc.data()}))
                .filter(servico => 
                    servico.status === 'pendente' && 
                    servico.dataPrevista >= dataHoje
                )
                .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));

            if (servicosFiltrados.length === 0) {
                container.innerHTML = '<p class="texto-info">Nenhum serviço previsto</p>';
                return;
            }

            servicosFiltrados.forEach(servico => {
                const div = document.createElement('div');
                div.className = 'servico-item card expansivel';
                div.innerHTML = `
                    <div class="card-header" onclick="toggleExpansivel(this)">
                        <h3>${servico.tipo} - ${servico.clienteNome}</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="card-content" style="display: none;">
                        <div class="servico-info">
                            <p><i class="fas fa-calendar"></i> Data Prevista: ${formatarData(servico.dataPrevista)}</p>
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

    // Carregar dados iniciais
    carregarResumoHome();
}); 