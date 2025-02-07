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
    carregarClientes();
    abrirModal();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const servico = {
        clienteId: form.cliente.value,
        clienteNome: form.cliente.options[form.cliente.selectedIndex].text,
        tipo: form.tipo.value,
        tamanhoArea: parseFloat(form.tamanhoArea.value),
        formaPagamento: form.formaPagamento.value,
        valor: parseFloat(form.valor.value),
        data: form.data.value,
        status: 'pendente',
        dataCadastro: new Date()
    };

    try {
        await db.collection('servicos').add(servico);
        fecharModal();
        carregarServicos();
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        alert('Erro ao salvar serviço');
    }
});

// Funções
async function carregarClientes() {
    try {
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
        alert('Erro ao carregar clientes');
    }
}

function abrirModal(servico = null) {
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
    }
}

function fecharModal() {
    modal.style.display = 'none';
    form.reset();
}

async function carregarServicos() {
    try {
        const snapshot = await db.collection('servicos')
            .orderBy('data', 'desc')
            .get();
        
        listaServicos.innerHTML = '';
        
        snapshot.forEach(doc => {
            const servico = { id: doc.id, ...doc.data() };
            const element = criarElementoServico(servico);
            listaServicos.appendChild(element);
        });
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        alert('Erro ao carregar serviços');
    }
}

function criarElementoServico(servico) {
    const div = document.createElement('div');
    div.className = 'servico-item';
    const data = new Date(servico.data).toLocaleDateString();
    const statusClass = servico.status === 'realizado' ? 'status-realizado' : 'status-pendente';
    
    div.innerHTML = `
        <h3>${servico.tipo}</h3>
        <p><i class="fas fa-user"></i> ${servico.clienteNome}</p>
        <p><i class="fas fa-calendar"></i> ${data}</p>
        <p><i class="fas fa-ruler-combined"></i> ${servico.tamanhoArea} hectares</p>
        <p><i class="fas fa-dollar-sign"></i> R$ ${servico.valor.toFixed(2)}</p>
        <p><i class="fas fa-credit-card"></i> ${servico.formaPagamento}</p>
        <p class="${statusClass}"><i class="fas fa-clock"></i> Status: ${servico.status}</p>
        <div class="acoes">
            <button onclick="editarServico('${servico.id}')" class="btn-edit" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="excluirServico('${servico.id}')" class="btn-delete" title="Excluir">
                <i class="fas fa-trash"></i>
            </button>
            ${servico.status !== 'realizado' ? `
                <button onclick="concluirServico('${servico.id}')" class="btn-success" title="Marcar como realizado">
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
        const doc = await db.collection('servicos').doc(id).get();
        if (doc.exists) {
            const servico = { id: doc.id, ...doc.data() };
            carregarClientes();
            abrirModal(servico);
        }
    } catch (error) {
        console.error('Erro ao carregar serviço:', error);
        alert('Erro ao carregar serviço');
    }
};

window.excluirServico = async (id) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
        try {
            await db.collection('servicos').doc(id).delete();
            carregarServicos();
        } catch (error) {
            console.error('Erro ao excluir serviço:', error);
            alert('Erro ao excluir serviço');
        }
    }
};

window.concluirServico = async (id) => {
    try {
        await db.collection('servicos').doc(id).update({
            status: 'realizado',
            dataRealizacao: new Date()
        });
        carregarServicos();
    } catch (error) {
        console.error('Erro ao concluir serviço:', error);
        alert('Erro ao concluir serviço');
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const listaServicos = document.getElementById('lista-servicos');
    const modal = document.getElementById('modal-servico');
    let servicoAtual = null;

    // Carregar serviços
    function carregarServicos() {
        listaServicos.innerHTML = '';
        db.collection('servicos').get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    const servico = { id: doc.id, ...doc.data() };
                    const element = criarElementoServico(servico);
                    listaServicos.appendChild(element);
                });
            })
            .catch((error) => {
                console.error('Erro ao carregar serviços:', error);
            });
    }

    // Carregar clientes para o select
    function carregarClientesSelect() {
        const selectCliente = document.getElementById('cliente');
        selectCliente.innerHTML = '<option value="">Selecione o cliente</option>';
        
        db.collection('clientes').get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    const cliente = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = cliente.nome;
                    selectCliente.appendChild(option);
                });
            })
            .catch((error) => {
                console.error('Erro ao carregar clientes:', error);
            });
    }

    // Inicialização
    document.getElementById('novo-servico').addEventListener('click', () => {
        servicoAtual = null;
        document.getElementById('form-servico').reset();
        carregarClientesSelect();
        modal.style.display = 'block';
    });

    carregarServicos();
}); 