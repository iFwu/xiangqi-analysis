import './ChessboardOverlay.css';

interface ChessboardOverlayProps {
  overlayImageSrc: string;
  chessboardRect?: { x: number; y: number; width: number; height: number };
  originalImageSize?: { width: number; height: number };
}

const MAX_WIDTH = 400; // 在 JavaScript 中定义 max-width

export function ChessboardOverlay({
  overlayImageSrc,
  chessboardRect = { x: 0, y: 0, width: 0, height: 0 },
  originalImageSize = { width: 0, height: 0 },
}: ChessboardOverlayProps) {
  // 添加间隙
  const padding = 15;

  // 计算显示区域
  const displayX = Math.max(0, chessboardRect.x - padding);
  const displayY = Math.max(0, chessboardRect.y - padding);
  const displayWidth = Math.min(
    originalImageSize.width - displayX,
    chessboardRect.width + 2 * padding
  );
  const displayHeight = Math.min(
    originalImageSize.height - displayY,
    chessboardRect.height + 2 * padding
  );

  // 计算缩放比例，进一步限制最大宽度为 MAX_WIDTH
  const scale = Math.min(1, MAX_WIDTH / Math.max(displayWidth, displayHeight));
  const horizontalScale = originalImageSize.width / displayWidth;

  // 计算最终的显示尺寸
  const finalWidth = displayWidth * scale;
  const finalHeight = displayHeight * scale;

  // 计算水平拉伸后的宽度
  const stretchedWidth = finalWidth * horizontalScale;

  // 计算水平拉伸后图像的左边距，使其居中
  const leftOffset = (finalWidth - stretchedWidth) / 2;

  return (
    <section className="result-section">
      <h2>分析结果</h2>
      <div
        className="image-container"
        style={{
          width: `${finalWidth}px`,
          paddingBottom: `${finalHeight}px`,
        }}
      >
        <img
          src={overlayImageSrc}
          alt="分析结果"
          className="overlay-image"
          style={{
            left: `${leftOffset}px`, // 使用计算后的左边距
            width: `${stretchedWidth}px`, // 使用水平拉伸后的宽度
            height: `${originalImageSize.height * scale}px`,
            marginTop: `${-displayY * scale}px`,
          }}
        />
      </div>
    </section>
  );
}
