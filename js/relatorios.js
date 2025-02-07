document.addEventListener('DOMContentLoaded', () => {
    // Remover toda a configuração do Firebase daqui, pois já está no auth.js
    const db = firebase.firestore();
    console.log('Inicializando página de relatórios...');

    async function carregarRelatorios() {
        try {
            const periodo = document.getElementById('periodo').value;
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
            dataLimite.setHours(0, 0, 0, 0);

            const dataLimiteStr = dataLimite.toISOString().split('T')[0];
            const hojeStr = hoje.toISOString().split('T')[0];

            console.log('Buscando dados entre:', dataLimiteStr, 'e', hojeStr);

            // Carregar serviços realizados
            const servicosSnapshot = await db.collection('servicos')
                .where('status', '==', 'realizado')
                .where('data', '>=', dataLimiteStr)
                .where('data', '<=', hojeStr)
                .get();

            // Carregar saídas
            const saidasSnapshot = await db.collection('saidas')
                .where('data', '>=', dataLimiteStr)
                .where('data', '<=', hojeStr)
                .get();

            // Calcular totais
            let totalEntradas = 0;
            let totalSaidas = 0;

            servicosSnapshot.forEach(doc => {
                const servico = doc.data();
                totalEntradas += Number(servico.valor) || 0;
            });

            saidasSnapshot.forEach(doc => {
                const saida = doc.data();
                totalSaidas += Number(saida.valor) || 0;
            });

            const lucro = totalEntradas - totalSaidas;
            const margemLucro = totalEntradas > 0 ? ((lucro / totalEntradas) * 100).toFixed(2) : 0;

            // Atualizar interface
            document.getElementById('total-entradas').textContent = totalEntradas.toFixed(2);
            document.getElementById('total-saidas').textContent = totalSaidas.toFixed(2);
            document.getElementById('lucro').textContent = lucro.toFixed(2);
            document.getElementById('qtd-servicos').textContent = servicosSnapshot.size;
            document.getElementById('qtd-saidas').textContent = saidasSnapshot.size;
            document.getElementById('margem-lucro').textContent = margemLucro;
            document.getElementById('periodo-atual').textContent = getPeriodoTexto(periodo);

            // Atualizar listas
            await atualizarListaServicos(servicosSnapshot);
            await atualizarListaSaidas(saidasSnapshot);

        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            if (error.code === 'failed-precondition') {
                alert('É necessário criar um índice para esta consulta. Por favor, aguarde alguns minutos.');
            } else {
                alert('Erro ao carregar relatórios: ' + error.message);
            }
        }
    }

    function getPeriodoTexto(periodo) {
        const periodos = {
            '7': 'Últimos 7 dias',
            '30': 'Últimos 30 dias',
            '90': 'Últimos 90 dias',
            '365': 'Último ano'
        };
        return periodos[periodo] || 'Período selecionado';
    }

    async function atualizarListaServicos(snapshot) {
        const container = document.getElementById('lista-servicos-realizados');
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p class="sem-dados">Nenhum serviço realizado no período</p>';
            return;
        }

        snapshot.forEach(doc => {
            const servico = doc.data();
            const data = new Date(servico.data).toLocaleDateString('pt-BR');
            
            const element = document.createElement('div');
            element.className = 'item-relatorio';
            element.innerHTML = `
                <div class="item-info">
                    <h3>${servico.tipo}</h3>
                    <p><i class="fas fa-user"></i> ${servico.clienteNome}</p>
                    <p><i class="fas fa-calendar"></i> ${data}</p>
                    <p><i class="fas fa-ruler"></i> ${servico.tamanhoArea} hectares</p>
                    <p><i class="fas fa-money-bill-wave"></i> R$ ${servico.valor.toFixed(2)}</p>
                </div>
            `;
            container.appendChild(element);
        });
    }

    async function atualizarListaSaidas(snapshot) {
        const container = document.getElementById('lista-saidas');
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p class="sem-dados">Nenhuma saída registrada no período</p>';
            return;
        }

        snapshot.forEach(doc => {
            const saida = doc.data();
            const data = new Date(saida.data).toLocaleDateString('pt-BR');
            
            const element = document.createElement('div');
            element.className = 'item-relatorio';
            element.innerHTML = `
                <div class="item-info">
                    <h3>${saida.tipo}</h3>
                    <p><i class="fas fa-info-circle"></i> ${saida.descricao}</p>
                    <p><i class="fas fa-calendar"></i> ${data}</p>
                    <p><i class="fas fa-money-bill-wave"></i> R$ ${saida.valor.toFixed(2)}</p>
                    <p><i class="fas fa-credit-card"></i> ${saida.formaPagamento}</p>
                    ${saida.parcelado ? `
                        <p><i class="fas fa-clock"></i> Parcela ${saida.numParcela}/${saida.totalParcelas}</p>
                    ` : ''}
                </div>
            `;
            container.appendChild(element);
        });
    }

    // Expor função para outros módulos
    window.carregarRelatorios = carregarRelatorios;

    // Inicializar
    carregarRelatorios();
}); 