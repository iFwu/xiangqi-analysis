import { useState, useEffect, useCallback } from 'preact/hooks';
import { ChessEngine } from '../chessEngine';

export function useChessEngine() {
  const [engine, setEngine] = useState<ChessEngine | null>(null);
  const [bestMove, setBestMove] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);

  useEffect(() => {
    const initializeEngine = async () => {
      const newEngine = new ChessEngine();
      await newEngine.initEngine();
      setEngine(newEngine);
      setIsEngineReady(true);
    };

    initializeEngine();
  }, []);

  const fetchBestMove = useCallback(
    async (fen: string, depth: number) => {
      if (!engine) return;
      setIsCalculating(true);
      setError(null);
      try {
        const move = await engine.getBestMove(fen, depth);
        setBestMove(move);
        if (move === 'red_wins' || move === 'black_wins') {
          setIsCalculating(false);
          return;
        }
      } catch (err: any) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsCalculating(false);
      }
    },
    [engine]
  );

  return { engine, bestMove, isCalculating, error, fetchBestMove, setBestMove, isEngineReady };
}