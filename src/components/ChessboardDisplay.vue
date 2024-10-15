<template>
  <div style="width: 100%; display: flex; justify-content: center">
    <canvas
      ref="canvasRef"
      class="chessboard"
      style="max-width: 80vw; height: auto"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
  import { PieceType, PieceColor } from '../chessboard/types';
  import { updateFEN } from '../chessboard/moveHelper';
  import LiSuFontUrl from '/assets/LiSu.woff2?url';

  interface ChessboardDisplayProps {
    fen: string;
    bestMove: string;
    onFenUpdate: (newFen: string) => void;
  }

  interface PieceData {
    type: PieceType;
    color: PieceColor;
  }

  const props = defineProps<ChessboardDisplayProps>();

  const CELL_SIZE = 40;
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const board = ref<(PieceData | null)[][]>([]);
  const scale = ref(getScale());
  const fontLoaded = ref(false);
  const selectedPosition = ref<[number, number] | null>(null);

  function getScale() {
    const maxWidth = window.innerWidth * 0.8;
    const originalWidth = 8 * CELL_SIZE + CELL_SIZE;
    const dpr = window.devicePixelRatio;
    return Math.min(1, maxWidth / originalWidth) * dpr;
  }

  onMounted(() => {
    const font = new FontFace('LiSu', `url(${LiSuFontUrl})`);
    font
      .load()
      .then(() => {
        document.fonts.add(font);
        return document.fonts.ready;
      })
      .then(() => {
        fontLoaded.value = true;
      })
      .catch((error) => console.error('Failed to load font:', error));

    board.value = parseFEN(props.fen);

    let lastWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== lastWidth || lastWidth === undefined) {
        if (canvasRef.value) {
          scale.value = getScale();
        }
        lastWidth = currentWidth;
      }
    };

    handleResize(); // 初始加载时设置缩放比例
    window.addEventListener('resize', handleResize);

    const handleCanvasClick = (event: MouseEvent) => {
      const canvas = canvasRef.value;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const margin = (CELL_SIZE / 2) * scale.value;

      // 计算最近的交叉点
      const col = Math.round((x - margin) / (CELL_SIZE * scale.value));
      const row = Math.round((y - margin) / (CELL_SIZE * scale.value));

      console.log(`Clicked intersection: col: ${col}, row: ${row}`);

      // 检查是否在棋盘范围内
      if (col >= 0 && col <= 8 && row >= 0 && row <= 9) {
        if (selectedPosition.value) {
          // 如果已经有选中的棋子，尝试移动
          const [fromRow, fromCol] = selectedPosition.value;
          const fromSquare = `${String.fromCharCode(97 + fromCol)}${9 - fromRow}`;
          const toSquare = `${String.fromCharCode(97 + col)}${9 - row}`;
          const move = `${fromSquare}${toSquare}`;

          const newFen = updateFEN(props.fen, move);
          props.onFenUpdate(newFen);
          selectedPosition.value = null;
        } else {
          // 如果没有选中的棋子，选中当前位置
          selectedPosition.value = [row, col];
        }
      }
    };

    canvasRef.value?.addEventListener('click', handleCanvasClick);

    watch(
      () => props.fen,
      (newFen) => {
        board.value = parseFEN(newFen);
      }
    );

    watch(
      [board, () => props.bestMove, scale, fontLoaded, selectedPosition],
      () => {
        nextTick(() => {
          draw();
        });
      }
    );

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      canvasRef.value?.removeEventListener('click', handleCanvasClick);
    });
  });

  function parseFEN(fen: string): (PieceData | null)[][] {
    const rows = fen.split(' ')[0].split('/');
    const board: (PieceData | null)[][] = [];

    for (let row of rows) {
      const boardRow: (PieceData | null)[] = [];
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

  function draw() {
    const canvas = canvasRef.value;
    if (!canvas || !fontLoaded.value) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除整个 Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制棋盘
    drawChessboard(ctx, scale.value);

    // 绘制棋子
    board.value.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece) {
          const isSelected = !!(
            selectedPosition.value &&
            selectedPosition.value[0] === i &&
            selectedPosition.value[1] === j
          );
          drawPiece(ctx, piece, [i, j], scale.value, isSelected);
        }
      });
    });

    // 绘制箭头
    if (props.bestMove) {
      drawArrow(ctx, props.bestMove);
    }
  }
  function drawChessboard(ctx: CanvasRenderingContext2D, scale: number) {
    const canvas = canvasRef.value;
    if (!canvas) return;

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
      ctx.fillText(
        (9 - i).toString(),
        (8 - i) * CELL_SIZE + margin,
        margin / 2
      );
    }
  }

  function drawPiece(
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
    ctx.setTransform(
      scale,
      0,
      0,
      1.3 * scale,
      centerX * scale,
      centerY * scale
    );

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

  function drawArrow(ctx: CanvasRenderingContext2D, move: string) {
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
    R: '俥',
    C: '炮',
    P: '兵',
  };
</script>
