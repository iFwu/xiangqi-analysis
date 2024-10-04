import cv from "@techstark/opencv-js";
import { PieceType, PieceColor, PieceName } from './types';

// 使用 import.meta.glob 预加载所有模板图片
const templateImages = import.meta.glob('/assets/chess_templates/*.png', { eager: true });

// 预处理模板图像
function preprocessTemplateImage(templateImage: cv.Mat, cellSize: [number, number]): cv.Mat {
  const resizedTemplate = new cv.Mat();
  cv.resize(templateImage, resizedTemplate, new cv.Size(cellSize[0], cellSize[1]));
  return resizedTemplate;
}

// 预处理所有模板
export async function preprocessAllTemplates(cellSize: [number, number] = [60, 60]): Promise<Record<PieceName, cv.Mat>> {
  const templates: Partial<Record<PieceName, cv.Mat>> = {};

  for (const [path, module] of Object.entries(templateImages)) {
    const pieceName = path.split('/').pop()?.split('.')[0] as PieceName;
    if (pieceName) {
      const img = new Image();
      img.src = (module as { default: string }).default;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      const src = cv.imread(img);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      const preprocessed = preprocessTemplateImage(gray, cellSize);
      templates[pieceName] = preprocessed;
      src.delete();
      gray.delete();
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