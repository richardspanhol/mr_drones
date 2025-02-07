// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzguzTg54A5KgOH_2-UtNMSiLzUwmWlnE",
    authDomain: "mr-drones.firebaseapp.com",
    projectId: "mr-drones",
    storageBucket: "mr-drones.appspot.com",
    messagingSenderId: "891587224313",
    appId: "1:891587224313:web:3cad5fc9bdcde4d1293828"
};

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    console.log('Firebase inicializado com sucesso');
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}

const db = firebase.firestore();
console.log('Firestore inicializado');

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

async function carregarClientes() {
    try {
        const snapshot = await db.collection('clientes').get();
        listaClientes.innerHTML = '';
        
        snapshot.forEach(doc => {
            const cliente = { id: doc.id, ...doc.data() };
            const element = criarElementoCliente(cliente);
            listaClientes.appendChild(element);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        alert('Erro ao carregar clientes');
    }
}

function criarElementoCliente(cliente) {
    const div = document.createElement('div');
    div.className = 'cliente-item';
    div.innerHTML = `
        <h3>${cliente.nome}</h3>
        <p><i class="fas fa-phone"></i> ${cliente.telefone}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${cliente.localizacao}</p>
        <p><i class="fas fa-ruler-combined"></i> ${cliente.tamanhoTerra} hectares</p>
        <div class="acoes">
            <button onclick="editarCliente('${cliente.id}')" class="btn-edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="excluirCliente('${cliente.id}')" class="btn-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
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
carregarClientes();