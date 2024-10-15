// stores/chess.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { updateFEN } from '../utils/notationUtils';

// 标准的中国象棋开局 FEN
const INITIAL_FEN =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

export const useChessStore = defineStore('chess', () => {
  const overlayImageSrc = ref('');
  const chessboardRect = ref({ x: 0, y: 0, width: 0, height: 0 });
  const originalImageSize = ref({ width: 0, height: 0 });
  const fenCode = ref(INITIAL_FEN); // 初始化为开局 FEN
  const fenHistory = ref<string[]>([]);
  const moveHistory = ref<string[]>([]);
  const bestMove = ref('');
  const isCalculating = ref(false);
  const error = ref<string | null>(null);
  const depth = ref(Number(localStorage.getItem('depth')) || 15);

  const setFenCode = (fen: string) => {
    try {
      fenCode.value = fen;
      fenHistory.value.push(fen);
    } catch (err) {
      error.value = `设置 FEN 码时出错: ${(err as Error).message}`;
    }
  };

  const setBestMove = (move: string) => {
    bestMove.value = move;
  };

  const handleNextMove = () => {
    if (
      !bestMove.value ||
      bestMove.value === 'red_wins' ||
      bestMove.value === 'black_wins'
    ) {
      return;
    }
    try {
      const newFen = updateFEN(fenCode.value, bestMove.value);
      setFenCode(newFen);
      moveHistory.value.push(bestMove.value);
      setBestMove('');
    } catch (err) {
      error.value = `执行下一步时出错: ${(err as Error).message}`;
    }
  };

  const handlePreviousMove = () => {
    if (fenHistory.value.length > 1) {
      fenHistory.value.pop();
      moveHistory.value.pop();
      fenCode.value = fenHistory.value[fenHistory.value.length - 1];
      setBestMove('');
    }
  };

  const resetHistory = () => {
    fenHistory.value = [];
    moveHistory.value = [];
    setBestMove('');
    fenCode.value = INITIAL_FEN;
    overlayImageSrc.value = '';
    chessboardRect.value = { x: 0, y: 0, width: 0, height: 0 };
    originalImageSize.value = { width: 0, height: 0 };
  };

  const setDepth = (newDepth: number) => {
    depth.value = newDepth;
    localStorage.setItem('depth', newDepth.toString());
  };

  return {
    overlayImageSrc,
    chessboardRect,
    originalImageSize,
    fenCode,
    fenHistory,
    moveHistory,
    bestMove,
    isCalculating,
    error,
    depth,
    setFenCode,
    setBestMove,
    handleNextMove,
    handlePreviousMove,
    resetHistory,
    setDepth,
  };
});
