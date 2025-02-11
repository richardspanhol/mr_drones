document.addEventListener('DOMContentLoaded', () => {
    if (!window.db) {
        console.error('Firebase não inicializado');
        return;
    }

    const db = firebase.firestore();
    console.log('Firestore inicializado em servicos.js');

    // Elementos do DOM
    const modal = document.getElementById('modal-servico');
    const form = document.getElementById('form-servico');
    const listaServicos = document.getElementById('lista-servicos');
    const btnNovoServico = document.getElementById('novo-servico');
    const selectCliente = document.getElementById('cliente');

    const PRECOS_SERVICOS = {
        pulverizacao: 120,
        mapeamento: 90,
        plantacao: 100
    };

    // Event Listeners
    btnNovoServico.addEventListener('click', () => {
        console.log('Abrindo modal de novo serviço');
        carregarClientes();
        abrirModal();
    });

    // Adicionar uma flag para evitar submissões duplicadas
    let isSubmitting = false;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) {
            console.log('Já está processando um submit, ignorando...');
            return;
        }

        console.log('Salvando serviço...');
        isSubmitting = true;
        
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            const servico = {
                clienteId: form.cliente.value,
                clienteNome: form.cliente.options[form.cliente.selectedIndex].text,
                tipo: form.tipo.value === 'outros' ? form.outroTipo.value : form.tipo.value,
                tipoPersonalizado: form.tipo.value === 'outros',
                tamanhoArea: parseFloat(form.tamanhoArea.value),
                formaPagamento: form.formaPagamento.value,
                valor: parseFloat(form.valor.value),
                dataPrevista: ajustarData(form.data.value),
                status: 'pendente',
                dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('Dados do serviço:', servico);

            if (form.dataset.id) {
                await db.collection('servicos').doc(form.dataset.id).update(servico);
            } else {
                const docRef = await db.collection('servicos').add(servico);
                console.log('Serviço salvo com ID:', docRef.id);
            }

            console.log('Serviço salvo com sucesso');
            fecharModal();
            await carregarServicos();
        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
            alert('Erro ao salvar serviço: ' + error.message);
        } finally {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            isSubmitting = false;
        }
    });

    // Funções
    async function carregarClientes() {
        try {
            console.log('Carregando clientes...');
            const snapshot = await db.collection('clientes').get();
            selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
            
            snapshot.forEach(doc => {
                const cliente = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = cliente.nome;
                selectCliente.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            alert('Erro ao carregar clientes: ' + error.message);
        }
    }

    function abrirModal(servico = null) {
        console.log('Abrindo modal', servico);
        modal.style.display = 'block';
        
        // Atualizar o label da data
        const dataLabel = document.querySelector('label[for="data"]');
        dataLabel.textContent = 'Data Prevista';
        const dataInput = document.getElementById('data');
        dataInput.required = false;

        if (servico) {
            form.cliente.value = servico.clienteId;
            form.tipo.value = servico.tipo;
            form.tamanhoArea.value = servico.tamanhoArea;
            form.formaPagamento.value = servico.formaPagamento;
            form.valor.value = servico.valor;
            form.data.value = servico.dataPrevista || '';
            form.dataset.id = servico.id;
        } else {
            form.reset();
            delete form.dataset.id;
        }
    }

    function fecharModal() {
        modal.style.display = 'none';
        form.reset();
    }

    async function carregarServicos() {
        try {
            const periodo = document.getElementById('periodo').value;
            const statusFiltro = document.getElementById('status').value;
            let query = db.collection('servicos');

            // Ordenar por data de cadastro por padrão
            query = query.orderBy('dataCadastro', 'desc');

            const snapshot = await query.get();
            renderizarServicos(snapshot, statusFiltro);
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            alert('Erro ao carregar serviços: ' + error.message);
        }
    }

    function renderizarServicos(snapshot, statusFiltro) {
        const container = document.getElementById('lista-servicos');
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p class="sem-dados">Nenhum serviço encontrado</p>';
            return;
        }

        let servicosFiltrados = Array.from(snapshot.docs);
        
        // Aplicar filtro de status
        if (statusFiltro !== 'todos') {
            servicosFiltrados = servicosFiltrados.filter(doc => {
                const servico = doc.data();
                return servico.status === statusFiltro;
            });
        }

        if (servicosFiltrados.length === 0) {
            container.innerHTML = '<p class="sem-dados">Nenhum serviço encontrado</p>';
            return;
        }

        servicosFiltrados.forEach(doc => {
            const servico = { id: doc.id, ...doc.data() };
            container.appendChild(criarItemServico(servico, doc));
        });
    }

    function criarItemServico(servico, doc) {
        const div = document.createElement('div');
        div.className = 'servico-item card expansivel';
        
        // Formatar o status para exibição
        const statusDisplay = servico.status === 'realizado' ? 
            '<span class="status-realizado"><i class="fas fa-check-circle"></i> Realizado</span>' : 
            '<span class="status-pendente"><i class="fas fa-clock"></i> Pendente</span>';

        // Formatar informações de pagamento
        let pagamentoInfo = '';
        if (servico.status === 'realizado' && servico.pagamento) {
            if (servico.pagamento.status === 'prazo') {
                pagamentoInfo = `
                    <div class="pagamento-info">
                        <i class="fas fa-clock"></i>
                        Pagamento previsto para: ${formatarData(servico.pagamento.dataPrevista)}
                    </div>`;
            } else if (servico.pagamento.status === 'parcial') {
                pagamentoInfo = `
                    <div class="pagamento-info">
                        <i class="fas fa-money-bill-wave"></i>
                        Pago: R$ ${formatarMoeda(servico.pagamento.valorPago)} de R$ ${formatarMoeda(servico.valor)}
                    </div>`;
            }
        }

        div.innerHTML = `
            <div class="card-header" onclick="toggleExpansivel(this)">
                <div>
                    <h3>${servico.tipo} - ${servico.clienteNome}</h3>
                    ${statusDisplay}
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="card-content" style="display: none;">
                <div class="servico-info">
                    <p><i class="fas fa-calendar"></i> Data Prevista: ${formatarData(servico.dataPrevista)}</p>
                    ${servico.dataExecucao ? `<p><i class="fas fa-calendar-check"></i> Executado em: ${formatarData(servico.dataExecucao)}</p>` : ''}
                    <p><i class="fas fa-ruler"></i> Área: ${servico.tamanhoArea} hectares</p>
                    <p><i class="fas fa-money-bill-wave"></i> Valor: R$ ${formatarMoeda(servico.valor)}</p>
                    <p><i class="fas fa-credit-card"></i> Forma de Pagamento: ${servico.formaPagamento}</p>
                    ${pagamentoInfo}
                </div>
                <div class="servico-acoes">
                    <button onclick="editarServico('${doc.id}')" class="btn-editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="excluirServico('${doc.id}')" class="btn-excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${servico.status === 'pendente' ? `
                        <button onclick="marcarRealizado('${doc.id}')" class="btn-concluir">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        return div;
    }

    function handleTipoChange() {
        const tipoSelect = form.tipo;
        const outroTipoGroup = document.getElementById('outroTipoGroup');
        const valorInput = form.valor;
        
        if (tipoSelect.value === 'outros') {
            outroTipoGroup.style.display = 'block';
            valorInput.readOnly = false;
            valorInput.value = '';
        } else {
            outroTipoGroup.style.display = 'none';
            calcularValorServico();
        }
    }

    function calcularValorServico() {
        const tipo = form.tipo.value;
        const tamanhoArea = parseFloat(form.tamanhoArea.value) || 0;
        
        if (tipo && tipo !== 'outros' && tamanhoArea > 0) {
            const valorTotal = PRECOS_SERVICOS[tipo] * tamanhoArea;
            form.valor.value = valorTotal.toFixed(2);
        }
    }

    // Funções globais
    window.abrirModal = abrirModal;
    window.fecharModal = fecharModal;
    window.calcularValorServico = calcularValorServico;

    window.editarServico = async (id) => {
        try {
            console.log('Editando serviço:', id);
            const doc = await db.collection('servicos').doc(id).get();
            if (doc.exists) {
                const servico = { id: doc.id, ...doc.data() };
                await carregarClientes();
                abrirModal(servico);
            }
        } catch (error) {
            console.error('Erro ao carregar serviço:', error);
            alert('Erro ao carregar serviço: ' + error.message);
        }
    };

    window.excluirServico = async (id) => {
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            try {
                console.log('Excluindo serviço:', id);
                await db.collection('servicos').doc(id).delete();
                await carregarServicos();
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                alert('Erro ao excluir serviço: ' + error.message);
            }
        }
    };

    window.alternarStatus = async (id, statusAtual) => {
        if (statusAtual === 'pendente') {
            const dataExecucao = await confirmarDataExecucao();
            if (!dataExecucao) return;

            try {
                // Buscar dados do serviço
                const servicoDoc = await db.collection('servicos').doc(id).get();
                const servico = servicoDoc.data();
                
                // Confirmar pagamento
                const pagamento = await confirmarPagamento(servico.valor);
                if (!pagamento) return;

                const atualizacao = {
                    status: 'realizado',
                    dataExecucao: ajustarData(dataExecucao),
                    dataRealizacao: firebase.firestore.FieldValue.serverTimestamp(),
                    pagamento: {
                        status: pagamento.status,
                        valorPago: pagamento.valorPago,
                        valorTotal: servico.valor,
                        dataPagamentoPrevisto: pagamento.dataPagamentoPrevisto ? 
                            ajustarData(pagamento.dataPagamentoPrevisto) : null
                    }
                };

                // Se houve pagamento (integral ou parcial), atualizar saldo
                if (pagamento.valorPago > 0) {
                    const saldoRef = db.collection('financeiro').doc('saldo');
                    await db.runTransaction(async (transaction) => {
                        const saldoDoc = await transaction.get(saldoRef);
                        const saldoAtual = saldoDoc.data().valor || 0;
                        transaction.update(saldoRef, { 
                            valor: saldoAtual + pagamento.valorPago 
                        });
                    });

                    // Registrar movimentação financeira
                    await db.collection('movimentacoes').add({
                        tipo: 'entrada',
                        categoria: 'servico',
                        descricao: `Pagamento de serviço - ${servico.tipo} para ${servico.clienteNome}`,
                        valor: pagamento.valorPago,
                        data: new Date().toISOString().split('T')[0],
                        formaPagamento: servico.formaPagamento,
                        servicoId: id
                    });
                }

                await db.collection('servicos').doc(id).update(atualizacao);
                await carregarServicos();
                
                if (window.carregarResumoFinanceiro) {
                    await window.carregarResumoFinanceiro();
                }
            } catch (error) {
                console.error('Erro ao confirmar execução:', error);
                alert('Erro ao confirmar execução: ' + error.message);
            }
        } else {
            // Voltar para pendente
            if (confirm('Marcar serviço como pendente?')) {
                try {
                    await db.collection('servicos').doc(id).update({
                        status: 'pendente',
                        dataExecucao: firebase.firestore.FieldValue.delete(),
                        dataRealizacao: firebase.firestore.FieldValue.delete()
                    });
                    await carregarServicos();
                } catch (error) {
                    console.error('Erro ao alterar status:', error);
                    alert('Erro ao alterar status: ' + error.message);
                }
            }
        }
    };

    // Função para mostrar modal de confirmação de data
    function confirmarDataExecucao() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <h2>Confirmar Execução</h2>
                    <div class="form-group">
                        <label for="dataExecucao">Data da Execução</label>
                        <input type="date" id="dataExecucao" required 
                               value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-buttons">
                        <button onclick="confirmarData()" class="btn-primary">Confirmar</button>
                        <button onclick="cancelarConfirmacao()" class="btn-secondary">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            window.confirmarData = () => {
                const data = document.getElementById('dataExecucao').value;
                if (!data) {
                    alert('Por favor, informe a data de execução');
                    return;
                }
                document.body.removeChild(modal);
                resolve(data);
            };

            window.cancelarConfirmacao = () => {
                document.body.removeChild(modal);
                resolve(null);
            };
        });
    }

    // Função para confirmar pagamento
    function confirmarPagamento(valorTotal) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <h2>Confirmar Pagamento</h2>
                    <p>Valor Total do Serviço: R$ ${valorTotal.toFixed(2)}</p>
                    <div class="form-group">
                        <label>Status do Pagamento</label>
                        <select id="statusPagamento" onchange="handleStatusPagamento()">
                            <option value="integral">Pago Integralmente</option>
                            <option value="parcial">Pago Parcialmente</option>
                            <option value="prazo">A Prazo</option>
                        </select>
                    </div>
                    <div id="valorParcialGroup" style="display: none;">
                        <div class="form-group">
                            <label>Valor Pago</label>
                            <input type="number" id="valorPago" step="0.01" min="0" max="${valorTotal}">
                        </div>
                    </div>
                    <div id="dataPagamentoGroup" style="display: none;">
                        <div class="form-group">
                            <label>Data Prevista para Pagamento</label>
                            <input type="date" id="dataPagamentoPrevisto">
                        </div>
                    </div>
                    <div class="form-buttons">
                        <button onclick="confirmarStatusPagamento()" class="btn-primary">Confirmar</button>
                        <button onclick="cancelarConfirmacaoPagamento()" class="btn-secondary">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            window.handleStatusPagamento = () => {
                const status = document.getElementById('statusPagamento').value;
                document.getElementById('valorParcialGroup').style.display = 
                    status === 'parcial' ? 'block' : 'none';
                document.getElementById('dataPagamentoGroup').style.display = 
                    (status === 'prazo' || status === 'parcial') ? 'block' : 'none';
            };

            window.confirmarStatusPagamento = () => {
                const status = document.getElementById('statusPagamento').value;
                const resultado = {
                    status,
                    valorPago: 0,
                    dataPagamentoPrevisto: null
                };

                if (status === 'integral') {
                    resultado.valorPago = valorTotal;
                } else if (status === 'parcial') {
                    resultado.valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
                    resultado.dataPagamentoPrevisto = document.getElementById('dataPagamentoPrevisto').value;
                    if (resultado.valorPago <= 0 || resultado.valorPago >= valorTotal) {
                        alert('Por favor, informe um valor parcial válido');
                        return;
                    }
                } else if (status === 'prazo') {
                    resultado.dataPagamentoPrevisto = document.getElementById('dataPagamentoPrevisto').value;
                }

                if ((status === 'prazo' || status === 'parcial') && !resultado.dataPagamentoPrevisto) {
                    alert('Por favor, informe a data prevista para pagamento');
                    return;
                }

                document.body.removeChild(modal);
                resolve(resultado);
            };

            window.cancelarConfirmacaoPagamento = () => {
                document.body.removeChild(modal);
                resolve(null);
            };
        });
    }

    // Atualizar a função de filtrar serviços
    function filtrarServicos() {
        const termo = document.getElementById('pesquisaServico').value.toLowerCase();
        const servicos = document.querySelectorAll('.servico-item');
        
        servicos.forEach(servico => {
            const textoServico = servico.textContent.toLowerCase();
            const deveExibir = textoServico.includes(termo);
            servico.style.display = deveExibir ? '' : 'none';
        });
    }

    // Adicionar event listeners para os filtros
    document.getElementById('pesquisaServico').addEventListener('keyup', filtrarServicos);
    document.getElementById('status').addEventListener('change', carregarServicos);
    document.getElementById('periodo').addEventListener('change', carregarServicos);

    // Inicialização
    console.log('Inicializando página de serviços...');
    carregarServicos();

    // Função para ajustar data (adicionar no início do arquivo)
    function ajustarData(data) {
        if (!data) return null;
        // Garantir que a data está no fuso horário local
        const [ano, mes, dia] = data.split('-');
        const dataAjustada = new Date(ano, mes - 1, dia, 12, 0, 0);
        return dataAjustada.toISOString();
    }

    function formatarMoeda(valor) {
        return 'R$ ' + valor.toFixed(2);
    }

    // Na função de confirmar pagamento
    async function registrarPagamento(servicoId, pagamento) {
        try {
            await db.runTransaction(async (transaction) => {
                // Atualizar serviço
                const servicoRef = db.collection('servicos').doc(servicoId);
                transaction.update(servicoRef, {
                    'pagamento': pagamento,
                    'status': 'realizado'
                });

                // Registrar movimentação de entrada
                const movRef = db.collection('movimentacoes').doc();
                const valorPago = pagamento.status === 'integral' ? pagamento.valorTotal : pagamento.valorPago;
                
                transaction.set(movRef, {
                    tipo: 'entrada',
                    categoria: 'servico',
                    valor: valorPago,
                    descricao: `Pagamento de serviço #${servicoId}`,
                    data: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Atualizar saldo
                const saldoRef = db.collection('financeiro').doc('saldo');
                const saldoDoc = await transaction.get(saldoRef);
                const saldoAtual = saldoDoc.exists ? saldoDoc.data().valor : 0;
                
                transaction.set(saldoRef, {
                    valor: saldoAtual + valorPago,
                    ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            throw error;
        }
    }

    // Mover a função marcarRealizado para o escopo global
    window.marcarRealizado = async (id) => {
        try {
            const servicoRef = db.collection('servicos').doc(id);
            const servicoDoc = await servicoRef.get();
            
            if (!servicoDoc.exists) {
                throw new Error('Serviço não encontrado');
            }

            // Confirmar data de execução
            const dataExecucao = await confirmarDataExecucao();
            if (!dataExecucao) return;

            // Buscar dados do serviço
            const servico = servicoDoc.data();
            
            // Confirmar pagamento
            const pagamento = await confirmarPagamento(servico.valor);
            if (!pagamento) return;

            const atualizacao = {
                status: 'realizado',
                dataExecucao: ajustarData(dataExecucao),
                dataRealizacao: firebase.firestore.FieldValue.serverTimestamp(),
                pagamento: {
                    status: pagamento.status,
                    valorPago: pagamento.valorPago,
                    valorTotal: servico.valor,
                    dataPagamentoPrevisto: pagamento.dataPagamentoPrevisto ? 
                        ajustarData(pagamento.dataPagamentoPrevisto) : null
                }
            };

            // Se houve pagamento (integral ou parcial), atualizar saldo
            if (pagamento.valorPago > 0) {
                const saldoRef = db.collection('financeiro').doc('saldo');
                await db.runTransaction(async (transaction) => {
                    const saldoDoc = await transaction.get(saldoRef);
                    const saldoAtual = saldoDoc.data()?.valor || 0;
                    
                    // Atualizar saldo
                    transaction.update(saldoRef, { 
                        valor: saldoAtual + pagamento.valorPago 
                    });

                    // Atualizar serviço
                    transaction.update(servicoRef, atualizacao);
                });

                // Registrar movimentação financeira
                await db.collection('movimentacoes').add({
                    tipo: 'entrada',
                    categoria: 'servico',
                    descricao: `Pagamento de serviço - ${servico.tipo} para ${servico.clienteNome}`,
                    valor: pagamento.valorPago,
                    data: new Date().toISOString().split('T')[0],
                    formaPagamento: servico.formaPagamento,
                    servicoId: id
                });
            } else {
                // Se não houve pagamento, apenas atualiza o serviço
                await servicoRef.update(atualizacao);
            }

            // Recarregar a lista de serviços
            await carregarServicos();
            
            // Atualizar resumo financeiro se a função existir
            if (window.carregarResumoFinanceiro) {
                await window.carregarResumoFinanceiro();
            }

        } catch (error) {
            console.error('Erro ao marcar serviço como realizado:', error);
            alert('Não foi possível marcar o serviço como realizado: ' + error.message);
        }
    };
}); 