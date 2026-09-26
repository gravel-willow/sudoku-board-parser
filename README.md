# sudoku-board-parser

A small TypeScript library for reading and displaying sudoku boards as
plain text. It's built around two pieces: a parser that turns text into a
validated 9x9 grid, and a printer that turns a grid back into readable
text.

## Why a "validating" parser

Sudoku puzzles show up as plain text everywhere - forum posts, puzzle
archives, scraped datasets - and that text is often slightly wrong: a row
missing a character, a stray letter, a puzzle that's already broken
because two 9s ended up in the same box. `parseBoard` treats all of that
as a parse error with a specific, useful message, rather than silently
producing a bad grid or throwing something generic like "undefined is not
a function" three calls later.

It checks:

- the input is exactly 9 rows of 9 characters each
- every character is `1`-`9`, `.` (blank), or `0` (also blank)
- no digit appears twice in the same row, column, or 3x3 box

It does **not** check that the puzzle is solvable or has a unique
solution - that's a different problem, left for later.

## Board format

```
53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79
```

Nine lines, nine characters each. `.` and `0` are both accepted for
blanks so you can paste puzzles from either convention. Leading and
trailing blank lines are stripped (so you can paste a puzzle with some
whitespace around it), but a blank line *inside* the grid is not special -
it's just a row with zero characters, which is a parse error.

`parseBoard` also accepts the single-line 81-character format used by most
puzzle archives, where a puzzle is one row per file and rows are read left
to right:

```
53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79
```

Which format is used is detected automatically: if the input, after
trimming surrounding whitespace, is 81 characters with no line break, it's
read as a single line; otherwise it's read as nine lines of nine.

## Usage

```ts
import { parseBoard, SudokuParseError } from './src/board';
import { printBoard } from './src/print';

const text = `
53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79
`;

try {
  const board = parseBoard(text);
  console.log(printBoard(board));
} catch (err) {
  if (err instanceof SudokuParseError) {
    console.error(`bad puzzle: ${err.message}`);
  } else {
    throw err;
  }
}
```

`printBoard` output:

```
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
```

A `Board` is just `number[][]`, 9 rows of 9 cells, where `0` means blank.
There's no special type wrapper - it's meant to be easy to pass into
whatever you write next (a solver, a difficulty scorer, a renderer).

## Solving

```ts
import { solveBoard } from './src/solve';

const solution = solveBoard(board);
if (solution) {
  console.log(printBoard(solution));
} else {
  console.log('no solution');
}
```

`solveBoard` fills in the blanks with plain backtracking and returns a new
board, leaving the one you passed in untouched. It returns `null` if the
board has no solution. It doesn't check for more than one solution - a
puzzle with several valid completions just gets the first one backtracking
finds.

For that, there's `hasUniqueSolution`:

```ts
import { hasUniqueSolution, countSolutions } from './src/solve';

if (!hasUniqueSolution(board)) {
  console.log('not a well-posed puzzle');
}
```

`hasUniqueSolution` returns `false` for both "no solution" and "more than
one solution" - it answers "is this puzzle sound", not "is this puzzle
solvable". It's built on `countSolutions(board, limit = 2)`, which counts
distinct solutions but stops searching as soon as it hits `limit`, so
checking uniqueness doesn't cost anywhere near what enumerating every
solution to a wide-open board would.

## Building and testing

This is a zero-dependency project - no packages to install. It compiles
with the TypeScript compiler and tests with Node's built-in test runner:

```
npm run build
npm test
```

`npm test` runs the build first, then executes `test/board.test.js`
against the compiled output in `dist/`. The suite is table-driven: each
test is a list of `{ name, input, expected }` entries, which makes it
cheap to add the next awkward case (a new malformed input, a new
conflict shape) without writing a new test function.

## Status

This is a first cut: parsing (both the nine-line and single-line 81-
character formats), validation, printing, a backtracking solver, and a
uniqueness check all work and are tested. See the project's issue tracker
or commit history for what's planned next - a CLI, and a difficulty
scoring heuristic.
