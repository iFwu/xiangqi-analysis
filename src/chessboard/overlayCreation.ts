import { PieceColor, PieceType } from './types';

// 棋子类型到繁体中文的映射
const pieceTypeToChineseChar: Record<PieceType, string> = {
  'k': '帥', 'g': '仕', 'b': '相', 'n': '馬', 'r': '車', 'c': '炮', 'p': '兵',
  'K': '將', 'G': '士', 'B': '象', 'N': '馬', 'R': '車', 'C': '炮', 'P': '卒',
  'none': ''
};

export function createOverlayImage(
  originalImage: HTMLImageElement,
  chessboardRect: { x: number, y: number, width: number, height: number },
  detectedPieces: { position: [number, number], color: PieceColor, type: PieceType | null }[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  const ctx = canvas.getContext('2d')!;

  // 绘制原始图像
  ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

  // 绘制棋盘范围
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(chessboardRect.x, chessboardRect.y, chessboardRect.width, chessboardRect.height);

  // 计算每个格子的大小
  const cellWidth = chessboardRect.width / 9;
  const cellHeight = chessboardRect.height / 10;

  // 绘制检测到的棋子
  detectedPieces.forEach((piece) => {
    const [row, col] = piece.position;
    const x = chessboardRect.x + col * cellWidth;
    const y = chessboardRect.y + row * cellHeight;

    // 绘制方框
    ctx.strokeStyle = piece.color === 'red' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellWidth, cellHeight);

    if (piece.type) {
      // 在方框的右下角绘制识别结果
      ctx.fillStyle = piece.color === 'red' ? 'rgba(255, 50, 50, 0.9)' : 'rgba(50, 50, 50, 0.9)';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      const chineseChar = pieceTypeToChineseChar[piece.type as PieceType] || '';
      ctx.fillText(chineseChar, x + cellWidth - 5, y + cellHeight - 5);
    }
  });

  return canvas;
}