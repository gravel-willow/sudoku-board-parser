'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { run } = require('../dist/cli');

const PUZZLE = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
].join('\n');

const PUZZLE_LINE = PUZZLE.replace(/\n/g, '');
const EMPTY_LINE = '.'.repeat(81);

const PRINTED_PUZZLE = [
  '5 3 . | . 7 . | . . .',
  '6 . . | 1 9 5 | . . .',
  '. 9 8 | . . . | . 6 .',
  '------+-------+------',
  '8 . . | . 6 . | . . 3',
  '4 . . | 8 . 3 | . . 1',
  '7 . . | . 2 . | . . 6',
  '------+-------+------',
  '. 6 . | . . . | 2 8 .',
  '. . . | 4 1 9 | . . 5',
  '. . . | . 8 . | . 7 9',
].join('\n');

const PRINTED_SOLUTION = [
  '5 3 4 | 6 7 8 | 9 1 2',
  '6 7 2 | 1 9 5 | 3 4 8',
  '1 9 8 | 3 4 2 | 5 6 7',
  '------+-------+------',
  '8 5 9 | 7 6 1 | 4 2 3',
  '4 2 6 | 8 5 3 | 7 9 1',
  '7 1 3 | 9 2 4 | 8 5 6',
  '------+-------+------',
  '9 6 1 | 5 3 7 | 2 8 4',
  '2 8 7 | 4 1 9 | 6 3 5',
  '3 4 5 | 2 8 6 | 1 7 9',
].join('\n');

function makeIo(files, stdin = '') {
  return {
    readFile(path) {
      if (!(path in files)) throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      return files[path];
    },
    readStdin() {
      return stdin;
    },
  };
}

test('prints a puzzle read from a file', () => {
  const result = run(['a.txt'], makeIo({ 'a.txt': PUZZLE }));
  assert.deepEqual(result, { code: 0, stdout: PRINTED_PUZZLE + '\n', stderr: '' });
});

test('reads stdin when no file is given', () => {
  const result = run([], makeIo({}, PUZZLE_LINE));
  assert.equal(result.code, 0);
  assert.equal(result.stdout, PRINTED_PUZZLE + '\n');
});

test('reads stdin for a "-" argument', () => {
  const result = run(['-'], makeIo({}, PUZZLE));
  assert.equal(result.stdout, PRINTED_PUZZLE + '\n');
});

test('--solve prints the solution', () => {
  const result = run(['--solve', 'a.txt'], makeIo({ 'a.txt': PUZZLE }));
  assert.deepEqual(result, { code: 0, stdout: PRINTED_SOLUTION + '\n', stderr: '' });
});

test('--solve reports a puzzle with no solution and exits 1', () => {
  const unsolvable = '12345678.' + '........9' + '.'.repeat(63);
  const result = run(['--solve', 'a.txt'], makeIo({ 'a.txt': unsolvable }));
  assert.equal(result.code, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'a.txt: no solution\n');
});

test('--check distinguishes unique, multiple, and no solutions', () => {
  const unsolvable = '12345678.' + '........9' + '.'.repeat(63);
  const io = makeIo({ 'a.txt': PUZZLE, 'b.txt': EMPTY_LINE, 'c.txt': unsolvable });
  const result = run(['--check', 'a.txt', 'b.txt', 'c.txt'], io);
  assert.equal(result.code, 0);
  assert.equal(
    result.stdout,
    'a.txt: unique solution\nb.txt: multiple solutions\nc.txt: no solution\n'
  );
});

test('a file of 81-character lines is read as one puzzle per line', () => {
  const text = `${PUZZLE_LINE}\n\n${PUZZLE_LINE}\n`;
  const result = run(['--check', 'many.txt'], makeIo({ 'many.txt': text }));
  assert.equal(result.stdout, 'many.txt:1: unique solution\nmany.txt:2: unique solution\n');
});

test('several grids are separated and labelled', () => {
  const result = run(['a.txt', 'b.txt'], makeIo({ 'a.txt': PUZZLE, 'b.txt': PUZZLE_LINE }));
  assert.equal(result.stdout, `a.txt\n${PRINTED_PUZZLE}\n\nb.txt\n${PRINTED_PUZZLE}\n`);
});

test('a bad puzzle is reported and the others still run', () => {
  const bad = PUZZLE.replace('53..7....', '5x..7....');
  const io = makeIo({ 'bad.txt': bad, 'good.txt': PUZZLE });
  const result = run(['bad.txt', 'good.txt'], io);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, PRINTED_PUZZLE + '\n');
  assert.match(result.stderr, /^bad\.txt: row 1, column 2: invalid character "x"\n$/);
});

test('a missing file is reported and exits 1', () => {
  const result = run(['nope.txt'], makeIo({}));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^nope\.txt: ENOENT/);
});

test('an unknown option exits 2 with usage', () => {
  const result = run(['--fast'], makeIo({}));
  assert.equal(result.code, 2);
  assert.match(result.stderr, /^unknown option --fast\nusage: /);
});

test('--help prints usage and exits 0', () => {
  const result = run(['--help'], makeIo({}));
  assert.equal(result.code, 0);
  assert.match(result.stdout, /^usage: sudoku/);
});
