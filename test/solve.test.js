'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBoard } = require('../dist/board');
const { solveBoard, countSolutions, hasUniqueSolution } = require('../dist/solve');

const BLANK_ROW = '.'.repeat(9);
const EMPTY_BOARD = Array(9).fill(BLANK_ROW).join('\n');

const SOLVED = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
].join('\n');

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

// Row 1 already has 1-8, so its last cell needs a 9 - but its box (top
// right) already has a 9 from row 2. No digit fits, no backtracking needed
// to see it.
const UNSOLVABLE = [
  '12345678.',
  '........9',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
].join('\n');

function assertIsValidSolution(board, given) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (given[r][c] !== 0) {
        assert.equal(board[r][c], given[r][c], `cell (${r}, ${c}) changed from the given clue`);
      }
      assert.ok(board[r][c] >= 1 && board[r][c] <= 9, `cell (${r}, ${c}) is not a digit 1-9`);
    }
  }

  for (let i = 0; i < 9; i++) {
    assert.equal(new Set(board[i]).size, 9, `row ${i + 1} has a repeated digit`);
    assert.equal(new Set(board.map((row) => row[i])).size, 9, `column ${i + 1} has a repeated digit`);
  }

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const cells = [];
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          cells.push(board[r][c]);
        }
      }
      assert.equal(new Set(cells).size, 9, `box (${boxRow + 1}, ${boxCol + 1}) has a repeated digit`);
    }
  }
}

test('solveBoard solves a puzzle with a unique solution', () => {
  const given = parseBoard(PUZZLE);
  const solution = solveBoard(given);
  assert.ok(solution);
  assertIsValidSolution(solution, given);
});

test('solveBoard returns an already-solved board unchanged', () => {
  const given = parseBoard(SOLVED);
  const solution = solveBoard(given);
  assert.deepEqual(solution, given);
});

test('solveBoard does not modify the board it was given', () => {
  const given = parseBoard(PUZZLE);
  const copy = given.map((row) => row.slice());
  solveBoard(given);
  assert.deepEqual(given, copy);
});

test('solveBoard finds a solution for a fully empty board', () => {
  const given = parseBoard(EMPTY_BOARD);
  const solution = solveBoard(given);
  assert.ok(solution);
  assertIsValidSolution(solution, given);
});

test('solveBoard returns null for a board with no solution', () => {
  const given = parseBoard(UNSOLVABLE);
  assert.equal(solveBoard(given), null);
});

test('countSolutions counts exactly one solution for a well-posed puzzle', () => {
  const given = parseBoard(PUZZLE);
  assert.equal(countSolutions(given), 1);
  // A limit smaller than the true count still finds the single solution.
  assert.equal(countSolutions(given, 1), 1);
});

test('countSolutions returns 0 for a board with no solution', () => {
  const given = parseBoard(UNSOLVABLE);
  assert.equal(countSolutions(given), 0);
});

test('countSolutions stops at the limit instead of enumerating every solution', () => {
  const given = parseBoard(EMPTY_BOARD);
  assert.equal(countSolutions(given, 1), 1);
  assert.equal(countSolutions(given, 2), 2);
});

test('countSolutions does not modify the board it was given', () => {
  const given = parseBoard(PUZZLE);
  const copy = given.map((row) => row.slice());
  countSolutions(given);
  assert.deepEqual(given, copy);
});

test('hasUniqueSolution is true for a well-posed puzzle', () => {
  assert.equal(hasUniqueSolution(parseBoard(PUZZLE)), true);
});

test('hasUniqueSolution is true for an already-solved board', () => {
  assert.equal(hasUniqueSolution(parseBoard(SOLVED)), true);
});

test('hasUniqueSolution is false for a board with no solution', () => {
  assert.equal(hasUniqueSolution(parseBoard(UNSOLVABLE)), false);
});

test('hasUniqueSolution is false for a wide-open board with many solutions', () => {
  assert.equal(hasUniqueSolution(parseBoard(EMPTY_BOARD)), false);
});
