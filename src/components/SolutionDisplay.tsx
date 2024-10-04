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

  // Map over moveHistory and use the correct FEN before each move
  const moveItems = moveHistory.map((move, index) => {
    const fenBeforeMove = fenHistory[index]; // FEN before the move
    let notation = '';
    try {
      notation = moveToChineseNotation(fenBeforeMove, move);
    } catch (err) {
      notation = 'Error';
      console.error(`Error converting move to notation: ${err}`);
    }
    return (
      <li key={index}>
        {index % 2 === 0 ? '红方' : '黑方'}: {notation}
      </li>
    );
  });

  const isGameOver = bestMove === 'red_wins' || bestMove === 'black_wins';
  const gameOverMessage =
    bestMove === 'red_wins'
      ? '红方胜'
      : bestMove === 'black_wins'
      ? '黑方胜'
      : '';

  // Calculate the number of moves for each side
  const redMoves = Math.ceil(moveHistory.length / 2);
  const blackMoves = Math.floor(moveHistory.length / 2);

  return (
    <div className="solution-section">
      <h2>解法展示</h2>
      <ChessboardDisplay fen={fenCode} bestMove={isGameOver ? '' : bestMove} />
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
          <p>最佳走法: {moveToChineseNotation(fenCode, bestMove)}</p>
        )}
        {isGameOver && (
          <p style={{ fontWeight: 'bold', color: 'green' }}>
            {gameOverMessage}
          </p>
        )}
      </div>
      <div className="move-history">
        <h3>
          走棋历史 (红方: {redMoves}步, 黑方: {blackMoves}步)
        </h3>
        <ul>{moveItems}</ul>
      </div>
      <div className="current-move">
        <h3>当前步: {currentMoveColor}</h3>
      </div>
    </div>
  );
}
