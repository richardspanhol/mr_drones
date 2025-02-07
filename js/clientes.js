// Remova toda a parte de configuração do Firebase, pois já está no auth.js
const db = firebase.firestore();
console.log('Firestore inicializado em clientes.js');

// Elementos do DOM
const modal = document.getElementById('modal-cliente');
const form = document.getElementById('form-cliente');
const listaClientes = document.getElementById('lista-clientes');
const btnNovoCliente = document.getElementById('novo-cliente');

// Event Listeners
btnNovoCliente.addEventListener('click', () => {
    console.log('Botão novo cliente clicado');
    abrirModal();
});

// Funções
function abrirModal(cliente = null) {
    console.log('Abrindo modal', cliente);
    modal.style.display = 'block';
    if (cliente) {
        form.nome.value = cliente.nome;
        form.telefone.value = cliente.telefone;
        form.localizacao.value = cliente.localizacao;
        form.tamanhoTerra.value = cliente.tamanhoTerra;
        form.dataset.id = cliente.id;
    } else {
        form.reset();
        delete form.dataset.id;
    }
}

function fecharModal() {
    console.log('Fechando modal');
    modal.style.display = 'none';
    form.reset();
}

function renderizarCliente(doc) {
    const cliente = doc.data();
    const element = document.createElement('div');
    element.className = 'cliente-item';
    element.innerHTML = `
        <div class="cliente-header" onclick="toggleDetalhes(this)">
            <span>${cliente.nome}</span>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="cliente-detalhes">
            <p><i class="fas fa-phone"></i> ${cliente.telefone}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${cliente.localizacao}</p>
            <p><i class="fas fa-ruler-combined"></i> ${cliente.tamanhoTerra} hectares</p>
            <div class="acoes-item">
                <button onclick="editarCliente('${doc.id}')" class="btn-editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="excluirCliente('${doc.id}')" class="btn-excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    return element;
}

function toggleDetalhes(header) {
    const detalhes = header.nextElementSibling;
    detalhes.classList.toggle('ativo');
    header.querySelector('i').classList.toggle('fa-chevron-up');
}

async function carregarClientes() {
    try {
        const snapshot = await db.collection('clientes')
            .orderBy('nome')
            .get();
        
        const container = document.getElementById('lista-clientes');
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="sem-dados">Nenhum cliente cadastrado</p>';
            return;
        }

        snapshot.forEach(doc => {
            container.appendChild(renderizarCliente(doc));
        });
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        alert('Erro ao carregar clientes: ' + error.message);
    }
}

function filtrarClientes() {
    const termo = document.getElementById('pesquisaCliente').value.toLowerCase();
    const clientes = document.querySelectorAll('.cliente-item');
    
    clientes.forEach(cliente => {
        const nome = cliente.querySelector('.cliente-header span').textContent.toLowerCase();
        const telefone = cliente.querySelector('.cliente-detalhes p').textContent.toLowerCase();
        
        if (nome.includes(termo) || telefone.includes(termo)) {
            cliente.style.display = '';
        } else {
            cliente.style.display = 'none';
        }
    });
}

// Funções globais
window.editarCliente = async (id) => {
    try {
        const doc = await db.collection('clientes').doc(id).get();
        if (doc.exists) {
            const cliente = { id: doc.id, ...doc.data() };
            abrirModal(cliente);
        }
    } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        alert('Erro ao carregar cliente');
    }
};

window.excluirCliente = async (id) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            await db.collection('clientes').doc(id).delete();
            carregarClientes();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            alert('Erro ao excluir cliente');
        }
    }
};

window.abrirModal = abrirModal;
window.fecharModal = fecharModal;

function mascaraTelefone(telefone) {
    let valor = telefone.value.replace(/\D/g, ''); // Remove tudo que não é número
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2'); // Coloca hífen entre o quarto e o quinto dígitos
    telefone.value = valor;
}

window.mascaraTelefone = mascaraTelefone;

// FUNÇÕES GLOBAIS (mantenha apenas estas declarações no final do arquivo)
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.editarCliente = editarCliente;
window.excluirCliente = excluirCliente;
window.mascaraTelefone = mascaraTelefone;
window.salvarCliente = async function() {
    try {
        console.log('Iniciando salvamento do cliente');
        
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;
        const localizacao = document.getElementById('localizacao').value;
        const tamanhoTerra = parseFloat(document.getElementById('tamanhoTerra').value);

        if (!nome || !telefone || !localizacao || !tamanhoTerra) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        const cliente = {
            nome,
            telefone,
            localizacao,
            tamanhoTerra,
            dataCadastro: firebase.firestore.Timestamp.now()
        };

        console.log('Dados do cliente:', cliente);

        const form = document.getElementById('form-cliente');
        if (form.dataset.id) {
            await db.collection('clientes').doc(form.dataset.id).set(cliente);
        } else {
            await db.collection('clientes').add(cliente);
        }

        console.log('Cliente salvo com sucesso');
        fecharModal();
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar cliente: ' + error.message);
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado em clientes.js');
    carregarClientes();
});