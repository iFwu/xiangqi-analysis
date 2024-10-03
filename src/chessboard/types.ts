export interface ChessboardState {
  fen: string;
}

export interface AnalysisResult {
  fen: string;
  pieceLayout: string[][];
}

export type PieceColor = 'red' | 'black' | 'unknown';
export type PieceType = 'k' | 'g' | 'b' | 'n' | 'r' | 'c' | 'p' | 'K' | 'G' | 'B' | 'N' | 'R' | 'C' | 'P' | 'none';

export type PieceName = 
  | 'red_king' | 'red_guard' | 'red_bishop' | 'red_knight' | 'red_rook' | 'red_cannon' | 'red_pawn'
  | 'black_king' | 'black_guard' | 'black_bishop' | 'black_knight' | 'black_rook' | 'black_cannon' | 'black_pawn';