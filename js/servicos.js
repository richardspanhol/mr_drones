// Remova toda a parte de configuração do Firebase, pois já está no auth.js
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

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Salvando serviço...');
    
    try {
        const servico = {
            clienteId: form.cliente.value,
            clienteNome: form.cliente.options[form.cliente.selectedIndex].text,
            tipo: form.tipo.value,
            tamanhoArea: parseFloat(form.tamanhoArea.value),
            formaPagamento: form.formaPagamento.value,
            valor: parseFloat(form.valor.value),
            data: form.data.value,
            status: 'pendente',
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('Dados do serviço:', servico);

        if (form.dataset.id) {
            await db.collection('servicos').doc(form.dataset.id).update(servico);
        } else {
            await db.collection('servicos').add(servico);
        }

        console.log('Serviço salvo com sucesso');
        fecharModal();
        await carregarServicos();
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        alert('Erro ao salvar serviço: ' + error.message);
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
    if (servico) {
        form.cliente.value = servico.clienteId;
        form.tipo.value = servico.tipo;
        form.tamanhoArea.value = servico.tamanhoArea;
        form.formaPagamento.value = servico.formaPagamento;
        form.valor.value = servico.valor;
        form.data.value = servico.data;
        form.dataset.id = servico.id;
    } else {
        form.reset();
        delete form.dataset.id;
        const hoje = new Date().toISOString().split('T')[0];
        form.data.value = hoje;
    }
}

function fecharModal() {
    modal.style.display = 'none';
    form.reset();
}

async function carregarServicos() {
    try {
        console.log('Carregando serviços...');
        const snapshot = await db.collection('servicos')
            .orderBy('data', 'desc')
            .get();
        
        listaServicos.innerHTML = '';
        
        if (snapshot.empty) {
            listaServicos.innerHTML = '<p class="sem-dados">Nenhum serviço cadastrado</p>';
            return;
        }

        snapshot.forEach(doc => {
            const servico = { id: doc.id, ...doc.data() };
            const element = criarElementoServico(servico);
            listaServicos.appendChild(element);
        });
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        alert('Erro ao carregar serviços: ' + error.message);
    }
}

function criarElementoServico(servico) {
    const div = document.createElement('div');
    div.className = 'servico-item';
    const data = new Date(servico.data).toLocaleDateString('pt-BR');
    const statusClass = servico.status === 'realizado' ? 'status-realizado' : 'status-pendente';
    
    div.innerHTML = `
        <div class="servico-info">
            <h3>${servico.tipo}</h3>
            <p><i class="fas fa-user"></i> ${servico.clienteNome}</p>
            <p><i class="fas fa-calendar"></i> ${data}</p>
            <p><i class="fas fa-ruler"></i> ${servico.tamanhoArea} hectares</p>
            <p><i class="fas fa-money-bill-wave"></i> R$ ${servico.valor.toFixed(2)}</p>
            <p><i class="fas fa-credit-card"></i> ${servico.formaPagamento}</p>
            <p class="${statusClass}"><i class="fas fa-clock"></i> Status: ${servico.status}</p>
        </div>
        <div class="acoes-item">
            <button onclick="editarServico('${servico.id}')" class="btn-editar" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="excluirServico('${servico.id}')" class="btn-excluir" title="Excluir">
                <i class="fas fa-trash"></i>
            </button>
            ${servico.status !== 'realizado' ? `
                <button onclick="concluirServico('${servico.id}')" class="btn-concluir" title="Marcar como realizado">
                    <i class="fas fa-check"></i>
                </button>
            ` : ''}
        </div>
    `;
    return div;
}

function calcularValorServico() {
    const tipo = form.tipo.value;
    const tamanhoArea = parseFloat(form.tamanhoArea.value) || 0;
    
    if (tipo && tamanhoArea > 0) {
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

window.concluirServico = async (id) => {
    if (confirm('Confirmar conclusão do serviço?')) {
        try {
            console.log('Concluindo serviço:', id);
            
            await db.collection('servicos').doc(id).update({
                status: 'realizado',
                dataRealizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Serviço concluído com sucesso');
            await carregarServicos();
            
            // Atualizar outras páginas se necessário
            if (window.carregarResumoFinanceiro) {
                await window.carregarResumoFinanceiro();
            }
        } catch (error) {
            console.error('Erro ao concluir serviço:', error);
            alert('Erro ao concluir serviço: ' + error.message);
        }
    }
};

// Inicialização
console.log('Inicializando página de serviços...');
carregarServicos();

document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Salvando serviço...');
        
        try {
            const servico = {
                clienteId: form.cliente.value,
                clienteNome: form.cliente.options[form.cliente.selectedIndex].text,
                tipo: form.tipo.value,
                tamanhoArea: parseFloat(form.tamanhoArea.value),
                formaPagamento: form.formaPagamento.value,
                valor: parseFloat(form.valor.value),
                data: form.data.value,
                status: 'pendente',
                dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('Dados do serviço:', servico);

            if (form.dataset.id) {
                await db.collection('servicos').doc(form.dataset.id).update(servico);
            } else {
                await db.collection('servicos').add(servico);
            }

            console.log('Serviço salvo com sucesso');
            fecharModal();
            await carregarServicos();
        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
            alert('Erro ao salvar serviço: ' + error.message);
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
        if (servico) {
            form.cliente.value = servico.clienteId;
            form.tipo.value = servico.tipo;
            form.tamanhoArea.value = servico.tamanhoArea;
            form.formaPagamento.value = servico.formaPagamento;
            form.valor.value = servico.valor;
            form.data.value = servico.data;
            form.dataset.id = servico.id;
        } else {
            form.reset();
            delete form.dataset.id;
            const hoje = new Date().toISOString().split('T')[0];
            form.data.value = hoje;
        }
    }

    function fecharModal() {
        modal.style.display = 'none';
        form.reset();
    }

    async function carregarServicos() {
        try {
            console.log('Carregando serviços...');
            const snapshot = await db.collection('servicos')
                .orderBy('data', 'desc')
                .get();
            
            listaServicos.innerHTML = '';
            
            if (snapshot.empty) {
                listaServicos.innerHTML = '<p class="sem-dados">Nenhum serviço cadastrado</p>';
                return;
            }

            snapshot.forEach(doc => {
                const servico = { id: doc.id, ...doc.data() };
                const element = criarElementoServico(servico);
                listaServicos.appendChild(element);
            });
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            alert('Erro ao carregar serviços: ' + error.message);
        }
    }

    function criarElementoServico(servico) {
        const div = document.createElement('div');
        div.className = 'servico-item';
        const data = new Date(servico.data).toLocaleDateString('pt-BR');
        const statusClass = servico.status === 'realizado' ? 'status-realizado' : 'status-pendente';
        
        div.innerHTML = `
            <div class="servico-info">
                <h3>${servico.tipo}</h3>
                <p><i class="fas fa-user"></i> ${servico.clienteNome}</p>
                <p><i class="fas fa-calendar"></i> ${data}</p>
                <p><i class="fas fa-ruler"></i> ${servico.tamanhoArea} hectares</p>
                <p><i class="fas fa-money-bill-wave"></i> R$ ${servico.valor.toFixed(2)}</p>
                <p><i class="fas fa-credit-card"></i> ${servico.formaPagamento}</p>
                <p class="${statusClass}"><i class="fas fa-clock"></i> Status: ${servico.status}</p>
            </div>
            <div class="acoes-item">
                <button onclick="editarServico('${servico.id}')" class="btn-editar" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="excluirServico('${servico.id}')" class="btn-excluir" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
                ${servico.status !== 'realizado' ? `
                    <button onclick="concluirServico('${servico.id}')" class="btn-concluir" title="Marcar como realizado">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </div>
        `;
        return div;
    }

    function calcularValorServico() {
        const tipo = form.tipo.value;
        const tamanhoArea = parseFloat(form.tamanhoArea.value) || 0;
        
        if (tipo && tamanhoArea > 0) {
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

    window.concluirServico = async (id) => {
        if (confirm('Confirmar conclusão do serviço?')) {
            try {
                console.log('Concluindo serviço:', id);
                
                await db.collection('servicos').doc(id).update({
                    status: 'realizado',
                    dataRealizacao: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('Serviço concluído com sucesso');
                await carregarServicos();
                
                // Atualizar outras páginas se necessário
                if (window.carregarResumoFinanceiro) {
                    await window.carregarResumoFinanceiro();
                }
            } catch (error) {
                console.error('Erro ao concluir serviço:', error);
                alert('Erro ao concluir serviço: ' + error.message);
            }
        }
    };

    // Inicialização
    console.log('Inicializando página de serviços...');
    carregarServicos();
}); 