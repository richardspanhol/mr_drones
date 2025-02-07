document.addEventListener('DOMContentLoaded', async () => {
    const db = firebase.firestore();
    console.log('Inicializando página home...');

    async function carregarProximosServicos() {
        try {
            console.log('Carregando próximos serviços...');
            const hoje = new Date().toISOString().split('T')[0];
            
            const snapshot = await db.collection('servicos')
                .where('status', '==', 'pendente')
                .where('data', '>=', hoje)
                .orderBy('data', 'asc')
                .limit(5)
                .get();

            console.log('Serviços encontrados:', snapshot.size);
            
            const container = document.getElementById('proximos-servicos');
            container.innerHTML = '<p class="sem-dados">Carregando serviços...</p>';

            if (snapshot.empty) {
                container.innerHTML = '<p class="sem-dados">Nenhum serviço agendado</p>';
                return;
            }

            snapshot.forEach(doc => {
                const servico = doc.data();
                const data = new Date(servico.data);
                
                const element = document.createElement('div');
                element.className = 'servico-item';
                element.innerHTML = `
                    <div class="servico-info">
                        <h3>${servico.clienteNome}</h3>
                        <p><i class="fas fa-calendar"></i> ${data.toLocaleDateString('pt-BR')}</p>
                        <p><i class="fas fa-drone"></i> ${servico.tipo}</p>
                        <p><i class="fas fa-ruler"></i> ${servico.tamanhoArea} hectares</p>
                        <p><i class="fas fa-money-bill-wave"></i> R$ ${Number(servico.valor).toFixed(2)}</p>
                    </div>
                `;

                container.appendChild(element);
            });
        } catch (error) {
            console.error('Erro ao carregar próximos serviços:', error);
            if (error.message.includes('requires an index')) {
                document.getElementById('proximos-servicos').innerHTML = 
                    '<p class="erro">Sistema em atualização. Por favor, aguarde alguns minutos.</p>';
            } else {
                document.getElementById('proximos-servicos').innerHTML = 
                    '<p class="erro">Erro ao carregar serviços</p>';
            }
        }
    }

    async function carregarResumoFinanceiro() {
        try {
            console.log('Carregando resumo financeiro...');
            const hoje = new Date();
            const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const primeiroDiaMesStr = primeiroDiaMes.toISOString().split('T')[0];
            
            // Carregar entradas (serviços realizados)
            const servicosRef = db.collection('servicos');
            const snapshotServicos = await servicosRef
                .where('status', '==', 'realizado')
                .where('data', '>=', primeiroDiaMesStr)
                .get();

            let totalEntradas = 0;
            snapshotServicos.forEach(doc => {
                const servico = doc.data();
                totalEntradas += Number(servico.valor) || 0;
            });

            // Carregar saídas
            const saidasRef = db.collection('saidas');
            const snapshotSaidas = await saidasRef
                .where('data', '>=', primeiroDiaMesStr)
                .get();

            let totalSaidas = 0;
            snapshotSaidas.forEach(doc => {
                const saida = doc.data();
                totalSaidas += Number(saida.valor) || 0;
            });

            console.log('Totais:', { entradas: totalEntradas, saidas: totalSaidas });

            document.getElementById('total-entradas').textContent = totalEntradas.toFixed(2);
            document.getElementById('total-saidas').textContent = totalSaidas.toFixed(2);
        } catch (error) {
            console.error('Erro ao carregar resumo financeiro:', error);
        }
    }

    // Expor função para outros módulos
    window.carregarResumoFinanceiro = carregarResumoFinanceiro;

    // Inicializar
    await carregarProximosServicos();
    await carregarResumoFinanceiro();
}); 