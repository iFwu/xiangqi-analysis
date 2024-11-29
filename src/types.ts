export interface AnalysisResult {
  fen: string;
  pieceLayout: string[][];
}

export type PieceColor = 'red' | 'black' | 'unknown';
export type PieceType = 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p' | 'none';

export type PieceName =
  | 'red_king'
  | 'red_guard'
  | 'red_bishop'
  | 'red_knight'
  | 'red_rook'
  | 'red_cannon'
  | 'red_pawn'
  | 'black_king'
  | 'black_guard'
  | 'black_bishop'
  | 'black_knight'
  | 'black_rook'
  | 'black_cannon'
  | 'black_pawn';

export interface PieceData {
  type: PieceType;
  color: PieceColor;
}

// 中文棋子名称到类型的映射
export const chineseNameToPieceType: Record<string, PieceType> = {
  // 通用映射（不区分红黑）
  帥: 'k',
  將: 'k',
  仕: 'a',
  士: 'a',
  相: 'b',
  象: 'b',
  馬: 'n',
  車: 'r',
  炮: 'c',
  砲: 'c',
  兵: 'p',
  卒: 'p',
};
