document.addEventListener('DOMContentLoaded', () => {
    // Remover toda a configuração do Firebase daqui, pois já está no auth.js
    const db = firebase.firestore();
    console.log('Inicializando página de relatórios...');

    async function carregarDados() {
        try {
            console.log('Carregando relatórios...');
            const dias = parseInt(document.getElementById('periodo').value);
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - dias);
            const dataLimiteStr = dataLimite.toISOString().split('T')[0];

            console.log('Data limite:', dataLimiteStr);

            // Carregar serviços realizados
            const servicosRef = db.collection('servicos');
            const snapshotServicos = await servicosRef
                .where('status', '==', 'realizado')
                .orderBy('data', 'desc')
                .get();

            // Carregar saídas
            const saidasRef = db.collection('saidas');
            const snapshotSaidas = await saidasRef
                .orderBy('data', 'desc')
                .get();

            let totalEntradas = 0;
            let qtdServicos = 0;
            let totalSaidas = 0;
            let qtdSaidas = 0;

            // Processar serviços
            const listaServicos = document.getElementById('lista-servicos-realizados');
            const listaSaidas = document.getElementById('lista-saidas');
            
            // Mostrar mensagem de carregamento
            listaServicos.innerHTML = '<p class="sem-dados">Carregando serviços...</p>';
            listaSaidas.innerHTML = '<p class="sem-dados">Carregando saídas...</p>';

            const servicosRealizados = [];
            snapshotServicos.forEach(doc => {
                const servico = doc.data();
                if (servico.data >= dataLimiteStr) {
                    servicosRealizados.push({ id: doc.id, ...servico });
                    totalEntradas += Number(servico.valor) || 0;
                    qtdServicos++;
                }
            });

            if (servicosRealizados.length === 0) {
                listaServicos.innerHTML = '<p class="sem-dados">Nenhum serviço realizado no período</p>';
            } else {
                servicosRealizados.forEach(servico => {
                    const data = new Date(servico.data);
                    const element = document.createElement('div');
                    element.className = 'item-relatorio';
                    element.innerHTML = `
                        <div class="item-info">
                            <h3>${servico.tipo}</h3>
                            <p><i class="fas fa-user"></i> ${servico.clienteNome}</p>
                            <p><i class="fas fa-calendar"></i> ${data.toLocaleDateString('pt-BR')}</p>
                            <p><i class="fas fa-ruler"></i> ${servico.tamanhoArea} hectares</p>
                            <p><i class="fas fa-money-bill-wave"></i> R$ ${Number(servico.valor).toFixed(2)}</p>
                            <p><i class="fas fa-credit-card"></i> ${servico.formaPagamento}</p>
                        </div>
                    `;
                    listaServicos.appendChild(element);
                });
            }

            // Processar saídas
            const saidasPeriodo = [];
            snapshotSaidas.forEach(doc => {
                const saida = doc.data();
                if (saida.data >= dataLimiteStr) {
                    saidasPeriodo.push({ id: doc.id, ...saida });
                    totalSaidas += Number(saida.valor) || 0;
                    qtdSaidas++;
                }
            });

            if (saidasPeriodo.length === 0) {
                listaSaidas.innerHTML = '<p class="sem-dados">Nenhuma saída registrada no período</p>';
            } else {
                saidasPeriodo.forEach(saida => {
                    const data = new Date(saida.data);
                    const element = document.createElement('div');
                    element.className = 'item-relatorio';
                    element.innerHTML = `
                        <div class="item-info">
                            <h3>${saida.tipo}</h3>
                            <p><i class="fas fa-info-circle"></i> ${saida.descricao}</p>
                            <p><i class="fas fa-calendar"></i> ${data.toLocaleDateString('pt-BR')}</p>
                            <p><i class="fas fa-money-bill-wave"></i> R$ ${Number(saida.valor).toFixed(2)}</p>
                            <p><i class="fas fa-credit-card"></i> ${saida.formaPagamento}</p>
                        </div>
                    `;
                    listaSaidas.appendChild(element);
                });
            }

            // Atualizar totais
            document.getElementById('total-entradas').textContent = totalEntradas.toFixed(2);
            document.getElementById('total-saidas').textContent = totalSaidas.toFixed(2);
            document.getElementById('qtd-servicos').textContent = qtdServicos;
            document.getElementById('qtd-saidas').textContent = qtdSaidas;
            document.getElementById('lucro').textContent = (totalEntradas - totalSaidas).toFixed(2);

            console.log('Dados carregados:', {
                servicos: qtdServicos,
                saidas: qtdSaidas,
                totalEntradas,
                totalSaidas
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            if (error.message.includes('requires an index')) {
                alert('Sistema em atualização. Por favor, aguarde alguns minutos e tente novamente.');
            } else {
                alert('Erro ao carregar dados: ' + error.message);
            }
        }
    }

    // Carregar dados quando mudar o período
    document.getElementById('periodo').addEventListener('change', carregarDados);

    // Carregar dados iniciais
    carregarDados();
}); 