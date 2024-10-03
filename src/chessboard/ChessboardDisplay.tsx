import { FunctionComponent } from 'preact';
import { ChessboardState } from './types';

interface Props {
  chessboardState: ChessboardState;
}

export const ChessboardDisplay: FunctionComponent<Props> = ({ chessboardState }) => {
  return (
    <div className="chessboard-display">
      {/* 这里实现棋盘的可视化 */}
      <p>Chessboard Display (To be implemented)</p>
    </div>
  );
};