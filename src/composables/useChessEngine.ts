import { ref } from 'vue';
import { useChessStore } from '../stores/chess';
import { ChessEngine } from '../chessEngine';
import { storeToRefs } from 'pinia';

export function useChessEngine() {
  const isEngineReady = ref(false);
  const chessStore = useChessStore();
  const { isCalculating, error } = storeToRefs(chessStore);

  const engine = new ChessEngine();

  const initializeEngine = async () => {
    try {
      await engine.initEngine();
      isEngineReady.value = true;
    } catch (err) {
      error.value = (err as Error).message;
    }
  };

  initializeEngine();

  const fetchBestMove = async (fen: string, depth: number) => {
    isCalculating.value = true;
    error.value = null;
    try {
      const bestMove = await engine.getBestMove(fen, depth);
      chessStore.setBestMove(bestMove);
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      isCalculating.value = false;
    }
  };

  return {
    isEngineReady,
    fetchBestMove,
  };
}
