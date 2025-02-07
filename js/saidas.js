// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzguzTg54A5KgOH_2-UtNMSiLzUwmWlnE",
    authDomain: "mr-drones.firebaseapp.com",
    projectId: "mr-drones",
    storageBucket: "mr-drones.firebasestorage.app",
    messagingSenderId: "891587224313",
    appId: "1:891587224313:web:3cad5fc9bdcde4d1293828",
    measurementId: "G-TQE810ZR3Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos do DOM
const modal = document.getElementById('modal-saida');
const form = document.getElementById('form-saida');
const listaSaidas = document.getElementById('lista-saidas');
const btnNovaSaida = document.getElementById('nova-saida');

// Event Listeners
btnNovaSaida.addEventListener('click', () => {
    abrirModal();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saida = {
        tipo: form.tipo.value,
        descricao: form.descricao.value,
        local: form.local.value,
        data: form.data.value,
        valor: parseFloat(form.valor.value),
        formaPagamento: form.formaPagamento.value,
        dataCadastro: new Date()
    };

    try {
        if (form.dataset.id) {
            await db.collection('saidas').doc(form.dataset.id).update(saida);
        } else {
            await db.collection('saidas').add(saida);
        }
        fecharModal();
        carregarSaidas();
    } catch (error) {
        console.error('Erro ao salvar saída:', error);
        alert('Erro ao salvar saída');
    }
});

// Funções
function abrirModal(saida = null) {
    modal.style.display = 'block';
    if (saida) {
        form.tipo.value = saida.tipo;
        form.descricao.value = saida.descricao;
        form.local.value = saida.local;
        form.data.value = saida.data;
        form.valor.value = saida.valor;
        form.formaPagamento.value = saida.formaPagamento;
        form.dataset.id = saida.id;
    } else {
        form.reset();
        delete form.dataset.id;
    }
}

function fecharModal() {
    modal.style.display = 'none';
    form.reset();
}

async function carregarSaidas() {
    try {
        const snapshot = await db.collection('saidas')
            .orderBy('data', 'desc')
            .get();
        
        listaSaidas.innerHTML = '';
        
        snapshot.forEach(doc => {
            const saida = { id: doc.id, ...doc.data() };
            const element = criarElementoSaida(saida);
            listaSaidas.appendChild(element);
        });
    } catch (error) {
        console.error('Erro ao carregar saídas:', error);
        alert('Erro ao carregar saídas');
    }
}

function criarElementoSaida(saida) {
    const div = document.createElement('div');
    div.className = 'saida-item';
    const data = new Date(saida.data).toLocaleDateString();
    
    div.innerHTML = `
        <h3>${saida.tipo}</h3>
        <p><i class="fas fa-info-circle"></i> ${saida.descricao}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${saida.local}</p>
        <p><i class="fas fa-calendar"></i> ${data}</p>
        <p><i class="fas fa-dollar-sign"></i> R$ ${saida.valor.toFixed(2)}</p>
        <p><i class="fas fa-credit-card"></i> ${saida.formaPagamento}</p>
        <div class="acoes">
            <button onclick="editarSaida('${saida.id}')" class="btn-edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="excluirSaida('${saida.id}')" class="btn-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Funções globais
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;

window.editarSaida = async (id) => {
    try {
        const doc = await db.collection('saidas').doc(id).get();
        if (doc.exists) {
            const saida = { id: doc.id, ...doc.data() };
            abrirModal(saida);
        }
    } catch (error) {
        console.error('Erro ao carregar saída:', error);
        alert('Erro ao carregar saída');
    }
};

window.excluirSaida = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta saída?')) {
        try {
            await db.collection('saidas').doc(id).delete();
            carregarSaidas();
        } catch (error) {
            console.error('Erro ao excluir saída:', error);
            alert('Erro ao excluir saída');
        }
    }
};

// Inicialização
carregarSaidas(); 