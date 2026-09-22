#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#1a1a2e')
    draw = ImageDraw.Draw(img)
    
    # Simple gradient effect
    for i in range(size):
        color = f'#{int(26 + i * 0.1):02x}{int(26 + i * 0.05):02x}{int(46 + i * 0.1):02x}'
        draw.line([(0, i), (size, i)], fill=color)
    
    # Draw blocks
    block_size = size // 4
    colors = ['#e94560', '#4ecdc4', '#45b7d1', '#ffeaa7']
    
    blocks = [
        (0, 0, colors[0]),
        (1, 0, colors[0]),
        (2, 1, colors[1]),
        (3, 1, colors[1]),
        (1, 2, colors[2]),
        (2, 2, colors[2]),
        (3, 3, colors[3]),
    ]
    
    padding = size // 20
    
    for bx, by, color in blocks:
        x = bx * block_size + padding
        y = by * block_size + padding
        w = block_size - padding * 2
        h = block_size - padding * 2
        
        draw.rounded_rectangle([x, y, x + w, y + h], radius=8, fill=color)
    
    # Save
    img.save(f'icon-{size}.png')
    print(f'Created icon-{size}.png')

if __name__ == '__main__':
    create_icon(192)
    create_icon(512)