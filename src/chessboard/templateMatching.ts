import cv from "@techstark/opencv-js";
import { PieceType, PieceColor, PieceName } from './types';

// 预处理模板图像
function preprocessTemplateImage(templateImage: cv.Mat, cellSize: [ number, number ]): cv.Mat {
  const resizedTemplate = new cv.Mat();
  cv.resize(templateImage, resizedTemplate, new cv.Size(cellSize[ 0 ], cellSize[ 1 ]));
  return resizedTemplate;
}

// 预处理所有模板
export async function preprocessAllTemplates(cellSize: [ number, number ] = [ 60, 60 ]): Promise<Record<PieceName, cv.Mat>> {
  const templates: Partial<Record<PieceName, cv.Mat>> = {};
  const pieceTypes: PieceName[] = [
    'red_king', 'red_guard', 'red_bishop', 'red_knight', 'red_rook', 'red_cannon', 'red_pawn',
    'black_king', 'black_guard', 'black_bishop', 'black_knight', 'black_rook', 'black_cannon', 'black_pawn'
  ];

  const loadImage = async (pieceType: PieceName): Promise<cv.Mat | null> => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}chess_templates/${pieceType}.png`);
      if (!response.ok) {
        console.error(`Failed to fetch image for ${pieceType}: ${response.statusText}`);
        return null;
      }
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error(`Failed to get 2D context for ${pieceType}`);
        return null;
      }
      ctx.drawImage(imageBitmap, 0, 0);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      const preprocessed = preprocessTemplateImage(gray, cellSize);
      src.delete();
      gray.delete();
      return preprocessed;
    } catch (error) {
      console.error(`Error fetching image for ${pieceType}:`, error);
      return null;
    }
  };

  for (const pieceType of pieceTypes) {
    const template = await loadImage(pieceType);
    if (template) {
      templates[ pieceType ] = template;
    } else {
      console.warn(`Failed to load template for ${pieceType}`);
    }
  }

  return templates as Record<PieceName, cv.Mat>;
}

// 对单个棋盘格子进行模板匹配
export function templateMatchingForPiece(
  cellImage: cv.Mat,
  templates: Record<PieceName, cv.Mat>,
  pieceColor: PieceColor
): PieceType {
  let maxMatchValue = -1;
  let matchedPiece: PieceType = 'none';

  const cellSize = [ cellImage.cols, cellImage.rows ];

  // 将 cellImage 转换为灰度图（如果还不是的话）
  const grayCellImage = new cv.Mat();
  if (cellImage.channels() === 4) {
    cv.cvtColor(cellImage, grayCellImage, cv.COLOR_RGBA2GRAY);
  } else if (cellImage.channels() === 3) {
    cv.cvtColor(cellImage, grayCellImage, cv.COLOR_RGB2GRAY);
  } else {
    cellImage.copyTo(grayCellImage);
  }

  // 根据颜色过滤模板
  const colorSpecificTemplates = Object.entries(templates).filter(([ pieceName, _ ]) => {
    if (pieceColor === 'red') return pieceName.startsWith('red_');
    if (pieceColor === 'black') return pieceName.startsWith('black_');
    return true; // 如果颜色未知，使用所有模板
  });

  // 遍历所有过滤后的模板进行匹配
  for (const [ pieceName, template ] of colorSpecificTemplates) {
    const resizedTemplate = new cv.Mat();
    cv.resize(template, resizedTemplate, new cv.Size(cellSize[ 0 ], cellSize[ 1 ]));

    const result = new cv.Mat();
    cv.matchTemplate(grayCellImage, resizedTemplate, result, cv.TM_CCOEFF_NORMED);

    // @ts-ignore
    const minMax = cv.minMaxLoc(result);

    if (minMax.maxVal > maxMatchValue) {
      maxMatchValue = minMax.maxVal;
      // 修改这里以返回正确的 PieceType
      const pieceTypeMap: Record<string, PieceType> = {
        'king': 'k',
        'guard': 'a',
        'bishop': 'b',
        'knight': 'n',
        'rook': 'r',
        'cannon': 'c',
        'pawn': 'p'
      };
      const pieceTypeName = pieceName.split('_')[ 1 ];
      matchedPiece = pieceTypeMap[ pieceTypeName ] || 'none';
    }

    resizedTemplate.delete();
    result.delete();
  }

  grayCellImage.delete();

  // 设置阈值，只有超过某个匹配度的结果才认为匹配成功
  const matchingThreshold = 0.3;
  if (maxMatchValue > matchingThreshold) {
    return matchedPiece;
  } else {
    return 'none';
  }
}