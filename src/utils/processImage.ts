import cv from '@techstark/opencv-js';
import { PieceColor, PieceType } from '../types';
import { detectPieceInCell, detectPieceColor, processPiece } from './cv/piece';
import { templateMatchingForPiece } from './cv/templateMatching';
import { createOverlayImage } from './cv/overlay';
import { detectAndExtractChessboard } from './cv/chessboard';

export function processImage(
  img: HTMLImageElement,
  templates: Record<string, cv.Mat>
) {
  // 棋盘检测
  const { gridCells, chessboardRect: detectedChessboardRect } =
    detectAndExtractChessboard(img);

  // 调整棋盘矩形区域
  const adjustedChessboardRect = {
    x: Math.max(0, detectedChessboardRect.x),
    y: Math.max(0, detectedChessboardRect.y),
    width: Math.min(
      detectedChessboardRect.width,
      img.width - detectedChessboardRect.x
    ),
    height: Math.min(
      detectedChessboardRect.height,
      img.height - detectedChessboardRect.y
    ),
  };

  // 棋子检测
  const detectedPieces: {
    position: [number, number];
    color: PieceColor;
    type: PieceType;
  }[] = [];

  for (let index = 0; index < gridCells.length; index++) {
    const cell = gridCells[index];
    const hasPiece = detectPieceInCell(cell);
    if (hasPiece) {
      const pieceColor = detectPieceColor(cell);
      if (pieceColor !== 'unknown') {
        const row = Math.floor(index / 9);
        const col = index % 9;
        let pieceType: PieceType = 'none';
        const processedPieceImage = processPiece(cell, pieceColor);
        const cellMat = cv.matFromImageData(processedPieceImage);
        pieceType = templateMatchingForPiece(cellMat, templates, pieceColor);
        cellMat.delete();
        detectedPieces.push({
          position: [row, col],
          color: pieceColor,
          type: pieceType,
        });
      }
    }
  }

  // 创建叠加图像
  const overlayCanvas = createOverlayImage(
    img,
    adjustedChessboardRect,
    detectedPieces
  );

  return {
    adjustedChessboardRect,
    detectedPieces,
    overlayCanvas,
  };
}
