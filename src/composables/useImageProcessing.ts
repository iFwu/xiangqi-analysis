import { processImage } from '../utils/processImage';
import { generateFenFromPieces } from '../utils/notationUtils';
import { useChessStore } from '../stores/chess';
import { storeToRefs } from 'pinia';
import cv from '@techstark/opencv-js';
import { ShallowRef } from 'vue';

export function useImageProcessing(
  templates: ShallowRef<Record<string, cv.Mat> | undefined>
) {
  const chessStore = useChessStore();
  const { originalImageSize, chessboardRect, overlayImageSrc, error } =
    storeToRefs(chessStore);
  const { setFenCode } = chessStore;

  const processUploadedImage = (img: HTMLImageElement) => {
    if (!templates.value) {
      error.value = '模板未加载';
      return;
    }

    originalImageSize.value = { width: img.width, height: img.height };

    try {
      const { adjustedChessboardRect, detectedPieces, overlayCanvas } =
        processImage(img, templates.value);

      chessboardRect.value = adjustedChessboardRect;
      overlayImageSrc.value = overlayCanvas.toDataURL();

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
      setFenCode(initialFenCode);
    } catch (err) {
      error.value = `处理图像失败: ${(err as Error).message}`;
    }
  };

  return {
    processUploadedImage,
  };
}
