// Block Blast Clone
const BOARD_SIZE = 8;
const COLORS = [
    '#e94560', '#ff6b6b', '#4ecdc4', '#45b7d1', 
    '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8'
];

let board = [];
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;
let currentPieces = [];
let draggedPiece = null;
let draggedPieceData = null;

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
                cell.style.boxShadow = `inset 0 2px 4px rgba(255,255,255,0.3)`;
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

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchPieceElement = e.target.closest('.piece');
    
    const pieceIndex = parseInt(touchPieceElement.dataset.pieceIndex);
    draggedPiece = currentPieces[pieceIndex];
    draggedPieceData = { pieceIndex, element: touchPieceElement };
    touchPieceElement.classList.add('dragging');
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchPieceElement) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    touchPieceElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.2)`;
}

function handleTouchEnd(e) {
    if (!touchPieceElement) return;
    
    const touch = e.changedTouches[0];
    touchPieceElement.style.transform = '';
    touchPieceElement.classList.remove('dragging');
    
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
    
    // Score for placing
    let blockCount = 0;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[0].length; col++) {
            if (shape[row][col] === 1) blockCount++;
        }
    }
    score += blockCount;
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
                        cell.style.background = 'rgba(255, 255, 255, 0.3)';
                    }
                }
            }
        }
    }
}

function clearHighlights() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (!cell.classList.contains('filled')) {
            cell.style.background = 'rgba(255,255,255,0.05)';
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
                    cell.style.background = 'rgba(255,255,255,0.05)';
                    cell.classList.remove('filled', 'clearing');
                }
            });
            
            clearedCols.forEach(col => {
                for (let row = 0; row < BOARD_SIZE; row++) {
                    board[row][col] = null;
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.style.background = 'rgba(255,255,255,0.05)';
                    cell.classList.remove('filled', 'clearing');
                }
            });
            
            // Score
            const totalCleared = clearedRows.length + clearedCols.length;
            score += totalCleared * 10;
            if (totalCleared > 1) {
                score += (totalCleared - 1) * 5; // Bonus for multiple clears
            }
            updateScore();
        }, 300);
    }
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