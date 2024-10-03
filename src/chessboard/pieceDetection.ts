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
  console.log(`检测棋子对比度: ${contrast}`);
  // 清理内存
  mat.delete(); grayCell.delete(); mean.delete(); stddev.delete();
  return contrast > contrastThreshold;
}

// 检测棋子的颜色
export function detectPieceColor(cellImage: ImageData, index: number): PieceColor {
  console.log(`开始检测格子 ${index} 的棋子颜色`);
  const hsvImage = convertToHSV(cellImage);
  console.log('HSV 转换完成');

  // 显示原始图像
  displayImage('Original Cell Image', cellImage, index);

  const redMask = createColorMask(hsvImage, [0, 120, 120], [10, 255, 255], [160, 120, 120], [179, 255, 255]);
  console.log('红色掩码创建完成');
  const blackMask = createColorMask(hsvImage, [0, 0, 0], [180, 255, 80]);
  console.log('黑色掩码创建完成');

  // 显示红色和黑色掩码
  displayImage('Red Mask', redMask, index);
  displayImage('Black Mask', blackMask, index);

  // 应用掩码到原始图像
  const maskedRed = applyMask(cellImage, redMask);
  const maskedBlack = applyMask(cellImage, blackMask);
  displayImage('Masked Red Image', maskedRed, index);
  displayImage('Masked Black Image', maskedBlack, index);

  const totalPixels = cellImage.width * cellImage.height;
  const redPixels = cv.countNonZero(redMask);
  const blackPixels = cv.countNonZero(blackMask);
  const redRatio = redPixels / totalPixels;
  const blackRatio = blackPixels / totalPixels;

  console.log(`红色比例: ${redRatio}, 黑色比例: ${blackRatio}`);

  // 清理内存
  hsvImage.delete();
  redMask.delete();
  blackMask.delete();

  if (redRatio > 0.05) {
    console.log('检测到红色棋子');
    return 'red';
  } else if (blackRatio > 0.05) {
    console.log('检测到黑色棋子');
    return 'black';
  }
  console.log('未检测到棋子');
  return 'unknown';
}

// 处理棋子图像
export function processPiece(cellImage: ImageData, pieceColor: PieceColor): ImageData {
  console.log(`处理棋子，颜色: ${pieceColor}`);
  let mask: cv.Mat;
  if (pieceColor === 'red') {
    mask = extractRedPieceMask(cellImage);
    console.log('提取红色棋子掩码完成');
  } else if (pieceColor === 'black') {
    mask = extractBlackPieceMask(cellImage);
    console.log('提取黑色棋子掩码完成');
  } else {
    console.log('未知颜色，返回原始图像');
    return cellImage;
  }

  const processedMat = extractLargestContourRegion(mask);
  console.log(`处理后的图像尺寸: ${processedMat.cols}x${processedMat.rows}`);

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
  console.log(`提取最大轮廓区域，输入图像尺寸: ${maskImage.cols}x${maskImage.rows}`);

  // 形态学闭操作
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.morphologyEx(maskImage, maskImage, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 2);

  // 查找轮廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(maskImage, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  console.log(`找到 ${contours.size()} 个轮廓`);

  if (contours.size() === 0) {
    console.log("未找到任何轮廓。");
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
    console.log("没有找到符合条件的轮廓。");
    // 清理内存
    kernel.delete(); contours.delete(); hierarchy.delete();
    return originalMask;
  }

  // 按面积排序，选择最大面积的轮廓
  validContours.sort((a, b) => b.contourArea - a.contourArea);
  const bestContour = validContours[0];
  const { x, y, width, height } = bestContour.rect;

  console.log(`最大轮廓区域: x=${x}, y=${y}, width=${width}, height=${height}`);

  // 使用原始掩码图像进行裁剪，返回结果
  const croppedImage = originalMask.roi(new cv.Rect(x, y, width, height));
  console.log(`裁剪后的图像尺寸: ${croppedImage.cols}x${croppedImage.rows}`);

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

// 显示图像的辅助函数
function displayImage(title: string, image: cv.Mat | ImageData, index: number) {
  console.log(`%c${title} (格子 ${index}):`, 'color: blue; font-weight: bold;');

  const canvas = document.createElement('canvas');
  if (image instanceof cv.Mat) {
    canvas.width = image.cols;
    canvas.height = image.rows;
    cv.imshow(canvas, image);
  } else {
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(image, 0, 0);
  }

  const dataUrl = canvas.toDataURL();

  console.log('%c ', `
    font-size: 1px;
    padding: ${canvas.height / 2}px ${canvas.width / 2}px;
    background: url(${dataUrl}) no-repeat;
    background-size: ${canvas.width}px ${canvas.height}px;
  `);
}

// 应用掩码到原始图像的辅助函数
function applyMask(originalImage: ImageData, mask: cv.Mat): ImageData {
  const originalMat = cv.matFromImageData(originalImage);
  const result = new cv.Mat();
  cv.bitwise_and(originalMat, originalMat, result, mask);
  const processedImageData = new ImageData(
    new Uint8ClampedArray(result.data),
    result.cols,
    result.rows
  );
  originalMat.delete();
  result.delete();
  return processedImageData;
}