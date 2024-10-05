import { PieceColor, PieceName, PieceType } from './types';

const pieceTypeToChineseChar: Record<PieceName, string> = {
  'red_king': '帥', 'red_guard': '仕', 'red_bishop': '相', 'red_knight': '傌', 'red_rook': '俥', 'red_cannon': '炮', 'red_pawn': '兵',
  'black_king': '将', 'black_guard': '士', 'black_bishop': '象', 'black_knight': '馬', 'black_rook': '車', 'black_cannon': '炮', 'black_pawn': '卒',
};

export function createOverlayImage(
  originalImage: HTMLImageElement,
  chessboardRect: { x: number, y: number, width: number, height: number },
  detectedPieces: { position: [number, number], color: PieceColor, type: PieceType }[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(chessboardRect.x, chessboardRect.y, chessboardRect.width, chessboardRect.height);

  const cellWidth = chessboardRect.width / 9;
  const cellHeight = chessboardRect.height / 10;

  detectedPieces.forEach((piece) => {
    const [row, col] = piece.position;
    const x = chessboardRect.x + col * cellWidth;
    const y = chessboardRect.y + row * cellHeight;

    ctx.strokeStyle = piece.color === 'red' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellWidth, cellHeight);

    if (piece.type && piece.type !== 'none') {
      const pieceName = `${piece.color}_${pieceTypeToFullName(piece.type)}` as PieceName;
      const chineseChar = pieceTypeToChineseChar[pieceName] || '';
      ctx.fillStyle = piece.color === 'red' ? 'rgba(255, 50, 50, 0.9)' : 'rgba(50, 50, 50, 0.9)';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(chineseChar, x + cellWidth - 5, y + cellHeight - 5);
    }
  });

  return canvas;
}

function pieceTypeToFullName(type: PieceType): string {
  const typeMap: Record<PieceType, string> = {
    'k': 'king',
    'a': 'guard',
    'b': 'bishop',
    'n': 'knight',
    'r': 'rook',
    'c': 'cannon',
    'p': 'pawn',
    'none': 'none'
  };
  return typeMap[type];
}