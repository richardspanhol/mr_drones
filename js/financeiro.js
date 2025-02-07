document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const modal = document.getElementById('modal-ajuste');
    const form = document.getElementById('form-ajuste');
    let saldoAtual = 0;

    // Funções
    async function carregarSaldo() {
        try {
            console.log('Carregando saldo...');
            const doc = await db.collection('financeiro').doc('saldo').get();
            
            if (doc.exists) {
                saldoAtual = doc.data().valor || 0;
            } else {
                // Criar documento de saldo se não existir
                await db.collection('financeiro').doc('saldo').set({ valor: 0 });
            }

            atualizarExibicaoSaldo();
            await carregarHistoricoAjustes();
        } catch (error) {
            console.error('Erro ao carregar saldo:', error);
            alert('Erro ao carregar saldo: ' + error.message);
        }
    }

    function atualizarExibicaoSaldo() {
        document.getElementById('saldo-atual').textContent = saldoAtual.toFixed(2);
    }

    async function carregarHistoricoAjustes() {
        try {
            console.log('Carregando histórico de ajustes...');
            const snapshot = await db.collection('ajustes_saldo')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const container = document.getElementById('lista-ajustes');
            container.innerHTML = '';

            if (snapshot.empty) {
                container.innerHTML = '<p class="sem-dados">Nenhum ajuste registrado</p>';
                return;
            }

            snapshot.forEach(doc => {
                const ajuste = doc.data();
                const data = ajuste.timestamp.toDate();
                const valor = ajuste.tipo === 'entrada' ? ajuste.valor : -ajuste.valor;

                const element = document.createElement('div');
                element.className = 'item-relatorio';
                element.innerHTML = `
                    <div class="item-info">
                        <h3>${ajuste.descricao}</h3>
                        <p><i class="fas fa-calendar"></i> ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}</p>
                        <p><i class="fas fa-money-bill-wave"></i> R$ ${Math.abs(valor).toFixed(2)}</p>
                        <p><i class="fas fa-exchange-alt"></i> ${ajuste.tipo === 'entrada' ? 'Entrada' : 'Saída'}</p>
                    </div>
                `;

                container.appendChild(element);
            });
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            alert('Erro ao carregar histórico: ' + error.message);
        }
    }

    // Event Listeners
    window.abrirModalAjuste = () => {
        modal.style.display = 'block';
        form.reset();
    };

    window.fecharModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Salvando ajuste...');

        try {
            const valor = parseFloat(form.valor.value);
            const tipo = form.tipo.value;
            const descricao = form.descricao.value;

            // Atualizar saldo
            const novoSaldo = tipo === 'entrada' ? saldoAtual + valor : saldoAtual - valor;
            
            // Salvar ajuste no histórico
            await db.collection('ajustes_saldo').add({
                tipo,
                valor,
                descricao,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Atualizar saldo total
            await db.collection('financeiro').doc('saldo').set({
                valor: novoSaldo
            });

            console.log('Ajuste salvo com sucesso');
            saldoAtual = novoSaldo;
            fecharModal();
            atualizarExibicaoSaldo();
            await carregarHistoricoAjustes();
        } catch (error) {
            console.error('Erro ao salvar ajuste:', error);
            alert('Erro ao salvar ajuste: ' + error.message);
        }
    });

    // Inicialização
    console.log('Inicializando página financeira...');
    carregarSaldo();
}); 