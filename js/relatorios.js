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
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}

const db = firebase.firestore();

// Elementos do DOM
const selectPeriodo = document.getElementById('periodo');
const spanTotalEntradas = document.getElementById('total-entradas');
const spanTotalSaidas = document.getElementById('total-saidas');
const spanLucro = document.getElementById('lucro');
const spanQtdServicos = document.getElementById('qtd-servicos');
const spanQtdSaidas = document.getElementById('qtd-saidas');
const listaServicosRealizados = document.getElementById('lista-servicos-realizados');
const listaSaidas = document.getElementById('lista-saidas');

// Event Listeners
selectPeriodo.addEventListener('change', () => {
    carregarRelatorio();
});

// Funções
async function carregarRelatorio() {
    try {
        console.log('Iniciando carregamento do relatório');
        const dias = parseInt(selectPeriodo.value);
        const dataInicial = new Date();
        dataInicial.setDate(dataInicial.getDate() - dias);
        const dataInicialStr = dataInicial.toISOString().split('T')[0];
        
        console.log('Consultando serviços a partir de:', dataInicialStr);

        // Carregar serviços realizados
        const servicosSnapshot = await db.collection('servicos')
            .where('status', '==', 'realizado')
            .get();
        
        // Carregar saídas
        const saidasSnapshot = await db.collection('saidas')
            .get();
        
        // Calcular totais
        let totalEntradas = 0;
        let totalSaidas = 0;
        
        const servicos = [];
        servicosSnapshot.forEach(doc => {
            const servico = { id: doc.id, ...doc.data() };
            // Filtrar pela data após obter os dados
            if (servico.data >= dataInicialStr) {
                servicos.push(servico);
                totalEntradas += parseFloat(servico.valor) || 0;
            }
        });
        
        const saidas = [];
        saidasSnapshot.forEach(doc => {
            const saida = { id: doc.id, ...doc.data() };
            // Filtrar pela data após obter os dados
            if (saida.data >= dataInicialStr) {
                saidas.push(saida);
                totalSaidas += parseFloat(saida.valor) || 0;
            }
        });
        
        console.log('Serviços encontrados:', servicos.length);
        console.log('Saídas encontradas:', saidas.length);

        // Atualizar os totais na tela
        spanTotalEntradas.textContent = totalEntradas.toFixed(2);
        spanTotalSaidas.textContent = totalSaidas.toFixed(2);
        spanLucro.textContent = (totalEntradas - totalSaidas).toFixed(2);
        spanQtdServicos.textContent = servicos.length;
        spanQtdSaidas.textContent = saidas.length;
        
        // Atualizar as listas
        atualizarListaServicos(servicos);
        atualizarListaSaidas(saidas);
        
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        alert('Erro ao carregar relatório: ' + error.message);
    }
}

function atualizarListaServicos(servicos) {
    listaServicosRealizados.innerHTML = '';
    
    if (servicos.length === 0) {
        listaServicosRealizados.innerHTML = '<p class="sem-dados">Nenhum serviço realizado no período</p>';
        return;
    }
    
    servicos.forEach(servico => {
        const div = document.createElement('div');
        div.className = 'item-relatorio';
        const data = new Date(servico.data).toLocaleDateString();
        
        div.innerHTML = `
            <h3>${servico.tipo}</h3>
            <p><i class="fas fa-user"></i> ${servico.clienteNome}</p>
            <p><i class="fas fa-calendar"></i> ${data}</p>
            <p><i class="fas fa-ruler-combined"></i> ${servico.tamanhoArea} hectares</p>
            <p><i class="fas fa-dollar-sign"></i> R$ ${servico.valor.toFixed(2)}</p>
            <p><i class="fas fa-credit-card"></i> ${servico.formaPagamento}</p>
        `;
        
        listaServicosRealizados.appendChild(div);
    });
}

function atualizarListaSaidas(saidas) {
    listaSaidas.innerHTML = '';
    
    if (saidas.length === 0) {
        listaSaidas.innerHTML = '<p class="sem-dados">Nenhuma saída registrada no período</p>';
        return;
    }
    
    saidas.forEach(saida => {
        const div = document.createElement('div');
        div.className = 'item-relatorio';
        const data = new Date(saida.data).toLocaleDateString();
        
        div.innerHTML = `
            <h3>${saida.tipo}</h3>
            <p><i class="fas fa-info-circle"></i> ${saida.descricao}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${saida.local}</p>
            <p><i class="fas fa-calendar"></i> ${data}</p>
            <p><i class="fas fa-dollar-sign"></i> R$ ${saida.valor.toFixed(2)}</p>
            <p><i class="fas fa-credit-card"></i> ${saida.formaPagamento}</p>
        `;
        
        listaSaidas.appendChild(div);
    });
}

// Inicialização
carregarRelatorio(); 