import { Board, BOX, SIZE } from './board';

const ROW_SEPARATOR = '------+-------+------';

/**
 * Renders a board the way it's usually shown in print: digits and dots
 * separated by spaces, with a heavier divider between each 3x3 box.
 */
export function printBoard(board: Board): string {
  const lines: string[] = [];
  for (let r = 0; r < SIZE; r++) {
    if (r > 0 && r % BOX === 0) {
      lines.push(ROW_SEPARATOR);
    }
    lines.push(formatRow(board[r]));
  }
  return lines.join('\n');
}

function formatRow(row: readonly number[]): string {
  const groups: string[] = [];
  for (let g = 0; g < BOX; g++) {
    const cells = row.slice(g * BOX, g * BOX + BOX).map(formatCell);
    groups.push(cells.join(' '));
  }
  return groups.join(' | ');
}

function formatCell(value: number): string {
  return value === 0 ? '.' : String(value);
}
