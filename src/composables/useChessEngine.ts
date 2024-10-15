import { ref, onMounted } from 'vue';
import { ChessEngine } from '../chessEngine';

export function useChessEngine() {
  const engine = ref<ChessEngine | null>(null);
  const bestMove = ref('');
  const isCalculating = ref(false);
  const error = ref<string | null>(null);
  const isEngineReady = ref(false);

  onMounted(async () => {
    const newEngine = new ChessEngine();
    await newEngine.initEngine();
    engine.value = newEngine;
    isEngineReady.value = true;
  });

  const fetchBestMove = async (fen: string, depth: number) => {
    if (!engine.value) return;
    isCalculating.value = true;
    error.value = null;
    try {
      const move = await engine.value.getBestMove(fen, depth);
      bestMove.value = move;
      if (move === 'red_wins' || move === 'black_wins') {
        isCalculating.value = false;
        return;
      }
    } catch (err: any) {
      error.value = `Error: ${err.message}`;
    } finally {
      isCalculating.value = false;
    }
  };

  const setBestMove = (value: string) => {
    bestMove.value = value;
  };

  return {
    engine,
    bestMove,
    isCalculating,
    error,
    fetchBestMove,
    setBestMove,
    isEngineReady,
  };
}
