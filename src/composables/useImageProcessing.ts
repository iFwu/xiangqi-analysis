import { processImage } from '../utils/processImage';
import { generateFenFromPieces } from '../utils/notationUtils';
import { useChessStore } from '../stores/chess';
import cv from '@techstark/opencv-js';
import { ShallowRef } from 'vue';
import { chineseNameToPieceType } from '../types';

// 检查浏览器是否支持 WebP
const supportsWebP = async () => {
  const canvas = document.createElement('canvas');
  if (!canvas || !canvas.getContext) return false;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// 调整图片大小并可选转换为 WebP
async function resizeAndConvertImage(
  imageData: ImageData,
  maxSize = 128
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  let width = imageData.width;
  let height = imageData.height;

  // 如果尺寸超过限制，等比例缩小
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 canvas context');

  // 创建临时 canvas 来处理 ImageData
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('无法创建临时 canvas context');
  tempCtx.putImageData(imageData, 0, 0);

  // 在主 canvas 上绘制调整大小后的图像
  ctx.drawImage(tempCanvas, 0, 0, width, height);

  // 检查是否支持 WebP
  const webpSupported = await supportsWebP();
  return new Promise<Blob>((resolve) => {
    if (webpSupported) {
      canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.8);
    } else {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
    }
  });
}

async function getStepFunAnalysis(
  pieces: { cell: ImageData }[]
): Promise<string[][]> {
  // 处理所有图片
  const processedImages = await Promise.all(
    pieces.map((piece) => resizeAndConvertImage(piece.cell))
  );

  // 分批处理，每批最多10张图片
  const results: string[][] = [];
  for (let i = 0; i < processedImages.length; i += 10) {
    const batch = processedImages.slice(i, i + 10);
    const batchFormData = new FormData();
    batch.forEach((blob) => batchFormData.append('image', blob));

    const response = await fetch(
      'https://workers.nicesprite.com/api/stepfun/',
      {
        method: 'POST',
        body: batchFormData,
      }
    );

    if (!response.ok) {
      throw new Error('StepFun API 请求失败');
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('StepFun API 返回格式错误');
    }

    const batchResults = data.choices[0].message.content
      .split(/，|,/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    results.push(batchResults);
  }

  return results;
}

export function useImageProcessing(
  templates: ShallowRef<Record<string, cv.Mat> | undefined>
) {
  const chessStore = useChessStore();

  const processUploadedImage = async (img: HTMLImageElement) => {
    if (!templates.value) {
      chessStore.setError('模板未加载');
      return;
    }

    // 设置处理状态
    console.log('[ImageProcessing] 开始处理图片');
    chessStore.isProcessing = true;
    chessStore.resetHistory();

    chessStore.originalImageSize = { width: img.width, height: img.height };

    try {
      const {
        adjustedChessboardRect,
        detectedPieces,
        unidentifiedPieces,
        overlayCanvas,
      } = processImage(img, templates.value);

      chessStore.chessboardRect = adjustedChessboardRect;
      chessStore.overlayImageSrc = overlayCanvas.toDataURL();

      // 如果有未识别的棋子，尝试使用 StepFun API 识别
      if (unidentifiedPieces.length > 0) {
        console.log(
          `[ImageProcessing] 开始识别 ${unidentifiedPieces.length} 个未知棋子`
        );

        try {
          // 批量获取识别结果
          const allResults = await getStepFunAnalysis(unidentifiedPieces);
          console.log('[ImageProcessing] StepFun API 返回结果:', allResults);

          // 处理每个批次的结果
          allResults.forEach((batchResults, batchIndex) => {
            const startIdx = batchIndex * 10;

            batchResults.forEach((chineseName, index) => {
              const piece = unidentifiedPieces[startIdx + index];
              if (piece) {
                const pieceType = chineseNameToPieceType[chineseName];
                if (pieceType) {
                  console.log(
                    `[ImageProcessing] 识别成功: [${piece.position}] = ${chineseName} (${pieceType})`
                  );
                  piece.type = pieceType;
                  detectedPieces.push(piece);
                }
              }
            });
          });
        } catch (stepFunErr) {
          console.error('[ImageProcessing] StepFun API 识别失败:', stepFunErr);
          chessStore.setError(
            `部分棋子类型识别失败: ${(stepFunErr as Error).message}`
          );
        }
      }

      // 生成初始 FEN 码
      console.log('[ImageProcessing] 生成 FEN 码');
      const pieceLayout: string[][] = Array.from({ length: 10 }, () =>
        Array(9).fill('none')
      );
      detectedPieces.forEach((piece) => {
        const [row, col] = piece.position;
        if (piece.type !== 'none') {
          pieceLayout[row][col] = `${piece.color}_${piece.type}`;
        }
      });

      const initialFenCode = generateFenFromPieces(pieceLayout, 'red');
      console.log('[ImageProcessing] 设置 FEN 码:', initialFenCode);
      chessStore.setFenCode(initialFenCode);
    } catch (err) {
      console.error('[ImageProcessing] 处理失败:', err);
      chessStore.setError(`处理图像失败: ${(err as Error).message}`);
    } finally {
      // 完成处理
      console.log('[ImageProcessing] 处理完成');
      chessStore.isProcessing = false;
    }
  };

  return {
    processUploadedImage,
  };
}
