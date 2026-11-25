import { describe, it, expect } from 'vitest';
import {
  updateFEN,
  moveToChineseNotation,
  generateFenFromPieces,
  parseFEN,
} from '../notationUtils';

describe('updateFEN', () => {
  it('should correctly update FEN when moving a piece', () => {
    const initialFen =
      'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
    const move = 'h2f2'; // 炮二平四
    const expectedFen =
      'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C3C3/9/RNBAKABNR b - - 0 1';

    expect(updateFEN(initialFen, move)).toBe(expectedFen);
  });

  it('should throw error for invalid FEN', () => {
    const invalidFen = 'invalid/fen/string';
    const move = 'h2f2';

    expect(() => updateFEN(invalidFen, move)).toThrow('无效的 FEN');
  });

  it('should throw error for invalid move format', () => {
    const fen =
      'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
    const invalidMove = 'h2';

    expect(() => updateFEN(fen, invalidMove)).toThrow('无效的走棋格式');
  });
});

describe('moveToChineseNotation', () => {
  it('should convert piece movement to Chinese notation', () => {
    const fen =
      'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
    const move = 'h2f2'; // 炮二平四

    const result = moveToChineseNotation(fen, move);
    expect(result).toBe('炮二平四');
  });
});

describe('generateFenFromPieces', () => {
  it('should generate correct FEN from piece layout', () => {
    const pieceLayout: string[][] = [
      [
        'black_r',
        'black_n',
        'black_b',
        'black_a',
        'black_k',
        'black_a',
        'black_b',
        'black_n',
        'black_r',
      ],
      ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
      [
        'none',
        'black_c',
        'none',
        'none',
        'none',
        'none',
        'none',
        'black_c',
        'none',
      ],
      [
        'black_p',
        'none',
        'black_p',
        'none',
        'black_p',
        'none',
        'black_p',
        'none',
        'black_p',
      ],
      ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
      ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
      [
        'red_p',
        'none',
        'red_p',
        'none',
        'red_p',
        'none',
        'red_p',
        'none',
        'red_p',
      ],
      [
        'none',
        'red_c',
        'none',
        'none',
        'none',
        'none',
        'none',
        'red_c',
        'none',
      ],
      ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
      [
        'red_r',
        'red_n',
        'red_b',
        'red_a',
        'red_k',
        'red_a',
        'red_b',
        'red_n',
        'red_r',
      ],
    ];

    const expectedFen =
      'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR';
    const result = generateFenFromPieces(pieceLayout, 'red');
    expect(result).toContain(expectedFen);
  });
});

describe('parseFEN', () => {
  it('should correctly parse FEN string into piece data array', () => {
    const fen =
      'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
    const result = parseFEN(fen);

    // 验证基本结构
    expect(result).toHaveLength(10); // 10 行
    expect(result[0]).toHaveLength(9); // 每行 9 列

    // 验证一些具体位置的棋子
    expect(result[0][0]).toEqual({ type: 'r', color: 'black' });
    expect(result[9][4]).toEqual({ type: 'k', color: 'red' });
  });

  it('should handle empty squares correctly', () => {
    const fen = '9/9/9/9/9/9/9/9/9/9 w - - 0 1';
    const result = parseFEN(fen);

    expect(result).toHaveLength(10);
    expect(result[0]).toHaveLength(9);
    expect(result[0][0]).toBeNull();
  });
});
