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
  import { PieceData } from '../types';
  import { parseFEN, updateFEN } from '../utils/notationUtils';
  import LiSuFontUrl from '/assets/LiSu.woff2?url';
  import {
    CELL_SIZE,
    drawArrow,
    drawChessboard,
    drawPiece,
  } from '../utils/drawUtils';
  import { useChessStore } from '../stores/chess';
  import { storeToRefs } from 'pinia';

  // 解构响应式状态和直接引用方法
  const chessStore = useChessStore();
  const { fenCode, bestMove, error } = storeToRefs(chessStore);
  const { setFenCode } = chessStore; // 移除 setError

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
      .catch((err) => {
        error.value = `加载字体失败: ${err.message}`;
      });

    try {
      board.value = parseFEN(fenCode.value);
    } catch (err) {
      error.value = `解析 FEN 码失败: ${(err as Error).message}`;
    }

    const handleResize = () => {
      if (canvasRef.value) {
        scale.value = getScale();
      }
    };

    window.addEventListener('resize', handleResize);
    canvasRef.value?.addEventListener('click', handleCanvasClick);

    watch(
      () => fenCode.value, // 监听 ref 的值变化
      (newFen) => {
        try {
          board.value = parseFEN(newFen);
        } catch (err) {
          error.value = `解析 FEN 码失败: ${(err as Error).message}`;
        }
      }
    );

    watch(
      [board, () => bestMove.value, scale, fontLoaded, selectedPosition],
      () => {
        nextTick(() => {
          if (canvasRef.value) {
            draw(canvasRef.value);
          }
        });
      }
    );

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      canvasRef.value?.removeEventListener('click', handleCanvasClick);
    });
  });

  const handleCanvasClick = (event: MouseEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const margin = (CELL_SIZE / 2) * scale.value;
    const col = Math.round((x - margin) / (CELL_SIZE * scale.value));
    const row = Math.round((y - margin) / (CELL_SIZE * scale.value));

    if (col >= 0 && col <= 8 && row >= 0 && row <= 9) {
      if (selectedPosition.value) {
        const [fromRow, fromCol] = selectedPosition.value;
        const fromSquare = `${String.fromCharCode(97 + fromCol)}${9 - fromRow}`;
        const toSquare = `${String.fromCharCode(97 + col)}${9 - row}`;
        const move = `${fromSquare}${toSquare}`;

        try {
          const newFen = updateFEN(fenCode.value, move);
          setFenCode(newFen);
          selectedPosition.value = null;
        } catch (err) {
          error.value = `更新 FEN 码失败: ${(err as Error).message}`;
        }
      } else {
        selectedPosition.value = [row, col];
      }
    }
  };

  function draw(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawChessboard(canvas, ctx, scale.value);

    board.value.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece) {
          const isSelected =
            selectedPosition.value &&
            selectedPosition.value[0] === i &&
            selectedPosition.value[1] === j;
          drawPiece(ctx, piece, [i, j], scale.value, !!isSelected);
        }
      });
    });

    if (bestMove.value) {
      drawArrow(ctx, bestMove.value);
    }
  }
</script>
