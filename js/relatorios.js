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

    // Função para formatar datas
    function formatarData(data) {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    }

    // Função para calcular e exibir relatórios
    async function carregarRelatorios() {
        try {
            const periodo = document.getElementById('periodo').value;
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            
            let dataInicio, dataFim;
            const isFuturo = periodo === 'futuros';
            const isTodos = periodo === 'todos';

            if (isTodos) {
                dataInicio = new Date(2000, 0, 1);
                dataFim = new Date(2099, 11, 31);
            } else if (isFuturo) {
                dataInicio = hoje;
                dataFim = new Date(2099, 11, 31);
            } else {
                dataFim = hoje;
                dataInicio = new Date();
                dataInicio.setDate(hoje.getDate() - parseInt(periodo));
                dataInicio.setHours(0, 0, 0, 0);
            }

            const movimentacoesSnapshot = await db.collection('movimentacoes')
                .where('data', '>=', dataInicio.toISOString().split('T')[0])
                .where('data', '<=', dataFim.toISOString().split('T')[0])
                .orderBy('data')
                .get();

            let totalEntradas = 0;
            let totalSaidas = 0;
            let numServicos = 0;
            let numSaidas = 0;

            movimentacoesSnapshot.forEach(doc => {
                const mov = doc.data();
                const dataMovimentacao = new Date(mov.data);
                const valor = parseFloat(mov.valor) || 0;

                // Se for uma movimentação do período atual ou passado
                if (dataMovimentacao <= hoje || isFuturo) {
                    if (mov.tipo === 'entrada') {
                        totalEntradas += valor;
                        if (mov.categoria === 'servico') numServicos++;
                    } else {
                        totalSaidas += valor;
                        numSaidas++;
                    }
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
                        const valorPago = parseFloat(servico.pagamento.valorPago) || 0;
                        const valorTotal = parseFloat(servico.valor) || 0;
                        totalPrevistos += (valorTotal - valorPago);
                    }
                    qtdPrevistos++;
                }
            });

            const lucro = totalEntradas - totalSaidas;
            const margemLucro = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0;

            // Atualizar valores na tela
            document.getElementById('total-entradas').textContent = `R$ ${formatarMoeda(totalEntradas)}`;
            document.getElementById('total-saidas').textContent = `R$ ${formatarMoeda(totalSaidas)}`;
            document.getElementById('total-previstos').textContent = `R$ ${formatarMoeda(totalPrevistos)}`;
            document.getElementById('lucro').textContent = `R$ ${formatarMoeda(lucro)}`;
            document.getElementById('num-servicos').textContent = `${numServicos} Serviços Realizados`;
            document.getElementById('num-saidas').textContent = `${numSaidas} Saídas`;
            document.getElementById('num-previstos').textContent = `${qtdPrevistos} Pagamentos Pendentes`;
            document.getElementById('margem-lucro').textContent = `Margem de Lucro: ${margemLucro.toFixed(2)}%`;

            await carregarListasDetalhadas(dataInicio, dataFim, isFuturo);

        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            alert('Erro ao carregar relatórios: ' + error.message);
        }
    }

    async function carregarListasDetalhadas(dataInicio, dataFim, isFuturo) {
        try {
            // Carregar serviços realizados
            let servicosQuery = db.collection('servicos')
                .where('status', '==', 'realizado')
                .orderBy('data');

            const servicosSnapshot = await servicosQuery.get();

            const listaServicos = document.getElementById('lista-servicos-realizados');
            listaServicos.innerHTML = servicosSnapshot.empty ? 
                '<p class="sem-dados">Nenhum serviço no período</p>' :
                servicosSnapshot.docs
                    .filter(doc => {
                        const servico = doc.data();
                        const dataServico = new Date(servico.data);
                        if (isFuturo) {
                            return dataServico >= dataInicio;
                        } else if (periodo === 'todos') {
                            return true;
                        } else {
                            return dataServico >= dataInicio && dataServico <= dataFim;
                        }
                    })
                    .map(doc => {
                        const servico = doc.data();
                        return `
                            <div class="servico-item card expansivel">
                                <div class="card-header" onclick="MRDrones.toggleExpansivel(this)">
                                    <div class="header-content">
                                        <h3>${servico.tipo} - ${servico.clienteNome}</h3>
                                        <span>R$ ${formatarMoeda(servico.valor)}</span>
                                    </div>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <div class="card-content" style="display: none;">
                                    <div class="servico-info">
                                        <p><i class="fas fa-calendar"></i> Data: ${formatarData(servico.data)}</p>
                                        ${servico.dataExecucao ? 
                                            `<p><i class="fas fa-calendar-check"></i> Executado em: ${formatarData(servico.dataExecucao)}</p>` 
                                            : ''}
                                        <p><i class="fas fa-ruler"></i> Área: ${servico.tamanhoArea} hectares</p>
                                        <p><i class="fas fa-money-bill-wave"></i> Valor: R$ ${formatarMoeda(servico.valor)}</p>
                                        <p><i class="fas fa-credit-card"></i> Forma de Pagamento: ${servico.formaPagamento}</p>
                                        ${servico.pagamento ? `
                                            <p><i class="fas fa-info-circle"></i> Status do Pagamento: ${servico.pagamento.status}</p>
                                            ${servico.pagamento.valorPago ? 
                                                `<p><i class="fas fa-money-bill-wave"></i> Valor Pago: R$ ${formatarMoeda(servico.pagamento.valorPago)}</p>` 
                                                : ''}
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');

            // Carregar saídas
            let saidasQuery = db.collection('movimentacoes')
                .where('tipo', '==', 'saida')
                .orderBy('data', 'desc');

            const saidasSnapshot = await saidasQuery.get();

            const listaSaidas = document.getElementById('lista-saidas');
            listaSaidas.innerHTML = saidasSnapshot.empty ?
                '<p class="sem-dados">Nenhuma saída no período</p>' :
                saidasSnapshot.docs
                    .filter(doc => {
                        const saida = doc.data();
                        const dataSaida = new Date(saida.data);
                        if (isFuturo) {
                            return dataSaida >= dataInicio;
                        } else if (periodo === 'todos') {
                            return true;
                        } else {
                            return dataSaida >= dataInicio && dataSaida <= dataFim;
                        }
                    })
                    .map(doc => {
                        const saida = doc.data();
                        return `
                            <div class="servico-item card expansivel">
                                <div class="card-header" onclick="MRDrones.toggleExpansivel(this)">
                                    <div class="header-content">
                                        <h3>${saida.categoria} - ${saida.descricao}</h3>
                                        <span>R$ ${formatarMoeda(saida.valor)}</span>
                                    </div>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <div class="card-content" style="display: none;">
                                    <div class="servico-info">
                                        <p><i class="fas fa-calendar"></i> ${formatarData(saida.data)}</p>
                                        <p><i class="fas fa-money-bill-wave"></i> R$ ${formatarMoeda(saida.valor)}</p>
                                        <p><i class="fas fa-credit-card"></i> ${saida.formaPagamento}</p>
                                        ${saida.parcelado ? `
                                            <p><i class="fas fa-clock"></i> Parcela ${saida.numParcela}/${saida.totalParcelas}</p>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');

        } catch (error) {
            console.error('Erro ao carregar listas:', error);
            const mensagem = 'Erro ao carregar os dados. Por favor, tente novamente em alguns instantes.';
            document.getElementById('lista-servicos-realizados').innerHTML = `<p class="erro">${mensagem}</p>`;
            document.getElementById('lista-saidas').innerHTML = `<p class="erro">${mensagem}</p>`;
        }
    }

    // Adicionar listener para mudança no período
    const periodoSelect = document.getElementById('periodo');
    if (periodoSelect) {
        periodoSelect.addEventListener('change', carregarRelatorios);
    }

    // Expor função para outros módulos
    window.carregarRelatorios = carregarRelatorios;

    // Inicializar
    carregarRelatorios();

    // Adicionar função de toggle no escopo global
    window.toggleExpansivel = function(header) {
        const content = header.nextElementSibling;
        const icon = header.querySelector('i.fas');
        
        if (content && icon) {
            const isHidden = content.style.display === 'none' || !content.style.display;
            content.style.display = isHidden ? 'block' : 'none';
            icon.classList.toggle('fa-chevron-down', !isHidden);
            icon.classList.toggle('fa-chevron-up', isHidden);
        }
    };
}); 