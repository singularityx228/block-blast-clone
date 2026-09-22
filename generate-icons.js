const fs = require('fs');
const { createCanvas } = require('canvas');

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw blocks
    const blockSize = size / 4;
    const colors = ['#e94560', '#4ecdc4', '#45b7d1', '#ffeaa7'];
    
    const blocks = [
        {x: 0, y: 0, color: colors[0]},
        {x: 1, y: 0, color: colors[0]},
        {x: 2, y: 1, color: colors[1]},
        {x: 3, y: 1, color: colors[1]},
        {x: 1, y: 2, color: colors[2]},
        {x: 2, y: 2, color: colors[2]},
        {x: 3, y: 3, color: colors[3]},
    ];
    
    blocks.forEach(block => {
        ctx.fillStyle = block.color;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        const padding = size * 0.05;
        const x = block.x * blockSize + padding;
        const y = block.y * blockSize + padding;
        const w = blockSize - padding * 2;
        const h = blockSize - padding * 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
    });
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon-${size}.png`, buffer);
    console.log(`Generated icon-${size}.png`);
}

// Generate icons
drawIcon(192);
drawIcon(512);