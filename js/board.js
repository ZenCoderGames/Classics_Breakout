import { BLOCK_ROW_COLORS, BLOCK_ROWS, BLOCK_START_ROW, GRID, WHITE_BLOCK } from './config.js';

export function createBoard() {
  return {
    cells: Array.from({ length: GRID.ROWS }, () =>
      Array.from({ length: GRID.COLS }, () => null),
    ),
  };
}

export function inBounds(x, y) {
  return x >= 0 && x < GRID.COLS && y >= 0 && y < GRID.ROWS;
}

export function getCell(board, x, y) {
  if (!inBounds(x, y)) return '#';
  return board.cells[y][x];
}

export function getRowBlockType(row) {
  return BLOCK_ROW_COLORS[row - BLOCK_START_ROW];
}

export function setCell(board, col, row, type) {
  if (inBounds(col, row)) {
    board.cells[row][col] = type;
  }
}

export function placeBlockRows(board) {
  for (let row = BLOCK_START_ROW; row < BLOCK_START_ROW + BLOCK_ROWS; row += 1) {
    const type = BLOCK_ROW_COLORS[row - BLOCK_START_ROW];
    for (let col = 0; col < GRID.COLS; col += 1) {
      board.cells[row][col] = type;
    }
    const whiteCol = Math.floor(Math.random() * GRID.COLS);
    board.cells[row][whiteCol] = WHITE_BLOCK;
  }
}

export function clearCell(board, x, y) {
  if (inBounds(x, y)) {
    board.cells[y][x] = null;
  }
}

export function remainingBlocks(board) {
  let count = 0;
  for (let y = 0; y < GRID.ROWS; y += 1) {
    for (let x = 0; x < GRID.COLS; x += 1) {
      if (board.cells[y][x] !== null) count += 1;
    }
  }
  return count;
}

export function normalizeBoard(board) {
  for (let y = 0; y < board.cells.length; y += 1) {
    for (let x = 0; x < board.cells[y].length; x += 1) {
      if (board.cells[y][x] === undefined) {
        board.cells[y][x] = null;
      }
    }
  }
}

export function resetBoard(board) {
  board.cells = Array.from({ length: GRID.ROWS }, () =>
    Array.from({ length: GRID.COLS }, () => null),
  );
  placeBlockRows(board);
}
