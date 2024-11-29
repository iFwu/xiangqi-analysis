// stores/chess.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { updateFEN } from '../utils/notationUtils';

// 标准的中国象棋开局 FEN
const INITIAL_FEN = '9/9/9/9/9/9/9/9/9/9 w - - 0 1';

export const useChessStore = defineStore('chess', () => {
  const overlayImageSrc = ref('');
  const chessboardRect = ref<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const originalImageSize = ref({ width: 0, height: 0 });
  const fenCode = ref(INITIAL_FEN); // 初始化为开局 FEN
  const fenHistory = ref<string[]>([]);
  const moveHistory = ref<string[]>([]);
  const bestMove = ref('');
  const isCalculating = ref(false);
  const error = ref<string | null>(null);
  const depth = ref(Number(localStorage.getItem('depth')) || 15);
  const isProcessing = ref(false); // 新增：标记是否正在处理图像

  const setError = (errorMessage: string) => {
    console.error('[Store] 错误:', errorMessage);
    error.value = errorMessage;
  };

  const setFenCode = (fen: string) => {
    console.log('[Store] 设置 FEN:', {
      current: fenCode.value,
      new: fen,
      isProcessing: isProcessing.value,
      bestMove: bestMove.value,
    });

    // 如果是初始化或重置，清空历史并设置初始状态
    if (fenCode.value === INITIAL_FEN) {
      fenHistory.value = [fen];
      moveHistory.value = [];
    }

    fenCode.value = fen;
  };

  const setBestMove = (move: string) => {
    console.log('[Store] 设置最佳着法:', {
      current: bestMove.value,
      new: move,
      isProcessing: isProcessing.value,
    });
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
      const currentMove = bestMove.value;

      // 先更新历史记录
      fenHistory.value = [...fenHistory.value, newFen];
      moveHistory.value = [...moveHistory.value, currentMove];

      // 再更新当前状态
      fenCode.value = newFen;
      setBestMove('');
    } catch (err) {
      setError(`执行下一步时出错: ${(err as Error).message}`);
    }
  };

  const handlePreviousMove = () => {
    if (fenHistory.value.length > 1) {
      // 移除最后一步
      fenHistory.value = fenHistory.value.slice(0, -1);
      moveHistory.value = moveHistory.value.slice(0, -1);

      // 更新当前状态
      fenCode.value = fenHistory.value[fenHistory.value.length - 1];
      setBestMove('');
    }
  };

  const resetHistory = () => {
    console.log('[Store] 重置历史');
    // 先重置所有状态
    bestMove.value = '';
    fenHistory.value = [INITIAL_FEN];
    moveHistory.value = [];
    fenCode.value = INITIAL_FEN;
    overlayImageSrc.value = '';
    chessboardRect.value = null;
    originalImageSize.value = { width: 0, height: 0 };
    error.value = null;
    isCalculating.value = false;
    isProcessing.value = true;
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
    isProcessing, // 导出新状态
    setError,
    setFenCode,
    setBestMove,
    handleNextMove,
    handlePreviousMove,
    resetHistory,
    setDepth,
  };
});
