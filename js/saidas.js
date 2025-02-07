document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const modal = document.getElementById('modal-saida');
    const form = document.getElementById('form-saida');
    let saidaEmEdicao = null;

    // Botão Nova Saída
    document.getElementById('nova-saida').addEventListener('click', () => {
        saidaEmEdicao = null;
        form.reset();
        modal.style.display = 'block';
        
        // Define a data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        form.data.value = hoje;
    });

    // Fechar Modal
    window.fecharModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // Salvar Saída
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Salvando saída...');

        try {
            const valorTotal = parseFloat(form.valor.value);
            const isParcelado = form.isParcelado.checked;
            const numParcelas = isParcelado ? parseInt(form.numParcelas.value) : 1;
            const valorParcela = isParcelado ? valorTotal / numParcelas : valorTotal;

            if (isParcelado) {
                const diaVencimento = parseInt(form.diaVencimento.value);
                
                for (let i = 0; i < numParcelas; i++) {
                    const dataParcela = new Date(form.data.value);
                    dataParcela.setMonth(dataParcela.getMonth() + i);
                    dataParcela.setDate(diaVencimento);
                    
                    const saida = {
                        tipo: form.tipo.value,
                        descricao: `${form.descricao.value} (Parcela ${i + 1}/${numParcelas})`,
                        valor: valorParcela,
                        data: dataParcela.toISOString().split('T')[0],
                        formaPagamento: form.formaPagamento.value,
                        parcelado: true,
                        numParcela: i + 1,
                        totalParcelas: numParcelas,
                        valorTotal: valorTotal,
                        diaVencimento: diaVencimento,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    if (saidaEmEdicao) {
                        await db.collection('saidas').doc(saidaEmEdicao).update(saida);
                    } else {
                        await db.collection('saidas').add(saida);
                    }
                }
            } else {
                const saida = {
                    tipo: form.tipo.value,
                    descricao: form.descricao.value,
                    valor: valorTotal,
                    data: form.data.value,
                    formaPagamento: form.formaPagamento.value,
                    parcelado: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (saidaEmEdicao) {
                    await db.collection('saidas').doc(saidaEmEdicao).update(saida);
                } else {
                    await db.collection('saidas').add(saida);
                }
            }

            console.log('Saída salva com sucesso');
            fecharModal();
            await carregarSaidas();
        } catch (error) {
            console.error('Erro ao salvar saída:', error);
            alert('Erro ao salvar saída: ' + error.message);
        }
    });

    // Função de carregar saídas (agora também no escopo global)
    async function carregarSaidas() {
        try {
            console.log('Carregando saídas...');
            const periodo = document.getElementById('periodo').value;
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            const hojeStr = hoje.toISOString().split('T')[0];
            
            console.log('Período selecionado:', periodo);
            
            let query = db.collection('saidas');
            
            if (periodo === 'futuras') {
                console.log('Buscando saídas futuras a partir de:', hojeStr);
                query = query.where('data', '>', hojeStr);
            } else {
                const dataLimite = new Date();
                dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
                dataLimite.setHours(0, 0, 0, 0);
                const dataLimiteStr = dataLimite.toISOString().split('T')[0];
                
                console.log('Buscando saídas entre:', dataLimiteStr, 'e', hojeStr);
                query = query.where('data', '>=', dataLimiteStr)
                            .where('data', '<=', hojeStr);
            }
            
            query = query.orderBy('data', 'desc');
            
            console.log('Executando query...');
            const snapshot = await query.get();
            console.log('Saídas encontradas:', snapshot.size);
            
            atualizarListaSaidas(snapshot);
        } catch (error) {
            console.error('Erro ao carregar saídas:', error);
            console.error('Stack:', error.stack);
            if (error.code === 'failed-precondition') {
                alert('É necessário criar um índice para esta consulta. Por favor, aguarde alguns minutos.');
            } else {
                alert('Erro ao carregar saídas: ' + error.message);
            }
        }
    }

    // Função para atualizar a lista de saídas
    function atualizarListaSaidas(snapshot) {
        const container = document.getElementById('lista-saidas');
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="sem-dados">Nenhuma saída registrada no período</p>';
            return;
        }

        snapshot.forEach(doc => {
            const saida = doc.data();
            const data = new Date(saida.data);
            
            const element = document.createElement('div');
            element.className = 'saida-item';
            element.innerHTML = `
                <div class="saida-info">
                    <h3>${formatarTipoSaida(saida.tipo)}</h3>
                    <p><i class="fas fa-info-circle"></i> ${saida.descricao}</p>
                    <p><i class="fas fa-calendar"></i> ${data.toLocaleDateString('pt-BR')}</p>
                    <p><i class="fas fa-money-bill-wave"></i> R$ ${saida.valor.toFixed(2)}</p>
                    <p><i class="fas fa-credit-card"></i> ${saida.formaPagamento}</p>
                    ${saida.parcelado ? `
                        <p><i class="fas fa-clock"></i> Parcela ${saida.numParcela}/${saida.totalParcelas}</p>
                    ` : ''}
                </div>
                <div class="acoes-item">
                    <button onclick="editarSaida('${doc.id}')" class="btn-editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="excluirSaida('${doc.id}')" class="btn-excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            container.appendChild(element);
        });
    }

    // Função para formatar o tipo de saída
    function formatarTipoSaida(tipo) {
        const tipos = {
            'combustivel': 'Combustível',
            'manutencao': 'Manutenção',
            'equipamento': 'Equipamento',
            'salario': 'Salário',
            'adiantamento_salario': 'Adiantamento Salário',
            'outros': 'Outros'
        };
        return tipos[tipo] || tipo;
    }

    // Funções globais
    window.fecharModal = fecharModal;

    window.editarSaida = async (id) => {
        try {
            const doc = await db.collection('saidas').doc(id).get();
            const saida = doc.data();

            saidaEmEdicao = id;
            form.tipo.value = saida.tipo;
            form.descricao.value = saida.descricao;
            form.valor.value = saida.valor;
            form.data.value = saida.data;
            form.formaPagamento.value = saida.formaPagamento;

            modal.style.display = 'block';
        } catch (error) {
            console.error('Erro ao carregar saída para edição:', error);
            alert('Erro ao carregar saída para edição: ' + error.message);
        }
    };

    window.excluirSaida = async (id) => {
        if (confirm('Tem certeza que deseja excluir esta saída?')) {
            try {
                await db.collection('saidas').doc(id).delete();
                await carregarSaidas();
            } catch (error) {
                console.error('Erro ao excluir saída:', error);
                alert('Erro ao excluir saída: ' + error.message);
            }
        }
    };

    function handleParcelamentoChange() {
        const isParcelado = document.getElementById('isParcelado').checked;
        const parcelamentoDetails = document.getElementById('parcelamentoDetails');
        const numParcelasInput = document.getElementById('numParcelas');
        const diaVencimentoInput = document.getElementById('diaVencimento');
        
        console.log('Parcelamento marcado:', isParcelado);
        
        if (isParcelado) {
            parcelamentoDetails.style.display = 'block';
            numParcelasInput.required = true;
            diaVencimentoInput.required = true;
        } else {
            parcelamentoDetails.style.display = 'none';
            numParcelasInput.required = false;
            diaVencimentoInput.required = false;
            numParcelasInput.value = '';
            diaVencimentoInput.value = '5';
        }
    }

    function handleFormaPagamentoChange() {
        const formaPagamento = form.formaPagamento.value;
        const isParceladoCheck = document.getElementById('isParcelado');
        const parcelamentoDetails = document.getElementById('parcelamentoDetails');
        const numParcelasInput = document.getElementById('numParcelas');
        const diaVencimentoInput = document.getElementById('diaVencimento');
        
        console.log('Forma de pagamento selecionada:', formaPagamento);
        
        if (formaPagamento === 'cartao') {
            isParceladoCheck.disabled = false;
            console.log('Habilitando checkbox de parcelamento');
        } else {
            isParceladoCheck.disabled = true;
            isParceladoCheck.checked = false;
            parcelamentoDetails.style.display = 'none';
            numParcelasInput.required = false;
            diaVencimentoInput.required = false;
            console.log('Desabilitando parcelamento');
        }
    }

    // Expor funções necessárias globalmente
    window.carregarSaidas = carregarSaidas;
    window.editarSaida = editarSaida;
    window.excluirSaida = excluirSaida;
    window.handleFormaPagamentoChange = handleFormaPagamentoChange;
    window.handleParcelamentoChange = handleParcelamentoChange;

    // Inicializar
    carregarSaidas();
}); 