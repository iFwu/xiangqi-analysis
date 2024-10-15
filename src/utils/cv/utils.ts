import cv from '@techstark/opencv-js';

export function displayImage(
  title: string,
  image: cv.Mat | ImageData,
  index: number
) {
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

  console.log(
    '%c ',
    `
    font-size: 1px;
    padding: ${canvas.height / 2}px ${canvas.width / 2}px;
    background: url(${dataUrl}) no-repeat;
    background-size: ${canvas.width}px ${canvas.height}px;
  `
  );
}
