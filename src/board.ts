export const SIZE = 9;
export const BOX = 3;

// 0 through 9; 0 means the cell is blank.
export type Cell = number;

export type Board = Cell[][];

export class SudokuParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SudokuParseError';
  }
}

/**
 * Parses a 9x9 sudoku board from plain text: nine lines of nine characters
 * each, using '1'-'9' for filled cells and '.' or '0' for blanks. Leading
 * and trailing blank lines are ignored so a puzzle can be pasted with
 * surrounding whitespace, but a blank line inside the grid is not - it just
 * counts as a too-short row, same as any other malformed line.
 *
 * Beyond shape and character checks, this also rejects boards that already
 * break sudoku's rules: two of the same digit in a row, column, or 3x3 box.
 * It does not require the board to be solved or even solvable.
 */
export function parseBoard(input: string): Board {
  const lines = input.split(/\r\n|\n/);
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  if (lines.length !== SIZE) {
    throw new SudokuParseError(`expected ${SIZE} rows, found ${lines.length}`);
  }

  const board: Board = [];
  for (let r = 0; r < SIZE; r++) {
    const line = lines[r];
    if (line.length !== SIZE) {
      throw new SudokuParseError(
        `row ${r + 1} has ${line.length} characters, expected ${SIZE}`
      );
    }
    const row: Cell[] = [];
    for (let c = 0; c < SIZE; c++) {
      const ch = line[c];
      if (ch === '.' || ch === '0') {
        row.push(0);
      } else if (ch >= '1' && ch <= '9') {
        row.push(ch.charCodeAt(0) - '0'.charCodeAt(0));
      } else {
        throw new SudokuParseError(
          `row ${r + 1}, column ${c + 1}: invalid character ${JSON.stringify(ch)}`
        );
      }
    }
    board.push(row);
  }

  checkForConflicts(board);
  return board;
}

function checkForConflicts(board: Board): void {
  for (let r = 0; r < SIZE; r++) {
    checkGroupForDuplicates(board[r], `row ${r + 1}`);
  }
  for (let c = 0; c < SIZE; c++) {
    const column = board.map((row) => row[c]);
    checkGroupForDuplicates(column, `column ${c + 1}`);
  }
  for (let boxRow = 0; boxRow < BOX; boxRow++) {
    for (let boxCol = 0; boxCol < BOX; boxCol++) {
      const cells: Cell[] = [];
      for (let r = boxRow * BOX; r < boxRow * BOX + BOX; r++) {
        for (let c = boxCol * BOX; c < boxCol * BOX + BOX; c++) {
          cells.push(board[r][c]);
        }
      }
      checkGroupForDuplicates(cells, `box (${boxRow + 1}, ${boxCol + 1})`);
    }
  }
}

function checkGroupForDuplicates(cells: readonly Cell[], label: string): void {
  const seen = new Set<number>();
  for (const value of cells) {
    if (value === 0) continue;
    if (seen.has(value)) {
      throw new SudokuParseError(`duplicate value ${value} in ${label}`);
    }
    seen.add(value);
  }
}
