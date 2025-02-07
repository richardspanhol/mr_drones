// Elementos do DOM
const form = document.getElementById('form-calculadora');
const resultado = document.getElementById('resultado');
const valorTotal = document.getElementById('valor-total');
const tipoServico = document.getElementById('tipo-servico');

// Configurações de preços por hectare
const PRECOS_SERVICOS = {
    pulverizacao: 120,
    mapeamento: 90,
    plantacao: 100
};

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    calcularServico();
});

// Funções
function calcularServico() {
    const tipo = form.querySelector('#tipo-servico').value;
    const tamanho = parseFloat(form.querySelector('#tamanho').value) || 0;
    
    if (!tipo || tamanho <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    let resultado;
    if (tipo === 'alqueires') {
        // Converter alqueires para hectares (1 alqueire = 2.42 hectares)
        const hectares = tamanho * 2.48;
        resultado = `${hectares.toFixed(2)} hectares`;
    } else {
        // Cálculo normal para outros serviços
        const total = PRECOS_SERVICOS[tipo] * tamanho;
        resultado = `R$ ${total.toFixed(2)}`;
    }

    valorTotal.textContent = resultado;
    document.getElementById('resultado').style.display = 'block';
}

// Atualizar o label do tamanho conforme o tipo selecionado
tipoServico.addEventListener('change', () => {
    const labelTamanho = document.querySelector('label[for="tamanho"]');
    if (tipoServico.value === 'alqueires') {
        labelTamanho.textContent = 'Tamanho (Alqueires)';
    } else {
        labelTamanho.textContent = 'Tamanho (Hectares)';
    }
}); 