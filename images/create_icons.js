// Vamos criar os ícones nas dimensões necessárias:
// - icon-192x192.png (192x192 pixels)
// - icon-512x512.png (512x512 pixels)
// - favicon.ico (32x32 pixels)
// - apple-touch-icon.png (180x180 pixels)

// Ícones necessários:
// icon-192x192.png - Para dispositivos Android e ícone padrão PWA
// icon-512x512.png - Para splash screen e ícones de alta resolução
// favicon.ico - Para a aba do navegador (32x32)
// apple-touch-icon.png - Para dispositivos iOS (180x180) 

const fs = require('fs');
const { createCanvas } = require('canvas');

// Criar pasta images se não existir
if (!fs.existsSync('../images')) {
    fs.mkdirSync('../images');
}

// Criar canvas para o favicon (32x32 pixels)
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Desenhar um círculo verde (cor do sistema)
ctx.beginPath();
ctx.arc(16, 16, 14, 0, Math.PI * 2);
ctx.fillStyle = '#2ecc71';
ctx.fill();

// Desenhar as letras "MR" em branco
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 14px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('MR', 16, 16);

// Salvar como favicon.ico
const buffer = canvas.toBuffer('image/x-icon');
fs.writeFileSync('../images/favicon.ico', buffer);

// Também vamos criar os outros ícones necessários
const sizes = [192, 512];
sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Desenhar círculo verde
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2-2, 0, Math.PI * 2);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();

    // Desenhar texto "MR"
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size/4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MR', size/2, size/2);

    // Salvar como PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`../images/icon-${size}x${size}.png`, buffer);
});

console.log('Ícones criados com sucesso!'); 