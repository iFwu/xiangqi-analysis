import { useState, useEffect, useCallback } from 'preact/hooks';
import { ChessEngine } from '../chessEngine';

export function useChessEngine() {
  const [engine, setEngine] = useState<ChessEngine | null>(null);
  const [bestMove, setBestMove] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeEngine = async () => {
      const newEngine = new ChessEngine();
      await newEngine.initEngine();
      setEngine(newEngine);
    };

    initializeEngine();
  }, []);

  const fetchBestMove = useCallback(
    async (fen: string, depth: number) => {
      if (!engine) return;
      setLoading(true);
      setError(null);
      try {
        const move = await engine.getBestMove(fen, depth);
        setBestMove(move);
        if (move === 'red_wins' || move === 'black_wins') {
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [engine]
  );

  return { engine, bestMove, loading, error, fetchBestMove, setBestMove };
}