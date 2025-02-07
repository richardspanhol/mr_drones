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
    console.log('Firebase inicializado com sucesso na página inicial');
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}

const db = firebase.firestore();
console.log('Firestore inicializado na página inicial');

// Elementos do DOM
const proximosServicos = document.getElementById('proximos-servicos');
const totalEntradas = document.getElementById('total-entradas');
const totalSaidas = document.getElementById('total-saidas');

console.log('Elementos encontrados:', {
    proximosServicos: !!proximosServicos,
    totalEntradas: !!totalEntradas,
    totalSaidas: !!totalSaidas
});

async function carregarProximosServicos() {
    try {
        console.log('Iniciando carregamento dos próximos serviços');
        const hoje = new Date().toISOString().split('T')[0];
        console.log('Data de hoje:', hoje);
        
        // Carregar próximos serviços
        const servicosSnapshot = await db.collection('servicos')
            .where('status', '==', 'pendente')
            .get();

        console.log('Serviços pendentes encontrados:', servicosSnapshot.size);

        proximosServicos.innerHTML = '';

        const servicosFiltrados = [];
        servicosSnapshot.forEach(doc => {
            const servico = { id: doc.id, ...doc.data() };
            // Converter a data do serviço para o formato YYYY-MM-DD
            const dataServico = servico.data;
            console.log('Data do serviço:', dataServico, 'Data de hoje:', hoje);
            
            // Comparar as datas como strings no formato YYYY-MM-DD
            if (dataServico >= hoje) {
                console.log('Serviço incluído:', servico);
                servicosFiltrados.push(servico);
            } else {
                console.log('Serviço descartado por data antiga');
            }
        });

        console.log('Serviços filtrados:', servicosFiltrados.length);

        // Ordenar por data
        servicosFiltrados.sort((a, b) => a.data.localeCompare(b.data));
        
        // Limitar a 5 serviços
        const proximosServicosLista = servicosFiltrados.slice(0, 5);

        if (proximosServicosLista.length === 0) {
            console.log('Nenhum serviço encontrado');
            proximosServicos.innerHTML = '<p class="sem-dados">Nenhum serviço agendado</p>';
        } else {
            proximosServicosLista.forEach(servico => {
                console.log('Adicionando serviço à lista:', servico);
                const element = criarElementoServico(servico);
                proximosServicos.appendChild(element);
            });
        }

        // Carregar resumo financeiro do mês atual
        await carregarResumoFinanceiro();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function carregarResumoFinanceiro() {
    try {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        const inicioMesStr = inicioMes.toISOString().split('T')[0];
        console.log('Início do mês:', inicioMesStr);

        // Carregar todos os serviços realizados
        const servicosSnapshot = await db.collection('servicos')
            .where('status', '==', 'realizado')
            .get();

        console.log('Serviços realizados encontrados:', servicosSnapshot.size);

        // Carregar todas as saídas
        const saidasSnapshot = await db.collection('saidas')
            .get();

        console.log('Saídas encontradas:', saidasSnapshot.size);

        let somaEntradas = 0;
        let somaSaidas = 0;

        servicosSnapshot.forEach(doc => {
            const servico = doc.data();
            if (servico.data >= inicioMesStr) {
                somaEntradas += parseFloat(servico.valor) || 0;
                console.log('Adicionando entrada:', servico.valor);
            }
        });

        saidasSnapshot.forEach(doc => {
            const saida = doc.data();
            if (saida.data >= inicioMesStr) {
                somaSaidas += parseFloat(saida.valor) || 0;
                console.log('Adicionando saída:', saida.valor);
            }
        });

        console.log('Total de entradas:', somaEntradas);
        console.log('Total de saídas:', somaSaidas);

        if (totalEntradas) totalEntradas.textContent = somaEntradas.toFixed(2);
        if (totalSaidas) totalSaidas.textContent = somaSaidas.toFixed(2);

    } catch (error) {
        console.error('Erro ao carregar resumo financeiro:', error);
    }
}

function criarElementoServico(servico) {
    const div = document.createElement('div');
    div.className = 'servico-item';
    const data = new Date(servico.data).toLocaleDateString();
    
    div.innerHTML = `
        <h3>${servico.tipo}</h3>
        <p><i class="fas fa-user"></i> ${servico.clienteNome}</p>
        <p><i class="fas fa-calendar"></i> ${data}</p>
        <p><i class="fas fa-ruler-combined"></i> ${servico.tamanhoArea} hectares</p>
        <p><i class="fas fa-dollar-sign"></i> R$ ${servico.valor.toFixed(2)}</p>
    `;
    return div;
}

// Inicialização
console.log('Iniciando carregamento da página inicial');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando carregamento dos dados');
    carregarProximosServicos();
}); 