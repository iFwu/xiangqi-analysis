import { PieceData } from '../types';
import { pieceMap } from './notationUtils';

export const CELL_SIZE = 40;

export function drawChessboard(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  scale: number
) {
  const margin = CELL_SIZE / 2;
  const boardWidth = 8 * CELL_SIZE + 2 * margin;
  const boardHeight = 9 * CELL_SIZE + 2 * margin;

  canvas.width = boardWidth * scale;
  canvas.height = boardHeight * scale;

  canvas.style.width = `${(boardWidth * scale) / window.devicePixelRatio}px`;
  canvas.style.height = `${(boardHeight * scale) / window.devicePixelRatio}px`;

  ctx.scale(scale, scale);

  // 绘制棋盘背景
  ctx.fillStyle = '#f0d9b5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制格子线
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  // 绘制横线
  for (let i = 0; i <= 9; i++) {
    ctx.beginPath();
    ctx.moveTo(margin, i * CELL_SIZE + margin);
    ctx.lineTo(boardWidth - margin, i * CELL_SIZE + margin);
    ctx.stroke();
  }

  // 绘制竖线，楚河汉界部分只绘制边缘
  for (let j = 0; j <= 8; j++) {
    ctx.beginPath();
    ctx.moveTo(j * CELL_SIZE + margin, margin);
    ctx.lineTo(j * CELL_SIZE + margin, 4 * CELL_SIZE + margin);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(j * CELL_SIZE + margin, 5 * CELL_SIZE + margin);
    ctx.lineTo(j * CELL_SIZE + margin, boardHeight - margin);
    ctx.stroke();
  }

  // 绘制楚河汉界的左右边界线
  ctx.beginPath();
  ctx.moveTo(margin, 4 * CELL_SIZE + margin);
  ctx.lineTo(margin, 5 * CELL_SIZE + margin);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(boardWidth - margin, 4 * CELL_SIZE + margin);
  ctx.lineTo(boardWidth - margin, 5 * CELL_SIZE + margin);
  ctx.stroke();

  // 绘制楚河汉界
  ctx.font = '20px "LiSu", sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('楚  河', 2 * CELL_SIZE + margin, 4.6 * CELL_SIZE + margin);
  ctx.fillText('汉  界', 6 * CELL_SIZE + margin, 4.6 * CELL_SIZE + margin);

  // 绘制九宫格斜线
  ctx.beginPath();
  // 上方九宫格
  ctx.moveTo(3 * CELL_SIZE + margin, margin);
  ctx.lineTo(5 * CELL_SIZE + margin, 2 * CELL_SIZE + margin);
  ctx.moveTo(5 * CELL_SIZE + margin, margin);
  ctx.lineTo(3 * CELL_SIZE + margin, 2 * CELL_SIZE + margin);
  // 下方九宫格
  ctx.moveTo(3 * CELL_SIZE + margin, 7 * CELL_SIZE + margin);
  ctx.lineTo(5 * CELL_SIZE + margin, 9 * CELL_SIZE + margin);
  ctx.moveTo(5 * CELL_SIZE + margin, 7 * CELL_SIZE + margin);
  ctx.lineTo(3 * CELL_SIZE + margin, 9 * CELL_SIZE + margin);
  ctx.stroke();

  // 绘制准星标记
  function drawCrosshair(x: number, y: number, isEdge: boolean = false) {
    if (!ctx) return;
    const size = CELL_SIZE * 0.15;
    const offset = -CELL_SIZE * 0.23; // 移动距离
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;

    if (!isEdge || x < boardWidth / 2) {
      // 左上
      ctx.beginPath();
      ctx.moveTo(x - size - offset, y - offset);
      ctx.lineTo(x - size - offset, y - size - offset);
      ctx.lineTo(x - offset, y - size - offset);
      ctx.stroke();

      // 左下
      ctx.beginPath();
      ctx.moveTo(x - size - offset, y + offset);
      ctx.lineTo(x - size - offset, y + size + offset);
      ctx.lineTo(x - offset, y + size + offset);
      ctx.stroke();
    }

    if (!isEdge || x > boardWidth / 2) {
      // 右上
      ctx.beginPath();
      ctx.moveTo(x + size + offset, y - offset);
      ctx.lineTo(x + size + offset, y - size - offset);
      ctx.lineTo(x + offset, y - size - offset);
      ctx.stroke();

      // 右下
      ctx.beginPath();
      ctx.moveTo(x + size + offset, y + offset);
      ctx.lineTo(x + size + offset, y + size + offset);
      ctx.lineTo(x + offset, y + size + offset);
      ctx.stroke();
    }
  }

  // 绘制炮的准星
  drawCrosshair(1 * CELL_SIZE + margin, 2 * CELL_SIZE + margin);
  drawCrosshair(7 * CELL_SIZE + margin, 2 * CELL_SIZE + margin);
  drawCrosshair(1 * CELL_SIZE + margin, 7 * CELL_SIZE + margin);
  drawCrosshair(7 * CELL_SIZE + margin, 7 * CELL_SIZE + margin);

  // 绘制兵（卒）的准星
  for (let i = 0; i < 5; i++) {
    const isEdge = i === 0 || i === 4;
    drawCrosshair(2 * i * CELL_SIZE + margin, 3 * CELL_SIZE + margin, isEdge);
    drawCrosshair(2 * i * CELL_SIZE + margin, 6 * CELL_SIZE + margin, isEdge);
  }

  // 绘制坐标标记
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

  // 绘制红方（下方）列标记，从右左
  const redColumns = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  for (let i = 0; i < 9; i++) {
    ctx.fillText(
      redColumns[i],
      (8 - i) * CELL_SIZE + margin,
      boardHeight - margin / 2
    );
  }
  for (let i = 0; i < 9; i++) {
    ctx.fillText((9 - i).toString(), (8 - i) * CELL_SIZE + margin, margin / 2);
  }
}

export function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: PieceData,
  position: [number, number],
  scale: number,
  selected: boolean
) {
  const margin = CELL_SIZE / 2;
  const [i, j] = position;
  const centerX = j * CELL_SIZE + margin;
  const centerY = i * CELL_SIZE + margin;
  const radius = CELL_SIZE * 0.4;

  // 绘制阴影
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();

  // 绘制棋子背景
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = piece.color === 'red' ? '#ffcccc' : '#e0e0e0';
  ctx.fill();

  // 绘制棋子边框
  ctx.strokeStyle = piece.color === 'red' ? '#c00000' : '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制棋子文字
  ctx.fillStyle = piece.color === 'red' ? '#c00000' : '#000000';
  ctx.font = '22px "LiSu", sans-serif';
  const pieceChar = piece.type.toUpperCase();
  const pieceSymbol =
    piece.color === 'red'
      ? pieceMap[pieceChar]
      : pieceMap[pieceChar.toLowerCase()];

  // 保存当前绘图状态
  ctx.save();

  // 更新变换以使用新的缩放比例
  ctx.setTransform(scale, 0, 0, 1.3 * scale, centerX * scale, centerY * scale);

  // 绘制文字，注意坐标现在是相对于变换后的原点
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(pieceSymbol, radius * 0.05, radius * 0.9);

  // 恢复原始绘图状态
  ctx.restore();

  if (selected) {
    const boxSize = CELL_SIZE * 0.9; // 方框大小
    const cornerLength = boxSize * 0.25; // 角的长度

    ctx.strokeStyle = 'rgba(0, 220, 75, 0.9)'; // 春天的绿色，带透明度
    ctx.lineWidth = 2;

    // 左上角
    ctx.beginPath();
    ctx.moveTo(centerX - boxSize / 2, centerY - boxSize / 2 + cornerLength);
    ctx.lineTo(centerX - boxSize / 2, centerY - boxSize / 2);
    ctx.lineTo(centerX - boxSize / 2 + cornerLength, centerY - boxSize / 2);
    ctx.stroke();

    // 右上角
    ctx.beginPath();
    ctx.moveTo(centerX + boxSize / 2 - cornerLength, centerY - boxSize / 2);
    ctx.lineTo(centerX + boxSize / 2, centerY - boxSize / 2);
    ctx.lineTo(centerX + boxSize / 2, centerY - boxSize / 2 + cornerLength);
    ctx.stroke();

    // 左下角
    ctx.beginPath();
    ctx.moveTo(centerX - boxSize / 2, centerY + boxSize / 2 - cornerLength);
    ctx.lineTo(centerX - boxSize / 2, centerY + boxSize / 2);
    ctx.lineTo(centerX - boxSize / 2 + cornerLength, centerY + boxSize / 2);
    ctx.stroke();

    // 右下角
    ctx.beginPath();
    ctx.moveTo(centerX + boxSize / 2 - cornerLength, centerY + boxSize / 2);
    ctx.lineTo(centerX + boxSize / 2, centerY + boxSize / 2);
    ctx.lineTo(centerX + boxSize / 2, centerY + boxSize / 2 - cornerLength);
    ctx.stroke();
  }
}

export function drawArrow(ctx: CanvasRenderingContext2D, move: string) {
  const margin = CELL_SIZE / 2;
  const [from, to] = move.match(/.{2}/g) || [];
  if (!from || !to) return;

  const fromCol = from.charCodeAt(0) - 'a'.charCodeAt(0);
  const fromRow = 9 - parseInt(from[1]);
  const toCol = to.charCodeAt(0) - 'a'.charCodeAt(0);
  const toRow = 9 - parseInt(to[1]);

  const startX = fromCol * CELL_SIZE + margin;
  const startY = fromRow * CELL_SIZE + margin;
  const endX = toCol * CELL_SIZE + margin;
  const endY = toRow * CELL_SIZE + margin;

  // 计算箭头头部的大小
  const headLength = 15;

  // 计算箭头线条的终点
  const angle = Math.atan2(endY - startY, endX - startX);
  const lineEndX = endX - headLength * Math.cos(angle) * 0.86;
  const lineEndY = endY - headLength * Math.sin(angle) * 0.86;

  // 绘制箭头线条
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 绘制箭头头部
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
  ctx.fill();
}
