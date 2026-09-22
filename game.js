// Block Blast Clone
const BOARD_SIZE = 8;
const COLORS = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#fa709a', '#fee140', '#a8edea', '#fed6e3'
];

let board = [];
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;
let currentPieces = [];
let draggedPiece = null;
let draggedPieceData = null;
let comboCount = 0;

// Initialize game
function initGame() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    score = 0;
    updateScore();
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('game-over').classList.add('hidden');
    createBoard();
    generatePieces();
}

function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            cell.addEventListener('dragleave', handleDragLeave);
            
            gameBoard.appendChild(cell);
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('blockBlastHighScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }
}

// Piece definitions (tetris-like shapes)
const PIECE_SHAPES = [
    // Single block
    [[1]],
    // 2x1 line
    [[1, 1]],
    // 1x2 line
    [[1], [1]],
    // 2x2 square
    [[1, 1], [1, 1]],
    // 3x1 line
    [[1, 1, 1]],
    // 1x3 line
    [[1], [1], [1]],
    // L shape
    [[1, 0], [1, 0], [1, 1]],
    // L shape rotated
    [[1, 1, 1], [1, 0, 0]],
    // T shape
    [[1, 1, 1], [0, 1, 0]],
    // T shape rotated
    [[0, 1], [1, 1], [0, 1]],
    // Z shape
    [[1, 1, 0], [0, 1, 1]],
    // S shape
    [[0, 1, 1], [1, 1, 0]],
    // 4x1 line
    [[1, 1, 1, 1]],
    // 1x4 line
    [[1], [1], [1], [1]],
    // 3x3 plus
    [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
    // 2x3 rectangle
    [[1, 1], [1, 1], [1, 1]],
    // 3x2 rectangle
    [[1, 1, 1], [1, 1, 1]],
];

function generatePieces() {
    currentPieces = [];
    const piecesContainer = document.getElementById('pieces-container');
    piecesContainer.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const shapeIndex = Math.floor(Math.random() * PIECE_SHAPES.length);
        const shape = PIECE_SHAPES[shapeIndex];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        const piece = {
            shape: shape,
            color: color,
            index: i
        };
        
        currentPieces.push(piece);
        const pieceElement = createPieceElement(piece);
        piecesContainer.appendChild(pieceElement);
    }
    
    checkGameOver();
}

function createPieceElement(piece) {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    pieceElement.draggable = true;
    pieceElement.dataset.pieceIndex = piece.index;
    
    const pieceGrid = document.createElement('div');
    pieceGrid.className = 'piece-grid';
    pieceGrid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
    
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[0].length; col++) {
            const cell = document.createElement('div');
            cell.className = 'piece-cell';
            
            if (piece.shape[row][col] === 1) {
                cell.style.background = piece.color;
                cell.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)`;
            } else {
                cell.classList.add('empty');
            }
            
            pieceGrid.appendChild(cell);
        }
    }
    
    pieceElement.appendChild(pieceGrid);
    
    pieceElement.addEventListener('dragstart', handleDragStart);
    pieceElement.addEventListener('dragend', handleDragEnd);
    
    // Touch events for mobile
    pieceElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    pieceElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    pieceElement.addEventListener('touchend', handleTouchEnd);
    
    return pieceElement;
}

function handleDragStart(e) {
    const pieceIndex = parseInt(e.target.dataset.pieceIndex);
    draggedPiece = currentPieces[pieceIndex];
    draggedPieceData = { pieceIndex, element: e.target };
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    clearHighlights();
    draggedPiece = null;
    draggedPieceData = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedPiece) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        highlightValidPositions(row, col, draggedPiece.shape);
    }
}

function handleDragLeave(e) {
    clearHighlights();
}

function handleDrop(e) {
    e.preventDefault();
    
    if (!draggedPiece) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    
    if (canPlacePiece(row, col, draggedPiece.shape)) {
        placePiece(row, col, draggedPiece.shape, draggedPiece.color);
        removePiece(draggedPieceData.pieceIndex);
        clearAndScore();
        
        if (currentPieces.length === 0) {
            generatePieces();
        } else {
            checkGameOver();
        }
    }
    
    clearHighlights();
}

// Touch handling for mobile
let touchStartX, touchStartY;
let touchPieceElement = null;
let touchClone = null;

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchPieceElement = e.target.closest('.piece');
    
    if (!touchPieceElement) return;
    
    const pieceIndex = parseInt(touchPieceElement.dataset.pieceIndex);
    draggedPiece = currentPieces[pieceIndex];
    draggedPieceData = { pieceIndex, element: touchPieceElement };
    
    // Create a clone for dragging
    touchClone = touchPieceElement.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.zIndex = '1000';
    touchClone.style.left = touch.clientX - 50 + 'px';
    touchClone.style.top = touch.clientY - 50 + 'px';
    touchClone.classList.add('dragging');
    document.body.appendChild(touchClone);
    
    touchPieceElement.style.opacity = '0.3';
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchClone) return;
    
    const touch = e.touches[0];
    touchClone.style.left = touch.clientX - 50 + 'px';
    touchClone.style.top = touch.clientY - 50 + 'px';
    
    // Highlight valid positions
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest('.cell');
    
    if (cell && draggedPiece) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        highlightValidPositions(row, col, draggedPiece.shape);
    } else {
        clearHighlights();
    }
}

function handleTouchEnd(e) {
    if (!touchPieceElement || !touchClone) return;
    
    const touch = e.changedTouches[0];
    touchPieceElement.style.opacity = '1';
    touchClone.remove();
    touchClone = null;
    
    // Find the cell under the touch point
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest('.cell');
    
    if (cell && draggedPiece) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (canPlacePiece(row, col, draggedPiece.shape)) {
            placePiece(row, col, draggedPiece.shape, draggedPiece.color);
            removePiece(draggedPieceData.pieceIndex);
            clearAndScore();
            
            if (currentPieces.length === 0) {
                generatePieces();
            } else {
                checkGameOver();
            }
        }
    }
    
    clearHighlights();
    touchPieceElement = null;
    draggedPiece = null;
    draggedPieceData = null;
}

function canPlacePiece(startRow, startCol, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[0].length; col++) {
            if (shape[row][col] === 1) {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                
                if (boardRow >= BOARD_SIZE || boardCol >= BOARD_SIZE) {
                    return false;
                }
                
                if (board[boardRow][boardCol] !== null) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(startRow, startCol, shape, color) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[0].length; col++) {
            if (shape[row][col] === 1) {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                board[boardRow][boardCol] = color;
                
                const cell = document.querySelector(`[data-row="${boardRow}"][data-col="${boardCol}"]`);
                cell.style.background = color;
                cell.classList.add('filled');
            }
        }
    }
    
    // Score for placing (Block Blast style)
    let blockCount = 0;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[0].length; col++) {
            if (shape[row][col] === 1) blockCount++;
        }
    }
    
    // Block Blast scoring: blocks give points based on complexity
    let pieceScore = blockCount;
    if (blockCount >= 5) pieceScore = blockCount * 2;
    if (blockCount >= 8) pieceScore = blockCount * 3;
    
    score += pieceScore;
    updateScore();
}

function removePiece(pieceIndex) {
    currentPieces.splice(pieceIndex, 1);
    const piecesContainer = document.getElementById('pieces-container');
    piecesContainer.innerHTML = '';
    
    currentPieces.forEach((piece, index) => {
        piece.index = index;
        const pieceElement = createPieceElement(piece);
        piecesContainer.appendChild(pieceElement);
    });
}

function highlightValidPositions(startRow, startCol, shape) {
    clearHighlights();
    
    if (canPlacePiece(startRow, startCol, shape)) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[0].length; col++) {
                if (shape[row][col] === 1) {
                    const boardRow = startRow + row;
                    const boardCol = startCol + col;
                    const cell = document.querySelector(`[data-row="${boardRow}"][data-col="${boardCol}"]`);
                    if (cell) {
                        cell.classList.add('highlight');
                    }
                }
            }
        }
    }
}

function clearHighlights() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('highlight');
        if (!cell.classList.contains('filled')) {
            cell.style.background = '';
        }
    });
}

function clearAndScore() {
    let clearedRows = [];
    let clearedCols = [];
    
    // Check rows
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (board[row].every(cell => cell !== null)) {
            clearedRows.push(row);
        }
    }
    
    // Check columns
    for (let col = 0; col < BOARD_SIZE; col++) {
        let fullCol = true;
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (board[row][col] === null) {
                fullCol = false;
                break;
            }
        }
        if (fullCol) {
            clearedCols.push(col);
        }
    }
    
    if (clearedRows.length > 0 || clearedCols.length > 0) {
        // Animate clearing
        clearedRows.forEach(row => {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('clearing');
            }
        });
        
        clearedCols.forEach(col => {
            for (let row = 0; row < BOARD_SIZE; row++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('clearing');
            }
        });
        
        setTimeout(() => {
            // Clear board
            clearedRows.forEach(row => {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    board[row][col] = null;
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.style.background = '#2a2a2a';
                    cell.classList.remove('filled', 'clearing');
                }
            });
            
            clearedCols.forEach(col => {
                for (let row = 0; row < BOARD_SIZE; row++) {
                    board[row][col] = null;
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.style.background = '#2a2a2a';
                    cell.classList.remove('filled', 'clearing');
                }
            });
            
            // Block Blast style scoring
            const totalCleared = clearedRows.length + clearedCols.length;
            comboCount++;
            
            // Base points for each line cleared
            let clearScore = totalCleared * 10;
            
            // Combo bonuses
            if (comboCount >= 2) {
                clearScore *= 1.5; // 2x combo
            }
            if (comboCount >= 3) {
                clearScore *= 2; // 3x combo
            }
            if (totalCleared >= 3) {
                clearScore *= 1.5; // Multi-line bonus
            }
            if (totalCleared >= 5) {
                clearScore *= 2; // Super clear bonus
            }
            
            score += Math.floor(clearScore);
            
            // Show combo text
            if (comboCount >= 2 || totalCleared >= 2) {
                showComboText(comboCount, totalCleared);
            }
            
            updateScore();
        }, 400);
    } else {
        comboCount = 0; // Reset combo if no lines cleared
    }
}

function showComboText(combo, lines) {
    const comboDisplay = document.createElement('div');
    comboDisplay.className = 'combo-display';
    
    if (combo >= 3) {
        comboDisplay.textContent = `${combo}x COMBO!`;
    } else if (lines >= 3) {
        comboDisplay.textContent = `${lines} LINES!`;
    } else if (combo >= 2) {
        comboDisplay.textContent = `${combo}x COMBO!`;
    } else {
        comboDisplay.textContent = 'NICE!';
    }
    
    document.body.appendChild(comboDisplay);
    
    setTimeout(() => {
        comboDisplay.remove();
    }, 800);
}

function checkGameOver() {
    if (currentPieces.length === 0) return;
    
    let canPlaceAny = false;
    
    for (const piece of currentPieces) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (canPlacePiece(row, col, piece.shape)) {
                    canPlaceAny = true;
                    break;
                }
            }
            if (canPlaceAny) break;
        }
        if (canPlaceAny) break;
    }
    
    if (!canPlaceAny) {
        setTimeout(() => {
            document.getElementById('final-score').textContent = score;
            document.getElementById('game-over').classList.remove('hidden');
        }, 500);
    }
}

function restartGame() {
    initGame();
}

// Start game
initGame();