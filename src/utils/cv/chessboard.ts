import cv from '@techstark/opencv-js';
import { kmeans } from 'ml-kmeans';
import { ChessboardConfig } from './config';

function calculateAdjustmentRatio(
  width: number,
  height: number
): {
  expandRatioH: number;
  bottomOffsetRatio: number;
} {
  const actualRatio = height / width;
  const standardRatio = ChessboardConfig.STANDARD_BOARD_RATIO;

  // 使用基础值作为起点
  let expandRatioH = ChessboardConfig.EXPAND_RATIO_H;
  let bottomOffsetRatio = ChessboardConfig.BOTTOM_OFFSET_RATIO;

  if (actualRatio > standardRatio) {
    // 使用固定的调整因子
    expandRatioH += ChessboardConfig.RATIO_ADJUSTMENT_FACTORS.EXPAND_H;
    bottomOffsetRatio += ChessboardConfig.RATIO_ADJUSTMENT_FACTORS.BOTTOM;
  }

  return {
    expandRatioH,
    bottomOffsetRatio,
  };
}

export function detectAndExtractChessboard(imgElement: HTMLImageElement): {
  gridCells: ImageData[];
  chessboardRect: { x: number; y: number; width: number; height: number };
  gridHeights: number[];
} {
  const img = cv.imread(imgElement);
  const gray = new cv.Mat();
  cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);
  const blurred = new cv.Mat();
  cv.GaussianBlur(
    gray,
    blurred,
    new cv.Size(
      ChessboardConfig.GAUSSIAN_BLUR_SIZE,
      ChessboardConfig.GAUSSIAN_BLUR_SIZE
    ),
    0
  );
  const edges = new cv.Mat();
  cv.Canny(
    blurred,
    edges,
    ChessboardConfig.CANNY_THRESHOLD1,
    ChessboardConfig.CANNY_THRESHOLD2
  );

  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  const dilatedEdges = new cv.Mat();
  cv.dilate(edges, dilatedEdges, kernel, new cv.Point(-1, -1), 3);
  const finalEdges = new cv.Mat();
  cv.erode(dilatedEdges, finalEdges, kernel, new cv.Point(-1, -1), 1);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(
    finalEdges,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  if (contours.size() === 0) {
    console.log('未检测到任何轮廓。');
    return {
      gridCells: [],
      chessboardRect: { x: NaN, y: NaN, width: NaN, height: NaN },
      gridHeights: [],
    };
  }

  let maxContourIndex = 0;
  let maxContourArea = 0;
  for (let i = 0; i < contours.size(); i++) {
    const area = cv.contourArea(contours.get(i));
    if (area > maxContourArea) {
      maxContourArea = area;
      maxContourIndex = i;
    }
  }

  const maxContour = contours.get(maxContourIndex);
  const rect = cv.boundingRect(maxContour);
  const croppedRegion = img.roi(rect);

  // 根据检测到的棋盘比例计算调整参数
  const { expandRatioH, bottomOffsetRatio } = calculateAdjustmentRatio(
    rect.width,
    rect.height
  );

  const { gridCells, expandedRect, gridHeights } = segmentChessboard(
    croppedRegion,
    ChessboardConfig.EXPAND_RATIO_W,
    expandRatioH,
    bottomOffsetRatio
  );

  img.delete();
  gray.delete();
  blurred.delete();
  edges.delete();
  kernel.delete();
  dilatedEdges.delete();
  finalEdges.delete();
  contours.delete();
  hierarchy.delete();
  croppedRegion.delete();

  return {
    gridCells,
    chessboardRect: {
      x: rect.x + expandedRect.x,
      y: rect.y + expandedRect.y,
      width: expandedRect.width,
      height: expandedRect.height,
    },
    gridHeights,
  };
}

// 计算渐变高度
export function calculateGridHeights(totalHeight: number): number[] {
  const rows = 10;
  const baseHeight = Math.floor(totalHeight / rows);
  const heightVariation = baseHeight * ChessboardConfig.HEIGHT_VARIATION_RATIO;
  const gridHeights: number[] = [];

  // 使用二次函数来计算每行的高度，实现平滑的渐变效果
  for (let i = 0; i < rows; i++) {
    const progress = i / (rows - 1); // 0 到 1 的进度
    const factor = 1 + (progress * progress * heightVariation) / baseHeight;
    gridHeights.push(Math.floor(baseHeight * factor));
  }

  // 调整总高度以匹配原始高度
  const currentTotalHeight = gridHeights.reduce((sum, h) => sum + h, 0);
  const scale = totalHeight / currentTotalHeight;
  return gridHeights.map((h) => Math.floor(h * scale));
}

export function segmentChessboard(
  croppedRegion: cv.Mat,
  expandRatioW: number,
  expandRatioH: number,
  bottomOffsetRatio: number
): {
  gridCells: ImageData[];
  expandedRect: { x: number; y: number; width: number; height: number };
  gridHeights: number[];
} {
  const grayCropped = new cv.Mat();
  cv.cvtColor(croppedRegion, grayCropped, cv.COLOR_RGBA2GRAY);
  const blurCropped = new cv.Mat();
  cv.GaussianBlur(
    grayCropped,
    blurCropped,
    new cv.Size(
      ChessboardConfig.GAUSSIAN_BLUR_SIZE,
      ChessboardConfig.GAUSSIAN_BLUR_SIZE
    ),
    0
  );
  const edgesCropped = new cv.Mat();
  cv.Canny(
    blurCropped,
    edgesCropped,
    ChessboardConfig.CANNY_THRESHOLD1,
    ChessboardConfig.CANNY_THRESHOLD2
  );

  const lines = new cv.Mat();
  cv.HoughLinesP(edgesCropped, lines, 1, Math.PI / 180, 80, 100, 50);

  if (lines.rows === 0) {
    console.log('无法检测到棋盘线条。');
    return {
      gridCells: [],
      expandedRect: { x: 0, y: 0, width: 0, height: 0 },
      gridHeights: [],
    };
  }

  const horizontalLines: number[][] = [];
  const verticalLines: number[][] = [];

  for (let i = 0; i < lines.rows; i++) {
    const [x1, y1, x2, y2] = lines.data32S.slice(i * 4, (i + 1) * 4);
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    if (Math.abs(angle) < 10) {
      horizontalLines.push([x1, y1, x2, y2]);
    } else if (Math.abs(angle) > 80) {
      verticalLines.push([x1, y1, x2, y2]);
    }
  }

  if (horizontalLines.length < 10 || verticalLines.length < 9) {
    console.log('线条不足，无法进行 KMeans 聚类。');
    return {
      gridCells: [],
      expandedRect: { x: 0, y: 0, width: 0, height: 0 },
      gridHeights: [],
    };
  }

  const horizontalYPositions = horizontalLines.flatMap((line) => [
    line[1],
    line[3],
  ]);
  const verticalXPositions = verticalLines.flatMap((line) => [
    line[0],
    line[2],
  ]);

  const resultH = kmeans(
    horizontalYPositions.map((y) => [y]),
    10,
    { maxIterations: 100 }
  );
  const resultV = kmeans(
    verticalXPositions.map((x) => [x]),
    9,
    { maxIterations: 100 }
  );

  const horizontalClusterCenters = resultH.centroids
    .map((c) => c[0])
    .sort((a, b) => a - b);
  const verticalClusterCenters = resultV.centroids
    .map((c) => c[0])
    .sort((a, b) => a - b);

  const minY = Math.floor(horizontalClusterCenters[0]);
  const maxY = Math.ceil(
    horizontalClusterCenters[horizontalClusterCenters.length - 1]
  );
  const minX = Math.floor(verticalClusterCenters[0]);
  const maxX = Math.ceil(
    verticalClusterCenters[verticalClusterCenters.length - 1]
  );

  // 计算棋盘高度并调整底部位置
  const boardHeight = maxY - minY;
  const bottomOffset = Math.floor(boardHeight * bottomOffsetRatio);
  const adjustedMaxY = maxY - bottomOffset;

  const chessboardRegion = croppedRegion.roi(
    new cv.Rect(minX, minY, maxX - minX, adjustedMaxY - minY)
  );

  const regionW = maxX - minX;
  const regionH = adjustedMaxY - minY;
  const expandW = Math.floor(regionW * expandRatioW);
  const expandH = Math.floor(regionH * expandRatioH);

  const newX = Math.max(0, minX - expandW);
  const newY = Math.max(0, minY - expandH);
  const newW = Math.min(croppedRegion.cols - newX, regionW + 2 * expandW);
  const newH = Math.min(croppedRegion.rows - newY, regionH + 2 * expandH);

  const expandedChessboardRegion = croppedRegion.roi(
    new cv.Rect(newX, newY, newW, newH)
  );

  const rows = 10;
  const cols = 9;
  const gridWidth = Math.floor(newW / cols);
  const gridHeights = calculateGridHeights(newH);

  const gridCells: ImageData[] = [];
  let currentY = 0;

  for (let i = 0; i < rows; i++) {
    const gridHeight = gridHeights[i];
    for (let j = 0; j < cols; j++) {
      const x1 = j * gridWidth;
      const x2 = (j + 1) * gridWidth;
      const gridCell = expandedChessboardRegion.roi(
        new cv.Rect(x1, currentY, x2 - x1, gridHeight)
      );

      const canvas = document.createElement('canvas');
      canvas.width = gridCell.cols;
      canvas.height = gridCell.rows;
      cv.imshow(canvas, gridCell);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        gridCells.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }

      gridCell.delete();
    }
    currentY += gridHeight;
  }

  grayCropped.delete();
  blurCropped.delete();
  edgesCropped.delete();
  lines.delete();
  chessboardRegion.delete();
  expandedChessboardRegion.delete();

  return {
    gridCells,
    expandedRect: { x: newX, y: newY, width: newW, height: newH },
    gridHeights,
  };
}
