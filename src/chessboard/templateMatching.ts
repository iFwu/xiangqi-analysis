import cv from "@techstark/opencv-js";
import { PieceType, PieceColor, PieceName } from './types';
import { displayImage } from './utils';

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
      console.log(`Attempting to load image for ${pieceType}`);
      const response = await fetch(`/chess_templates/${pieceType}.png`);
      if (!response.ok) {
        console.error(`Failed to fetch image for ${pieceType}: ${response.statusText}`);
        return null;
      }
      const blob = await response.blob();
      console.log(`Blob size for ${pieceType}: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        console.error(`Empty blob for ${pieceType}`);
        return null;
      }

      const imageBitmap = await createImageBitmap(blob).catch(error => {
        console.error(`Failed to create ImageBitmap for ${pieceType}:`, error);
        return null;
      });
      
      if (!imageBitmap) {
        console.error(`ImageBitmap creation failed for ${pieceType}`);
        return null;
      }

      console.log(`Successfully created ImageBitmap for ${pieceType}`);

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
      console.error(`Error processing template for ${pieceType}:`, error);
      return null;
    }
  };

  for (const pieceType of pieceTypes) {
    const template = await loadImage(pieceType);
    if (template) {
      templates[pieceType] = template;
      console.log(`Successfully loaded template for ${pieceType}`);
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
  pieceColor: PieceColor,
  cellIndex: number
): PieceType | null {
  let maxMatchValue = -1;
  let matchedPiece: PieceType | null = null;

  const cellSize = [ cellImage.cols, cellImage.rows ];

  displayImage("Processed Cell Image", cellImage, cellIndex);

  // 将 cellImage 转换为灰度图（如果还不是的话）
  const grayCellImage = new cv.Mat();
  if (cellImage.channels() === 4) {
    cv.cvtColor(cellImage, grayCellImage, cv.COLOR_RGBA2GRAY);
  } else if (cellImage.channels() === 3) {
    cv.cvtColor(cellImage, grayCellImage, cv.COLOR_RGB2GRAY);
  } else {
    cellImage.copyTo(grayCellImage);
  }

  displayImage("Gray Processed Cell Image", grayCellImage, cellIndex);

  // 根据颜色过滤模板
  const colorSpecificTemplates = Object.entries(templates).filter(([ pieceName, _ ]) => {
    if (pieceColor === 'red') return pieceName.startsWith('red_');
    if (pieceColor === 'black') return pieceName.startsWith('black_');
    return true; // 如果颜色未知，使用所有模板
  });

  if (colorSpecificTemplates.length === 0) {
    console.log("没有找到对应颜色的模板。");
    grayCellImage.delete();
    return null;
  }

  // 遍历所有过滤后的模板进行匹配
  for (const [ pieceName, template ] of colorSpecificTemplates) {
    const resizedTemplate = new cv.Mat();
    cv.resize(template, resizedTemplate, new cv.Size(cellSize[ 0 ], cellSize[ 1 ]));

    displayImage(`${pieceName} Template`, resizedTemplate, cellIndex);

    const result = new cv.Mat();
    console.log(`${pieceName} result size before match:`, result.rows, result.cols, result.type());

    try {
      cv.matchTemplate(grayCellImage, resizedTemplate, result, cv.TM_CCOEFF_NORMED);
      console.log(`${pieceName} result size after match:`, result.rows, result.cols, result.type());
    } catch (error) {
      console.error(`Error in matchTemplate for ${pieceName}:`, error);
      continue;
    }

    // @ts-ignore
    const minMax = cv.minMaxLoc(result);
    console.log(`${pieceName} match value:`, minMax.maxVal);

    if (minMax.maxVal > maxMatchValue) {
      maxMatchValue = minMax.maxVal;
      matchedPiece = pieceName.split('_')[1] as PieceType; // Extract the piece type
    }

    resizedTemplate.delete();
    result.delete();
  }

  grayCellImage.delete();

  // 设置阈值，只有超过某个匹配度的结果才认为匹配成功
  const matchingThreshold = 0.3;
  if (maxMatchValue > matchingThreshold) {
    console.log("Matched piece:", matchedPiece, "with value:", maxMatchValue);
    return matchedPiece;
  } else {
    console.log("没有匹配到合适的棋子。最高匹配值:", maxMatchValue);
    return null;
  }
}