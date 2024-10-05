import { ChessboardDisplay } from './ChessboardDisplay';
import { moveToChineseNotation } from '../chessboard/moveHelper';

interface SolutionDisplayProps {
  bestMove: string;
  loading: boolean;
  error: string | null;
  onNextMove: () => void;
  onPreviousMove: () => void;
  moveHistory: string[];
  fenCode: string;
  fenHistory: string[];
}

export function SolutionDisplay({
  bestMove,
  loading,
  error,
  onNextMove,
  onPreviousMove,
  moveHistory,
  fenCode,
  fenHistory,
}: SolutionDisplayProps) {
  const currentMoveColor = moveHistory.length % 2 === 0 ? '红方' : '黑方';
  const currentMoveNumber = moveHistory.length + 1;

  // Create move history items
  const moveItems = moveHistory.map((move, index) => {
    const fenBeforeMove = fenHistory[index]; // FEN before the move
    const notation = moveToChineseNotation(fenBeforeMove, move);
    return (
      <span key={index} className="move-item">
        {notation}
      </span>
    );
  });

  const isGameOver = bestMove === 'red_wins' || bestMove === 'black_wins';
  const gameOverMessage =
    bestMove === 'red_wins'
      ? '红方胜'
      : bestMove === 'black_wins'
      ? '黑方胜'
      : '';

  return (
    <div className="solution-section">
      <h2>解法展示</h2>
      <div className="chessboard-display">
        <ChessboardDisplay
          fen={fenCode}
          bestMove={isGameOver ? '' : bestMove}
        />
      </div>
      <div className="solution-controls">
        <button onClick={onPreviousMove} disabled={moveHistory.length === 0}>
          上一步
        </button>
        <button
          onClick={onNextMove}
          disabled={loading || !bestMove || isGameOver}
        >
          下一步
        </button>
      </div>
      <div className="solution-debug">
        {loading && <p>正在计算最佳走法...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!isGameOver && bestMove && (
          <p>
            {currentMoveColor}最佳走法：
            {moveToChineseNotation(fenCode, bestMove)} （第 {currentMoveNumber}{' '}
            步）
          </p>
        )}
        {isGameOver && (
          <p style={{ fontWeight: 'bold', color: 'green' }}>
            {gameOverMessage}
          </p>
        )}
      </div>
      <div className="move-list">{moveItems}</div>
    </div>
  );
}
