import { PieceColor } from './types';
import cv from "@techstark/opencv-js";

// @ts-ignore
window.cv = cv;

// 检测格子中是否有棋子
export function detectPieceInCell(cellImage: ImageData, contrastThreshold = 30): boolean {
  const mat = cv.matFromImageData(cellImage);
  const grayCell = new cv.Mat();
  cv.cvtColor(mat, grayCell, cv.COLOR_RGBA2GRAY); // 注意颜色空间可能是 RGBA
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
  const mat = cv.matFromImageData(cellImage);
  const hsvImage = new cv.Mat();
  cv.cvtColor(mat, hsvImage, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsvImage, hsvImage, cv.COLOR_RGB2HSV);
  console.log('HSV 转换完成');

  // 显示原始图像
  // displayImage('Original Cell Image', cellImage);

  // 红色掩码
  const redLower1 = cv.matFromArray(1, 3, cv.CV_8UC1, [0, 120, 120]);
  const redUpper1 = cv.matFromArray(1, 3, cv.CV_8UC1, [10, 255, 255]);
  const redLower2 = cv.matFromArray(1, 3, cv.CV_8UC1, [160, 120, 120]);
  const redUpper2 = cv.matFromArray(1, 3, cv.CV_8UC1, [179, 255, 255]);

  const maskRed1 = new cv.Mat();
  const maskRed2 = new cv.Mat();
  cv.inRange(hsvImage, redLower1, redUpper1, maskRed1);
  cv.inRange(hsvImage, redLower2, redUpper2, maskRed2);
  const maskRed = new cv.Mat();
  cv.bitwise_or(maskRed1, maskRed2, maskRed);
  console.log('红色掩码创建完成');

  // 黑色掩码
  const blackLower = cv.matFromArray(1, 3, cv.CV_8UC1, [0, 0, 0]);
  const blackUpper = cv.matFromArray(1, 3, cv.CV_8UC1, [180, 255, 80]);
  const maskBlack = new cv.Mat();
  cv.inRange(hsvImage, blackLower, blackUpper, maskBlack);
  console.log('黑色掩码创建完成');

  // 显示红色和黑色掩码
  // displayImage('Red Mask', maskRed, index);
  // displayImage('Black Mask', maskBlack, index);

  // 显示掩码后的原始图像
  const maskedRed = new cv.Mat();
  const maskedBlack = new cv.Mat();
  cv.bitwise_and(mat, mat, maskedRed, maskRed);
  cv.bitwise_and(mat, mat, maskedBlack, maskBlack);
  // displayImage('Masked Red Image', maskedRed, index);
  // displayImage('Masked Black Image', maskedBlack, index);

  const totalPixels = cellImage.width * cellImage.height;
  const redRatio = cv.countNonZero(maskRed) / totalPixels;
  const blackRatio = cv.countNonZero(maskBlack) / totalPixels;

  console.log(`红色比例: ${redRatio}, 黑色比例: ${blackRatio}`);

  // Clean up
  mat.delete(); hsvImage.delete();
  redLower1.delete(); redUpper1.delete(); redLower2.delete(); redUpper2.delete();
  maskRed1.delete(); maskRed2.delete(); maskRed.delete();
  blackLower.delete(); blackUpper.delete(); maskBlack.delete();
  maskedRed.delete(); maskedBlack.delete();

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
export function processPiece(cellImage: ImageData, pieceColor: 'red' | 'black' | 'unknown', index: number): ImageData {
  console.log(`开始处理格子 ${index} 的棋子`);
  const mat = cv.matFromImageData(cellImage);
  let mask: cv.Mat;
  if (pieceColor === 'red') {
    mask = extractRedPieceMask(mat);
  } else if (pieceColor === 'black') {
    mask = extractBlackPieceMask(mat);
  } else {
    mat.delete();
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
  mat.delete();
  mask.delete();
  processedMat.delete();
  if (processedMatRGBA !== processedMat) {
    processedMatRGBA.delete();
  }

  return processedImageData;
}

// 提取红色棋子的掩码
export function extractRedPieceMask(cellMat: cv.Mat): cv.Mat {
  const hsvImage = new cv.Mat();
  cv.cvtColor(cellMat, hsvImage, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsvImage, hsvImage, cv.COLOR_RGB2HSV);
  const redLower1 = cv.matFromArray(1, 3, cv.CV_8UC1, [0, 100, 100]);
  const redUpper1 = cv.matFromArray(1, 3, cv.CV_8UC1, [10, 255, 255]);
  const redLower2 = cv.matFromArray(1, 3, cv.CV_8UC1, [160, 100, 100]);
  const redUpper2 = cv.matFromArray(1, 3, cv.CV_8UC1, [179, 255, 255]);
  const maskRed1 = new cv.Mat();
  const maskRed2 = new cv.Mat();
  cv.inRange(hsvImage, redLower1, redUpper1, maskRed1);
  cv.inRange(hsvImage, redLower2, redUpper2, maskRed2);
  const maskRed = new cv.Mat();
  cv.bitwise_or(maskRed1, maskRed2, maskRed);

  // 清理内存
  hsvImage.delete(); maskRed1.delete(); maskRed2.delete();
  redLower1.delete(); redUpper1.delete(); redLower2.delete(); redUpper2.delete();
  return maskRed;
}

// 提取黑色棋子的掩码
export function extractBlackPieceMask(cellMat: cv.Mat): cv.Mat {
  const hsvImage = new cv.Mat();
  cv.cvtColor(cellMat, hsvImage, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsvImage, hsvImage, cv.COLOR_RGB2HSV);
  const blackLower = cv.matFromArray(1, 3, cv.CV_8UC1, [0, 0, 0]);
  const blackUpper = cv.matFromArray(1, 3, cv.CV_8UC1, [180, 255, 100]);
  const maskBlack = new cv.Mat();
  cv.inRange(hsvImage, blackLower, blackUpper, maskBlack);

  // 清理内存
  hsvImage.delete(); blackLower.delete(); blackUpper.delete();
  return maskBlack;
}

// 提取最大轮廓区域
export function extractLargestContourRegion(maskImage: cv.Mat): cv.Mat {
  // 保留原始掩码图像
  const originalMask = maskImage.clone();
  console.log(`提取最大轮廓区域，输入图像尺寸: ${maskImage.cols}x${maskImage.rows}`);

  // 形态学闭操作
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.morphologyEx(maskImage, maskImage, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 2);

  // 可视化形态学操作后的图像
  displayImage("形态学操作后的图像", maskImage);

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

  // 确保返回的是灰度图像
  const result = new cv.Mat();
  cv.threshold(croppedImage, result, 0, 255, cv.THRESH_BINARY);
  croppedImage.delete();

  // 清理内存
  kernel.delete(); contours.delete(); hierarchy.delete();
  originalMask.delete();

  return result;
}

// 显示图像的辅助函数
export function displayImage(title: string, image: cv.Mat): void {
  const canvas = document.createElement('canvas');
  canvas.width = image.cols;
  canvas.height = image.rows;
  // cv.imshow(canvas, image);
  const dataUrl = canvas.toDataURL();
  console.log(`${title}:`, dataUrl);
}

// 应用掩码到原始图像的辅助函数
export function applyMask(originalImage: cv.Mat, mask: cv.Mat): cv.Mat {
  const result = new cv.Mat();
  cv.bitwise_and(originalImage, originalImage, result, mask);
  return result;
}