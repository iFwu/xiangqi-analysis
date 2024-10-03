import { ChessboardState, AnalysisResult, PieceColor, PieceType } from './types';
import { detectAndExtractChessboard } from './chessboardDetection';
import { detectPieceInCell, detectPieceColor, processPiece } from './pieceDetection';
import { preprocessAllTemplates, templateMatchingForPiece } from './templateMatching';
import { generateFenFromPieces } from './fenGeneration';

export class ChessboardAnalyzer {
  private templates: Record<PieceType, ImageData>;

  constructor() {
    this.templates = preprocessAllTemplates();
  }

  analyzeImage(imageData: ImageData): AnalysisResult {
    const gridCells = detectAndExtractChessboard(imageData);
    const pieceLayout: PieceType[][] = [];

    for (let row = 0; row < 10; row++) {
      const rowPieces: PieceType[] = [];
      for (let col = 0; col < 9; col++) {
        const idx = row * 9 + col;
        const cellImage = gridCells[idx];

        const hasPiece = detectPieceInCell(cellImage);
        if (hasPiece) {
          const pieceColor = detectPieceColor(cellImage);
          const processedPiece = processPiece(cellImage, pieceColor);
          const matchedPiece = templateMatchingForPiece(processedPiece, this.templates, pieceColor);
          rowPieces.push(matchedPiece || 'none');
        } else {
          rowPieces.push('none');
        }
      }
      pieceLayout.push(rowPieces);
    }

    const fen = generateFenFromPieces(pieceLayout);
    return { fen, pieceLayout };
  }

  getChessboardState(analysisResult: AnalysisResult): ChessboardState {
    return { fen: analysisResult.fen };
  }
}