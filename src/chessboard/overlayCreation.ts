import { PieceColor } from './types';

export function createOverlayImage(
  originalImage: HTMLImageElement,
  chessboardRect: { x: number, y: number, width: number, height: number },
  detectedPieces: { position: [number, number], color: PieceColor }[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  const ctx = canvas.getContext('2d')!;

  // 移除背景蒙层

  // 绘制棋盘范围
  ctx.strokeStyle = 'rgba(0, 255, 0, 1)';  // 使用不透明的绿色
  ctx.lineWidth = 5;  // 加粗线条
  ctx.strokeRect(chessboardRect.x, chessboardRect.y, chessboardRect.width, chessboardRect.height);

  // 计算每个格子的大小
  const cellWidth = chessboardRect.width / 9;
  const cellHeight = chessboardRect.height / 10;

  // 绘制检测到的棋子
  detectedPieces.forEach(piece => {
    console.log(piece);
    const [row, col] = piece.position;
    const x = chessboardRect.x + col * cellWidth;
    const y = chessboardRect.y + row * cellHeight;

    ctx.strokeStyle = piece.color === 'red' ? 'rgba(255, 0, 0, 1)' : 'rgba(0, 0, 0, 1)';  // 使用不透明的颜色
    ctx.lineWidth = 4;  // 加粗线条，但稍微细于棋盘轮廓
    ctx.strokeRect(x, y, cellWidth, cellHeight);
  });

  return canvas;
}