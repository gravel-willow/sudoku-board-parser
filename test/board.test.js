'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBoard, SudokuParseError } = require('../dist/board');
const { printBoard } = require('../dist/print');

const BLANK_ROW = '.'.repeat(9);
const EMPTY_BOARD = Array(9).fill(BLANK_ROW).join('\n');

// A well-known completed sudoku grid, and the puzzle it was set from.
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

const DUPLICATE_IN_ROW = ['11.......', ...Array(8).fill(BLANK_ROW)].join('\n');

const DUPLICATE_IN_COLUMN = [
  '1........',
  '1........',
  ...Array(7).fill(BLANK_ROW),
].join('\n');

// Same digit, different row and column, but the same top-left 3x3 box -
// only the box check should catch this one.
const DUPLICATE_IN_BOX = [
  '1........',
  '.1.......',
  ...Array(7).fill(BLANK_ROW),
].join('\n');

const SHORT_ROW = [...Array(8).fill(BLANK_ROW), '12345678'].join('\n');

const INVALID_CHARACTER = [...Array(8).fill(BLANK_ROW), 'abcdefghi'].join('\n');

// A blank line inside the grid is not the same as surrounding whitespace -
// it just counts as a short row.
const BLANK_LINE_IN_MIDDLE = [
  BLANK_ROW,
  BLANK_ROW,
  BLANK_ROW,
  '',
  BLANK_ROW,
  BLANK_ROW,
  BLANK_ROW,
  BLANK_ROW,
  BLANK_ROW,
].join('\n');

test('parseBoard accepts well-formed boards', async (t) => {
  const cases = [
    {
      name: 'a fully solved board',
      input: SOLVED,
      expectedRow0: [5, 3, 4, 6, 7, 8, 9, 1, 2],
    },
    {
      name: 'blanks written as dots',
      input: PUZZLE,
      expectedRow0: [5, 3, 0, 0, 7, 0, 0, 0, 0],
    },
    {
      name: 'blanks written as zeros',
      input: PUZZLE.replace(/\./g, '0'),
      expectedRow0: [5, 3, 0, 0, 7, 0, 0, 0, 0],
    },
    {
      name: 'a fully empty board',
      input: EMPTY_BOARD,
      expectedRow0: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: 'windows line endings',
      input: SOLVED.replace(/\n/g, '\r\n'),
      expectedRow0: [5, 3, 4, 6, 7, 8, 9, 1, 2],
    },
    {
      name: 'blank lines surrounding the grid are trimmed',
      input: `\n\n${SOLVED}\n\n`,
      expectedRow0: [5, 3, 4, 6, 7, 8, 9, 1, 2],
    },
    {
      name: 'single-line 81-character format',
      input: PUZZLE.replace(/\n/g, ''),
      expectedRow0: [5, 3, 0, 0, 7, 0, 0, 0, 0],
    },
    {
      name: 'single-line format with surrounding whitespace',
      input: `  ${SOLVED.replace(/\n/g, '')}\n`,
      expectedRow0: [5, 3, 4, 6, 7, 8, 9, 1, 2],
    },
    {
      name: 'single-line format using zeros for blanks',
      input: PUZZLE.replace(/\n/g, '').replace(/\./g, '0'),
      expectedRow0: [5, 3, 0, 0, 7, 0, 0, 0, 0],
    },
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, () => {
      const board = parseBoard(testCase.input);
      assert.deepEqual(board[0], testCase.expectedRow0);
      assert.equal(board.length, 9);
    });
  }
});

test('parseBoard rejects malformed or conflicting boards', async (t) => {
  const cases = [
    {
      name: 'too few rows',
      input: Array(8).fill(BLANK_ROW).join('\n'),
      messageIncludes: 'expected 9 rows, found 8',
    },
    {
      name: 'too many rows',
      input: Array(10).fill(BLANK_ROW).join('\n'),
      messageIncludes: 'expected 9 rows, found 10',
    },
    {
      name: 'a row that is too short',
      input: SHORT_ROW,
      messageIncludes: 'row 9 has 8 characters',
    },
    {
      name: 'a blank line inside the grid is treated as a short row',
      input: BLANK_LINE_IN_MIDDLE,
      messageIncludes: 'row 4 has 0 characters',
    },
    {
      name: 'a letter is not a valid cell value',
      input: INVALID_CHARACTER,
      messageIncludes: 'invalid character',
    },
    {
      name: 'a repeated digit in the same row',
      input: DUPLICATE_IN_ROW,
      messageIncludes: 'duplicate value 1 in row 1',
    },
    {
      name: 'a repeated digit in the same column',
      input: DUPLICATE_IN_COLUMN,
      messageIncludes: 'duplicate value 1 in column 1',
    },
    {
      name: 'a repeated digit in the same box but different row and column',
      input: DUPLICATE_IN_BOX,
      messageIncludes: 'duplicate value 1 in box (1, 1)',
    },
    {
      name: 'a letter in an otherwise well-formed single line',
      input: `${PUZZLE.replace(/\n/g, '').slice(0, 80)}x`,
      messageIncludes: 'row 9, column 9: invalid character',
    },
    {
      name: 'a duplicate in the same row of a single line',
      input: `11${'.'.repeat(79)}`,
      messageIncludes: 'duplicate value 1 in row 1',
    },
    {
      name: 'a single line that is the wrong length falls back to row parsing',
      input: PUZZLE.replace(/\n/g, '').slice(0, 80),
      messageIncludes: 'expected 9 rows, found 1',
    },
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, () => {
      assert.throws(
        () => parseBoard(testCase.input),
        (error) => {
          assert.ok(error instanceof SudokuParseError);
          assert.ok(
            error.message.includes(testCase.messageIncludes),
            `expected message to include "${testCase.messageIncludes}", got "${error.message}"`
          );
          return true;
        }
      );
    });
  }
});

test('printBoard renders known boards', async (t) => {
  const cases = [
    {
      name: 'a fully solved board',
      input: SOLVED,
      expected: [
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
      ].join('\n'),
    },
    {
      name: 'a fully empty board',
      input: EMPTY_BOARD,
      expected: [
        '. . . | . . . | . . .',
        '. . . | . . . | . . .',
        '. . . | . . . | . . .',
        '------+-------+------',
        '. . . | . . . | . . .',
        '. . . | . . . | . . .',
        '. . . | . . . | . . .',
        '------+-------+------',
        '. . . | . . . | . . .',
        '. . . | . . . | . . .',
        '. . . | . . . | . . .',
      ].join('\n'),
    },
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, () => {
      const board = parseBoard(testCase.input);
      assert.equal(printBoard(board), testCase.expected);
    });
  }
});
