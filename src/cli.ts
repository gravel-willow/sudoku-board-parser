import { readFileSync } from 'fs';
import { parseBoard, SudokuParseError, SIZE } from './board';
import { printBoard } from './print';
import { solveBoard, countSolutions } from './solve';

export interface Io {
  readFile(path: string): string;
  readStdin(): string;
}

export interface Result {
  code: number;
  stdout: string;
  stderr: string;
}

type Mode = 'print' | 'solve' | 'check';

const USAGE = [
  'usage: sudoku [--solve | --check] [file ...]',
  '',
  'Reads puzzles from the given files, or from stdin if there are none or a',
  'file is "-". A file holding several 81-character lines is read as one',
  'puzzle per line.',
  '',
  '  --solve   print the solution instead of the puzzle',
  '  --check   report whether each puzzle has no, one, or several solutions',
  '  -h, --help',
].join('\n');

/**
 * Runs the command line tool. Takes the arguments after the program name and
 * an Io object instead of touching the filesystem directly so it can be
 * tested without real files. Exit codes: 0 if every puzzle was handled, 1 if
 * any could not be read, parsed, or solved, 2 for bad usage.
 */
export function run(args: readonly string[], io: Io): Result {
  let mode: Mode = 'print';
  const files: string[] = [];

  for (const arg of args) {
    if (arg === '-h' || arg === '--help') {
      return { code: 0, stdout: USAGE + '\n', stderr: '' };
    } else if (arg === '--solve') {
      mode = 'solve';
    } else if (arg === '--check') {
      mode = 'check';
    } else if (arg.startsWith('-') && arg !== '-') {
      return { code: 2, stdout: '', stderr: `unknown option ${arg}\n${USAGE}\n` };
    } else {
      files.push(arg);
    }
  }
  if (files.length === 0) files.push('-');

  const entries: { label: string; body: string }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const name = file === '-' ? 'stdin' : file;
    let text: string;
    try {
      text = file === '-' ? io.readStdin() : io.readFile(file);
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const puzzles = splitPuzzles(text);
    puzzles.forEach((puzzle, i) => {
      const label = puzzles.length > 1 ? `${name}:${i + 1}` : name;
      try {
        const board = parseBoard(puzzle);
        if (mode === 'check') {
          entries.push({ label, body: `${label}: ${describeSolutions(countSolutions(board, 2))}` });
        } else if (mode === 'solve') {
          const solution = solveBoard(board);
          if (solution) entries.push({ label, body: printBoard(solution) });
          else errors.push(`${label}: no solution`);
        } else {
          entries.push({ label, body: printBoard(board) });
        }
      } catch (err) {
        if (!(err instanceof SudokuParseError)) throw err;
        errors.push(`${label}: ${err.message}`);
      }
    });
  }

  // Grids need a heading to tell them apart once there is more than one;
  // check lines already carry their label.
  const headed = mode !== 'check' && entries.length > 1;
  const stdout = entries
    .map((e) => (headed ? `${e.label}\n${e.body}` : e.body))
    .join(headed ? '\n\n' : '\n');

  return {
    code: errors.length > 0 ? 1 : 0,
    stdout: stdout ? stdout + '\n' : '',
    stderr: errors.length > 0 ? errors.join('\n') + '\n' : '',
  };
}

function describeSolutions(count: number): string {
  if (count === 0) return 'no solution';
  if (count === 1) return 'unique solution';
  return 'multiple solutions';
}

// Puzzle archives store one 81-character puzzle per line. Nine-line grids
// can never look like that, so a file where every non-blank line is 81
// characters is safe to split; anything else is one puzzle for parseBoard to
// judge.
function splitPuzzles(text: string): string[] {
  const lines = text
    .split(/\r\n|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
  if (lines.length > 1 && lines.every((line) => line.length === SIZE * SIZE)) {
    return lines;
  }
  return [text];
}

if (require.main === module) {
  const result = run(process.argv.slice(2), {
    readFile: (path) => readFileSync(path, 'utf8'),
    readStdin: () => readFileSync(0, 'utf8'),
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.code;
}
