import { PieceColor } from './types';
import cv from "@techstark/opencv-js";

// @ts-ignore
window.cv = cv;

// 检测格子中是否有棋子
export function detectPieceInCell(cellImage: ImageData, contrastThreshold = 30): boolean {
  const mat = cv.matFromImageData(cellImage);
  const grayCell = new cv.Mat();
  cv.cvtColor(mat, grayCell, cv.COLOR_RGBA2GRAY);
  const mean = new cv.Mat();
  const stddev = new cv.Mat();
  cv.meanStdDev(grayCell, mean, stddev);
  const contrast = stddev.doubleAt(0, 0);
  // 清理内存
  mat.delete(); grayCell.delete(); mean.delete(); stddev.delete();
  return contrast > contrastThreshold;
}

// 检测棋子的颜色
export function detectPieceColor(cellImage: ImageData, index: number): PieceColor {
  const hsvImage = convertToHSV(cellImage);

  const redMask = createColorMask(hsvImage, [0, 120, 120], [10, 255, 255], [160, 120, 120], [179, 255, 255]);
  const blackMask = createColorMask(hsvImage, [0, 0, 0], [180, 255, 80]);

  const totalPixels = cellImage.width * cellImage.height;
  const redPixels = cv.countNonZero(redMask);
  const blackPixels = cv.countNonZero(blackMask);
  const redRatio = redPixels / totalPixels;
  const blackRatio = blackPixels / totalPixels;

  // 清理内存
  hsvImage.delete();
  redMask.delete();
  blackMask.delete();

  if (redRatio > 0.05) {
    return 'red';
  } else if (blackRatio > 0.05) {
    return 'black';
  }
  return 'unknown';
}

// 处理棋子图像
export function processPiece(cellImage: ImageData, pieceColor: PieceColor): ImageData {
  let mask: cv.Mat;
  if (pieceColor === 'red') {
    mask = extractRedPieceMask(cellImage);
  } else if (pieceColor === 'black') {
    mask = extractBlackPieceMask(cellImage);
  } else {
    return cellImage;
  }

  const processedMat = extractLargestContourRegion(mask);

  // 确保处理后的图像是 4 通道的
  let processedMatRGBA = new cv.Mat();
  if (processedMat.channels() === 1) {
    cv.cvtColor(processedMat, processedMatRGBA, cv.COLOR_GRAY2RGBA);
  } else if (processedMat.channels() === 3) {
    cv.cvtColor(processedMat, processedMatRGBA, cv.COLOR_RGB2RGBA);
  } else {
    processedMatRGBA = processedMat.clone();
  }

  // 将处理后的 Mat 转换为 ImageData
  const processedImageData = new ImageData(
    new Uint8ClampedArray(processedMatRGBA.data),
    processedMatRGBA.cols,
    processedMatRGBA.rows
  );

  // 清理内存
  mask.delete();
  processedMat.delete();
  processedMatRGBA.delete();

  return processedImageData;
}

// 提取红色棋子的掩码
function extractRedPieceMask(cellImage: ImageData): cv.Mat {
  const hsvImage = convertToHSV(cellImage);
  const maskRed = createColorMask(hsvImage, [0, 100, 100], [10, 255, 255], [160, 100, 100], [179, 255, 255]);
  hsvImage.delete();
  return maskRed;
}

// 提取黑色棋子的掩码
function extractBlackPieceMask(cellImage: ImageData): cv.Mat {
  const hsvImage = convertToHSV(cellImage);
  const maskBlack = createColorMask(hsvImage, [0, 0, 0], [180, 255, 100]);
  hsvImage.delete();
  return maskBlack;
}

// 提取最大轮廓区域
function extractLargestContourRegion(maskImage: cv.Mat): cv.Mat {
  // 保留原始掩码图像
  const originalMask = maskImage.clone();

  // 形态学闭操作
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.morphologyEx(maskImage, maskImage, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 2);

  // 查找轮廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(maskImage, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  if (contours.size() === 0) {
    // 清理内存
    kernel.delete(); contours.delete(); hierarchy.delete();
    return originalMask;
  }

  // 获取图像面积
  const imgArea = maskImage.cols * maskImage.rows;

  // 筛选符合条件的轮廓
  const validContours: { contour: cv.Mat, contourArea: number, rect: cv.Rect }[] = [];
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const rect = cv.boundingRect(contour);
    const aspectRatio = rect.width / rect.height;
    if (0.9 <= aspectRatio && aspectRatio <= 1.1) {
      const contourArea = rect.width * rect.height;
      const areaRatio = contourArea / imgArea;
      if (areaRatio >= 0.5) {
        validContours.push({ contour, contourArea, rect });
      }
    }
    contour.delete(); // 释放当前轮廓的内存
  }

  if (validContours.length === 0) {
    // 清理内存
    kernel.delete(); contours.delete(); hierarchy.delete();
    return originalMask;
  }

  // 按面积排序，选择最大面积的轮廓
  validContours.sort((a, b) => b.contourArea - a.contourArea);
  const bestContour = validContours[0];
  const { x, y, width, height } = bestContour.rect;

  // 使用原始掩码图像进行裁剪，返回结果
  const croppedImage = originalMask.roi(new cv.Rect(x, y, width, height));

  // 清理内存
  kernel.delete(); contours.delete(); hierarchy.delete();
  originalMask.delete();

  return croppedImage;
}

// 将 ImageData 转换为 HSV Mat
function convertToHSV(image: ImageData): cv.Mat {
  const mat = cv.matFromImageData(image);
  const rgbMat = new cv.Mat();
  cv.cvtColor(mat, rgbMat, cv.COLOR_RGBA2RGB);
  const hsvImage = new cv.Mat();
  cv.cvtColor(rgbMat, hsvImage, cv.COLOR_RGB2HSV);
  mat.delete();
  rgbMat.delete();
  return hsvImage;
}

// 创建掩码
function createMask(hsvImage: cv.Mat, lowerBounds: number[], upperBounds: number[]): cv.Mat {
  const mask = new cv.Mat();
  cv.inRange(hsvImage, cv.matFromArray(1, 3, cv.CV_8UC1, lowerBounds), cv.matFromArray(1, 3, cv.CV_8UC1, upperBounds), mask);
  return mask;
}

// 创建颜色掩码
function createColorMask(hsvImage: cv.Mat, lower1: number[], upper1: number[], lower2?: number[], upper2?: number[]): cv.Mat {
  const mask1 = createMask(hsvImage, lower1, upper1);
  if (lower2 && upper2) {
    const mask2 = createMask(hsvImage, lower2, upper2);
    const combinedMask = new cv.Mat();
    cv.bitwise_or(mask1, mask2, combinedMask);
    mask1.delete();
    mask2.delete();
    return combinedMask;
  }
  return mask1;
}