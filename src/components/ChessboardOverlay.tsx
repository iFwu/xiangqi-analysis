import { h } from 'preact';

interface ChessboardOverlayProps {
  imageSrc: string;
  overlayImageSrc: string;
}

export function ChessboardOverlay({ imageSrc, overlayImageSrc }: ChessboardOverlayProps) {
  return (
    <section className="result-section">
      <h2>分析结果</h2>
      {imageSrc && (
        <div className="image-container">
          <img src={imageSrc} alt="上传的图片" className="original-image" />
          {overlayImageSrc && (
            <img src={overlayImageSrc} alt="分析结果" className="overlay-image" />
          )}
        </div>
      )}
    </section>
  );
}