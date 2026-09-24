import { Board, BOX, Cell, SIZE } from './board';

/**
 * Finds a solution for a board using plain backtracking: fill the first
 * blank cell with each candidate digit in turn, recurse, and undo when a
 * branch dead-ends. Returns a new solved board, or null if the board has
 * no solution. The input board is not modified.
 *
 * This assumes the board is already internally consistent (no repeated
 * digit in a row, column, or box) - which is what parseBoard guarantees.
 * Passing a board that already breaks that rule will just fail to solve.
 */
export function solveBoard(board: Board): Board | null {
  const working = board.map((row) => row.slice());
  return solve(working) ? working : null;
}

function solve(board: Board): boolean {
  const cell = findBlankCell(board);
  if (!cell) return true;
  const [r, c] = cell;

  for (let value = 1; value <= SIZE; value++) {
    if (canPlace(board, r, c, value)) {
      board[r][c] = value;
      if (solve(board)) return true;
      board[r][c] = 0;
    }
  }
  return false;
}

function findBlankCell(board: Board): [number, number] | null {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return [r, c];
    }
  }
  return null;
}

function canPlace(board: Board, r: number, c: number, value: Cell): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (board[r][i] === value || board[i][c] === value) return false;
  }

  const boxRow = Math.floor(r / BOX) * BOX;
  const boxCol = Math.floor(c / BOX) * BOX;
  for (let rr = boxRow; rr < boxRow + BOX; rr++) {
    for (let cc = boxCol; cc < boxCol + BOX; cc++) {
      if (board[rr][cc] === value) return false;
    }
  }

  return true;
}
