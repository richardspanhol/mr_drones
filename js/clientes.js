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
        const snapshot = await db.collection('clientes').orderBy('nome').get();
        const container = document.getElementById('lista-clientes');
        container.innerHTML = '';

        snapshot.forEach(doc => {
            const cliente = doc.data();
            const div = document.createElement('div');
            div.className = 'cliente-item card expansivel';
            div.innerHTML = `
                <div class="card-header" onclick="toggleExpansivel(this)">
                    <h3>${cliente.nome}</h3>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="card-content" style="display: none;">
                    <div class="cliente-info">
                        <p><i class="fas fa-phone"></i> ${cliente.telefone}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${cliente.endereco}</p>
                        ${cliente.tamanhoTerra ? `<p><i class="fas fa-ruler-combined"></i> ${cliente.tamanhoTerra} hectares</p>` : ''}
                    </div>
                    <div class="cliente-acoes">
                        <button onclick="editarCliente('${doc.id}')" class="btn-editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="excluirCliente('${doc.id}')" class="btn-excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(div);
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
window.editarCliente = async function(id) {
    try {
        const doc = await db.collection('clientes').doc(id).get();
        if (doc.exists) {
            const cliente = doc.data();
            const form = document.getElementById('form-cliente');
            
            // Preencher o formulário com os dados do cliente
            form.dataset.id = id;
            document.getElementById('nome').value = cliente.nome || '';
            document.getElementById('telefone').value = cliente.telefone || '';
            document.getElementById('localizacao').value = cliente.endereco || '';
            document.getElementById('tamanhoTerra').value = cliente.tamanhoTerra || '';
            
            // Abrir o modal
            const modal = document.getElementById('modal-cliente');
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao editar cliente:', error);
        alert('Erro ao editar cliente: ' + error.message);
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
        const form = document.getElementById('form-cliente');
        const cliente = {
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            endereco: document.getElementById('localizacao').value,
            dataCadastro: new Date().toISOString()
        };

        // Adicionar tamanhoTerra apenas se for preenchido
        const tamanhoTerra = document.getElementById('tamanhoTerra').value;
        if (tamanhoTerra) {
            cliente.tamanhoTerra = parseFloat(tamanhoTerra);
        }

        if (!cliente.nome || !cliente.telefone || !cliente.endereco) {
            alert('Por favor, preencha os campos obrigatórios: Nome, Telefone e Endereço');
            return;
        }

        if (form.dataset.id) {
            await db.collection('clientes').doc(form.dataset.id).update(cliente);
        } else {
            await db.collection('clientes').add(cliente);
        }

        fecharModal();
        carregarClientes();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        alert('Erro ao salvar cliente: ' + error.message);
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (!window.db) {
        console.error('Firebase não inicializado');
        return;
    }

    // Funções do modal
    window.abrirModal = function() {
        const modal = document.getElementById('modal-cliente');
        const form = document.getElementById('form-cliente');
        form.reset();
        delete form.dataset.id;
        modal.style.display = 'block';
    };

    window.fecharModal = function() {
        const modal = document.getElementById('modal-cliente');
        modal.style.display = 'none';
    };

    // Adicionar listener ao botão novo cliente
    if (btnNovoCliente) {
        btnNovoCliente.addEventListener('click', window.abrirModal);
    }

    // Carregar clientes inicialmente
    carregarClientes();
});