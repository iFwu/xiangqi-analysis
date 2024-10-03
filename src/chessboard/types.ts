export interface ChessboardState {
  fen: string;
}

export interface AnalysisResult {
  fen: string;
  pieceLayout: string[][];
}

export type PieceColor = 'red' | 'black' | 'unknown';
export type PieceType = 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p' | 'none';