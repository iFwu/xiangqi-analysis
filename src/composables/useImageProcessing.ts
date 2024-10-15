import { processImage } from '../utils/processImage';
import { generateFenFromPieces } from '../utils/notationUtils';
import { useChessStore } from '../stores/chess';
import cv from '@techstark/opencv-js';
import { ShallowRef } from 'vue';

export function useImageProcessing(
  templates: ShallowRef<Record<string, cv.Mat> | undefined>
) {
  const chessStore = useChessStore();

  const processUploadedImage = (img: HTMLImageElement) => {
    if (!templates.value) {
      chessStore.setError('模板未加载');
      return;
    }

    chessStore.originalImageSize = { width: img.width, height: img.height };

    try {
      const { adjustedChessboardRect, detectedPieces, overlayCanvas } =
        processImage(img, templates.value);

      chessStore.chessboardRect = adjustedChessboardRect;
      chessStore.overlayImageSrc = overlayCanvas.toDataURL();

      const pieceLayout: string[][] = Array.from({ length: 10 }, () =>
        Array(9).fill('none')
      );
      detectedPieces.forEach((piece) => {
        const [row, col] = piece.position;
        if (piece.type !== null) {
          pieceLayout[row][col] = `${piece.color}_${piece.type}`;
        }
      });

      const initialFenCode = generateFenFromPieces(pieceLayout, 'red');
      chessStore.setFenCode(initialFenCode);
    } catch (err) {
      chessStore.setError(`处理图像失败: ${(err as Error).message}`);
    }
  };

  return {
    processUploadedImage,
  };
}
