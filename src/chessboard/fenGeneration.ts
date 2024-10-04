import { PieceColor, PieceType } from './types';

function mapPieceTypeToFEN(pieceType: PieceType, color: PieceColor): string {
  const mapping: Record<PieceType, string> = {
    'k': color === 'red' ? 'K' : 'k',
    'a': color === 'red' ? 'A' : 'a',
    'b': color === 'red' ? 'B' : 'b',
    'n': color === 'red' ? 'N' : 'n',
    'r': color === 'red' ? 'R' : 'r',
    'c': color === 'red' ? 'C' : 'c',
    'p': color === 'red' ? 'P' : 'p',
    "none": ""
  };
  return mapping[pieceType];
}

export function generateFenFromPieces(pieceLayout: string[][], nextMoveColor: PieceColor = 'red'): string {
  const fenRows: string[] = [];

  for (const row of pieceLayout) {
    let emptyCount = 0;
    let fenRow = "";

    for (const piece of row) {
      if (piece === 'none') {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRow += emptyCount.toString();
          emptyCount = 0;
        }
        const [color, type] = piece.split('_') as [PieceColor, PieceType];
        fenRow += mapPieceTypeToFEN(type, color);
      }
    }

    if (emptyCount > 0) {
      fenRow += emptyCount.toString();
    }

    fenRows.push(fenRow);
    console.log(`FEN row: ${fenRow}`);
  }

  const fenString = fenRows.join('/');
  const nextMove = nextMoveColor === 'red' ? 'w' : 'b';
  const fullFenString = `${fenString} ${nextMove} - - 0 1`;
  console.log(`Generated FEN: ${fullFenString}`);

  return fullFenString;
}