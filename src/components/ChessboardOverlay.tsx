import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface ChessboardOverlayProps {
  overlayImageSrc: string;
  chessboardRect: { x: number, y: number, width: number, height: number };
  originalImageSize: { width: number, height: number };
}

export function ChessboardOverlay({ overlayImageSrc, chessboardRect, originalImageSize }: ChessboardOverlayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 添加间隙
  const padding = 40;

  // 计算显示区域
  const displayX = Math.max(0, chessboardRect.x - padding);
  const displayY = Math.max(0, chessboardRect.y - padding);
  const displayWidth = Math.min(originalImageSize.width - displayX, chessboardRect.width + 2 * padding);
  const displayHeight = Math.min(originalImageSize.height - displayY, chessboardRect.height + 2 * padding);

  // 计算缩放比例，进一步限制最大宽度为400px
  const scale = Math.min(1, 400 / Math.max(displayWidth, displayHeight));

  // 计算最终的显示尺寸
  const finalWidth = displayWidth * scale;
  const finalHeight = displayHeight * scale;

  // 计算宽高比，用于占位器
  const aspectRatio = finalHeight / finalWidth;

  useEffect(() => {
    setImageLoaded(false);
    // 预加载图片
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = overlayImageSrc;
  }, [overlayImageSrc]);

  return (
    <section className="result-section">
      <h2>分析结果</h2>
      <div 
        className="image-container" 
        style={{
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative',
          paddingBottom: `${(finalHeight / finalWidth) * 100}%`,
        }}
      >
        <div 
          className="image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            display: imageLoaded ? 'none' : 'block',
          }}
        />
        {overlayImageSrc && (
          <img
            src={overlayImageSrc}
            alt="分析结果"
            className="overlay-image"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${originalImageSize.width * scale}px`,
              height: `${originalImageSize.height * scale}px`,
              marginLeft: `${-displayX * scale}px`,
              marginTop: `${-displayY * scale}px`,
              display: imageLoaded ? 'block' : 'none',
            }}
          />
        )}
      </div>
    </section>
  );
}