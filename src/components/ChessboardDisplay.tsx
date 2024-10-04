import { useState, useEffect, useRef } from 'preact/hooks';
import { PieceType, PieceColor } from '../chessboard/types';

const pieceMap: { [key: string]: string } = {
  k: '将',
  a: '士',
  b: '象',
  n: '馬',
  r: '車',
  c: '砲',
  p: '卒',
  K: '帥',
  A: '仕',
  B: '相',
  N: '傌',
  R: '車',
  C: '炮',
  P: '兵',
};
interface ChessboardDisplayProps {
  fen: string;
  bestMove: string;
}

interface Piece {
  type: PieceType;
  color: PieceColor;
}

export function ChessboardDisplay({ fen, bestMove }: ChessboardDisplayProps) {
  const [board, setBoard] = useState<(Piece | null)[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const newBoard = parseFEN(fen);
    setBoard(newBoard);
  }, [fen]);

  useEffect(() => {
    if (canvasRef.current) {
      drawChessboard();
      if (bestMove) {
        drawArrow(bestMove);
      }
    }
  }, [board, bestMove]);

  useEffect(() => {
    function handleResize() {
      if (canvasRef.current) {
        const screenWidth = window.innerWidth;
        const maxWidth = screenWidth * 0.8;
        const originalWidth = 8 * 40 + 40; // 8 cells + 2 margins
        const newScale = Math.min(1, maxWidth / originalWidth);
        setScale(newScale);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function parseFEN(fen: string): (Piece | null)[][] {
    const rows = fen.split(' ')[0].split('/');
    const board: (Piece | null)[][] = [];

    for (let row of rows) {
      const boardRow: (Piece | null)[] = [];
      for (let char of row) {
        if (isNaN(parseInt(char))) {
          const color: PieceColor =
            char === char.toUpperCase() ? 'red' : 'black';
          const type: PieceType = char.toLowerCase() as PieceType;
          boardRow.push({ color, type });
        } else {
          const emptySquares = parseInt(char);
          for (let i = 0; i < emptySquares; i++) {
            boardRow.push(null);
          }
        }
      }
      board.push(boardRow);
    }

    return board;
  }

  function drawChessboard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 40;
    const margin = cellSize / 2;
    const boardWidth = 8 * cellSize + 2 * margin;
    const boardHeight = 9 * cellSize + 2 * margin;
    
    // Set canvas size based on scale
    canvas.width = boardWidth * scale;
    canvas.height = boardHeight * scale;
    
    // Scale the context
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
      ctx.moveTo(margin, i * cellSize + margin);
      ctx.lineTo(boardWidth - margin, i * cellSize + margin);
      ctx.stroke();
    }

    // 绘制竖线，楚河汉界部分只绘制边缘
    for (let j = 0; j <= 8; j++) {
      ctx.beginPath();
      ctx.moveTo(j * cellSize + margin, margin);
      ctx.lineTo(j * cellSize + margin, 4 * cellSize + margin);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(j * cellSize + margin, 5 * cellSize + margin);
      ctx.lineTo(j * cellSize + margin, boardHeight - margin);
      ctx.stroke();
    }

    // 绘制楚河汉界的左右边界线
    ctx.beginPath();
    ctx.moveTo(margin, 4 * cellSize + margin);
    ctx.lineTo(margin, 5 * cellSize + margin);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boardWidth - margin, 4 * cellSize + margin);
    ctx.lineTo(boardWidth - margin, 5 * cellSize + margin);
    ctx.stroke();

    // 绘制楚河汉界
    ctx.font = '18px "KaiTi", "楷体", sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('楚 河', 2 * cellSize + margin, 4.5 * cellSize + margin);
    ctx.fillText('漢 界', 6 * cellSize + margin, 4.5 * cellSize + margin);

    // 绘制九宫格斜线
    ctx.beginPath();
    // 上方九宫格
    ctx.moveTo(3 * cellSize + margin, margin);
    ctx.lineTo(5 * cellSize + margin, 2 * cellSize + margin);
    ctx.moveTo(5 * cellSize + margin, margin);
    ctx.lineTo(3 * cellSize + margin, 2 * cellSize + margin);
    // 下方九宫格
    ctx.moveTo(3 * cellSize + margin, 7 * cellSize + margin);
    ctx.lineTo(5 * cellSize + margin, 9 * cellSize + margin);
    ctx.moveTo(5 * cellSize + margin, 7 * cellSize + margin);
    ctx.lineTo(3 * cellSize + margin, 9 * cellSize + margin);
    ctx.stroke();

    // 绘制准星标记
    function drawCrosshair(x: number, y: number, isEdge: boolean = false) {
      if (!ctx) return;
      const size = cellSize * 0.15;
      const offset = -cellSize * 0.25; // 移动距离
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
    drawCrosshair(1 * cellSize + margin, 2 * cellSize + margin);
    drawCrosshair(7 * cellSize + margin, 2 * cellSize + margin);
    drawCrosshair(1 * cellSize + margin, 7 * cellSize + margin);
    drawCrosshair(7 * cellSize + margin, 7 * cellSize + margin);

    // 绘制兵（卒）的准星
    for (let i = 0; i < 5; i++) {
      const isEdge = i === 0 || i === 4;
      drawCrosshair(2 * i * cellSize + margin, 3 * cellSize + margin, isEdge);
      drawCrosshair(2 * i * cellSize + margin, 6 * cellSize + margin, isEdge);
    }

    // 绘制坐标标记
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 使用半透明的黑色来绘制标记
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // 0.3 是透明度，可以根据需要调整

    // 绘制红方（下方）列标记，从右到左
    const redColumns = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    for (let i = 0; i < 9; i++) {
      ctx.fillText(redColumns[i], (8 - i) * cellSize + margin, boardHeight - margin / 2);
    }
    for (let i = 0; i < 9; i++) {
      ctx.fillText((9 - i).toString(), (8 - i) * cellSize + margin, margin / 2);
    }

    // 绘制棋子
    board.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece) {
          const centerX = j * cellSize + margin;
          const centerY = i * cellSize + margin;
          const radius = cellSize * 0.4;

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
          ctx.font =
            'bold 25px "LiSu", "隶书", "STKaiti", "楷体", "KaiTi", "SimKai", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const pieceChar = piece.type.toUpperCase();
          const pieceSymbol =
            piece.color === 'red'
              ? pieceMap[pieceChar]
              : pieceMap[pieceChar.toLowerCase()];
          ctx.fillText(pieceSymbol, centerX, centerY - radius * 0.12);
        }
      });
    });
  }

  function drawArrow(move: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 40;
    const margin = cellSize / 2;
    const [from, to] = move.match(/.{2}/g) || [];
    if (!from || !to) return;

    const fromCol = from.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRow = 9 - parseInt(from[1]);
    const toCol = to.charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = 9 - parseInt(to[1]);

    const startX = fromCol * cellSize + margin;
    const startY = fromRow * cellSize + margin;
    const endX = toCol * cellSize + margin;
    const endY = toRow * cellSize + margin;

    // 绘制箭头
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)'; // 蓝色箭头
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制箭头头部
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - 15 * Math.cos(angle - Math.PI / 6),
      endY - 15 * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - 15 * Math.cos(angle + Math.PI / 6),
      endY - 15 * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 255, 0.7)'; // 蓝色箭头头部
    ctx.fill();
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <canvas 
        ref={canvasRef} 
        className="chessboard"
        style={{
          maxWidth: '80vw',
          height: 'auto'
        }}
      ></canvas>
    </div>
  );
}