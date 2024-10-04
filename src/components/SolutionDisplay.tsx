import { h } from 'preact';

interface SolutionDisplayProps {
  bestMove: string;
  loading: boolean;
  error: string | null;
  onNextMove: () => void;
  moveHistory: string[];
  fenCode: string;
}

export function SolutionDisplay({ bestMove, loading, error, onNextMove, moveHistory }: SolutionDisplayProps) {
  return (
    <div className="solution-section">
      <h2>解法展示</h2>
      <div className="solution-controls">
        <button onClick={onNextMove}>下一步</button>
      </div>
      <div className="solution-debug">
        {loading && <p>正在计算最佳走法...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {bestMove && <p>最佳走法: {bestMove}</p>}
      </div>
      <div className="move-history">
        <h3>走棋历史</h3>
        <ul>
          {moveHistory.map((move, index) => (
            <li key={index}>{index % 2 === 0 ? '红方' : '黑方'}: {move}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}