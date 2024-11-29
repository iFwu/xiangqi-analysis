import cv from '@techstark/opencv-js';
import { PieceColor, PieceType } from '../types';
import { detectPieceInCell, detectPieceColor, processPiece } from './cv/piece';
import { templateMatchingForPiece } from './cv/templateMatching';
import { createOverlayImage } from './cv/overlay';
import { detectAndExtractChessboard } from './cv/chessboard';

interface DetectedPiece {
  position: [number, number];
  color: PieceColor;
  type: PieceType;
  cell: ImageData;
}

export function processImage(
  img: HTMLImageElement,
  templates: Record<string, cv.Mat>
) {
  // 棋盘检测
  const {
    gridCells,
    chessboardRect: detectedChessboardRect,
    gridHeights,
  } = detectAndExtractChessboard(img);

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
  const detectedPieces: DetectedPiece[] = [];
  const unidentifiedPieces: DetectedPiece[] = [];

  for (let index = 0; index < gridCells.length; index++) {
    const cell = gridCells[index];
    const hasPiece = detectPieceInCell(cell);
    if (hasPiece) {
      const pieceColor = detectPieceColor(cell);
      if (pieceColor !== 'unknown') {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const processedPieceImage = processPiece(cell, pieceColor);
        const cellMat = cv.matFromImageData(processedPieceImage);
        const pieceType = templateMatchingForPiece(
          cellMat,
          templates,
          pieceColor
        );
        cellMat.delete();

        const piece: DetectedPiece = {
          position: [row, col],
          color: pieceColor,
          type: pieceType,
          cell: cell,
        };

        if (pieceType === 'none') {
          unidentifiedPieces.push(piece);
        } else {
          detectedPieces.push(piece);
        }
      }
    }
  }

  // 创建叠加图像
  const overlayCanvas = createOverlayImage(
    img,
    adjustedChessboardRect,
    gridHeights,
    [...detectedPieces, ...unidentifiedPieces]
  );

  return {
    adjustedChessboardRect,
    detectedPieces,
    unidentifiedPieces,
    overlayCanvas,
  };
}
