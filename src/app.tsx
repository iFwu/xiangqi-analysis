import { useState, useEffect } from 'preact/hooks'
import './app.css'
import { ChessboardState, PieceColor, PieceName, PieceType } from './chessboard/types'
import { detectAndExtractChessboard } from './chessboard/chessboardDetection';
import { detectPieceInCell, detectPieceColor, processPiece } from './chessboard/pieceDetection';
import { createOverlayImage } from './chessboard/overlayCreation';
import { preprocessAllTemplates, templateMatchingForPiece } from './chessboard/templateMatching';
import cv from "@techstark/opencv-js";

export function App() {
  const [imageSrc, setImageSrc] = useState('')
  const [overlayImageSrc, setOverlayImageSrc] = useState('')
  const [chessboardState, setChessboardState] = useState<ChessboardState | null>(null)
  const [templates, setTemplates] = useState<Record<PieceName, cv.Mat> | null>(null)
  const [templatesLoaded, setTemplatesLoaded] = useState(false)
  const [fenCode, setFenCode] = useState('')

  useEffect(() => {
    const initializeOpenCV = async () => {
      await new Promise<void>((resolve) => {
        cv.onRuntimeInitialized = resolve;
      });
      console.log("OpenCV.js is ready");
      try {
        const loadedTemplates = await preprocessAllTemplates();
        if (Object.keys(loadedTemplates).length === 0) {
          console.error("No templates were successfully loaded");
          return;
        }
        setTemplates(loadedTemplates);
        setTemplatesLoaded(true);
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };

    initializeOpenCV();
  }, []);

  useEffect(() => {
    if (templatesLoaded) {
      loadAndProcessDebugImage();
    }
  }, [templatesLoaded]);

  const loadAndProcessDebugImage = () => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(img.src);
      processImage(img);
    };
    img.src = "/chessboard2.png"
  };

  const handleImageUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setImageSrc(img.src)
          processImage(img);
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = (img: HTMLImageElement) => {
    const { gridCells, chessboardRect } = detectAndExtractChessboard(img);
    console.log("Detected chessboard rect:", chessboardRect);  // 添加这行日志
    const detectedPieces: { position: [number, number], color: PieceColor, type: PieceType | null }[] = [];

    gridCells.forEach((cell, index) => {
      const hasPiece = detectPieceInCell(cell);
      if (hasPiece) {
        const pieceColor = detectPieceColor(cell);
        if (pieceColor !== 'unknown') {
          const row = Math.floor(index / 9);
          const col = index % 9;
          let pieceType = null;
          if (templates && templatesLoaded) {
            const processedPieceImage = processPiece(cell, pieceColor);
            const cellMat = cv.matFromImageData(processedPieceImage);
            pieceType = templateMatchingForPiece(cellMat, templates, pieceColor);
            cellMat.delete();
          }
          detectedPieces.push({ position: [row, col], color: pieceColor, type: pieceType });
        }
      }
    });

    const overlayCanvas = createOverlayImage(img, chessboardRect, detectedPieces);
    setOverlayImageSrc(overlayCanvas.toDataURL());
  };

  const handleCopyFEN = () => {
    navigator.clipboard.writeText(fenCode);
  }

  return (
    <div className="app-container">
      <header>
        <h1>象棋棋盘识别与分析</h1>
      </header>
      <main>
        <div className="content-wrapper">
          <section className="upload-section">
            <h2>上传图片</h2>
            <input type="file" onChange={handleImageUpload} />
          </section>
          <section className="result-section">
            <h2>分析结果</h2>
            {imageSrc && (
              <div className="image-container">
                <img src={imageSrc} alt="上传的图片" className="original-image" />
                {overlayImageSrc && (
                  <img
                    src={overlayImageSrc}
                    alt="分析结果"
                    className="overlay-image"
                  />
                )}
              </div>
            )}
          </section>
        </div>
        <div className="fen-section">
          <h2>FEN代码</h2>
          <div className="fen-container">
            <input type="text" value={fenCode} readOnly />
            <button onClick={handleCopyFEN}>复制</button>
          </div>
        </div>
        <div className="solution-section">
          <h2>解法展示</h2>
          <canvas id="solutionCanvas" width="300" height="300"></canvas>
          <div className="solution-controls">
            <button>上一步</button>
            <button>下一步</button>
          </div>
        </div>
      </main>
      <footer>
        <p>© 2023 象棋棋盘识别与分析系统</p>
      </footer>
    </div>
  )
}