document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const modal = document.getElementById('modal-saida');
    const form = document.getElementById('form-saida');
    let saidaEmEdicao = null;

    // Botão Nova Saída
    document.getElementById('nova-saida').addEventListener('click', () => {
        saidaEmEdicao = null;
        form.reset();
        form.querySelector('h2').textContent = 'Registrar Saída';
        modal.style.display = 'block';
        
        // Define a data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        form.data.value = hoje;
    });

    // Fechar Modal
    window.fecharModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // Salvar Saída
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const saida = {
            tipo: form.tipo.value,
            descricao: form.descricao.value,
            valor: parseFloat(form.valor.value),
            data: form.data.value,
            formaPagamento: form.formaPagamento.value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (saidaEmEdicao) {
                await db.collection('saidas').doc(saidaEmEdicao).update(saida);
            } else {
                await db.collection('saidas').add(saida);
            }
            
            fecharModal();
            carregarSaidas();
        } catch (error) {
            console.error('Erro ao salvar saída:', error);
            alert('Erro ao salvar saída. Tente novamente.');
        }
    });

    // Carregar Saídas
    async function carregarSaidas() {
        try {
            const snapshot = await db.collection('saidas')
                .orderBy('data', 'desc')
                .get();

            const container = document.getElementById('lista-saidas');
            container.innerHTML = '';

            if (snapshot.empty) {
                container.innerHTML = '<p class="sem-dados">Nenhuma saída registrada</p>';
                return;
            }

            snapshot.forEach(doc => {
                const saida = doc.data();
                const data = new Date(saida.data);

                const element = document.createElement('div');
                element.className = 'saida-item';
                element.innerHTML = `
                    <div class="saida-info">
                        <h3>${saida.tipo}</h3>
                        <p><i class="fas fa-info-circle"></i> ${saida.descricao}</p>
                        <p><i class="fas fa-calendar"></i> ${data.toLocaleDateString('pt-BR')}</p>
                        <p><i class="fas fa-money-bill-wave"></i> R$ ${saida.valor.toFixed(2)}</p>
                        <p><i class="fas fa-credit-card"></i> ${saida.formaPagamento}</p>
                    </div>
                    <div class="acoes-item">
                        <button onclick="editarSaida('${doc.id}')" class="btn-editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="excluirSaida('${doc.id}')" class="btn-excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                container.appendChild(element);
            });
        } catch (error) {
            console.error('Erro ao carregar saídas:', error);
            alert('Erro ao carregar saídas');
        }
    }

    // Funções globais
    window.fecharModal = fecharModal;

    window.editarSaida = async (id) => {
        try {
            const doc = await db.collection('saidas').doc(id).get();
            const saida = doc.data();

            saidaEmEdicao = id;
            form.tipo.value = saida.tipo;
            form.descricao.value = saida.descricao;
            form.valor.value = saida.valor;
            form.data.value = saida.data;
            form.formaPagamento.value = saida.formaPagamento;

            form.querySelector('h2').textContent = 'Editar Saída';
            modal.style.display = 'block';
        } catch (error) {
            console.error('Erro ao carregar saída para edição:', error);
            alert('Erro ao carregar saída para edição');
        }
    };

    window.excluirSaida = async (id) => {
        if (confirm('Tem certeza que deseja excluir esta saída?')) {
            try {
                await db.collection('saidas').doc(id).delete();
                carregarSaidas();
            } catch (error) {
                console.error('Erro ao excluir saída:', error);
                alert('Erro ao excluir saída. Tente novamente.');
            }
        }
    };

    // Carregar dados iniciais
    carregarSaidas();
}); 