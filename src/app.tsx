import { useState, useEffect } from 'preact/hooks'
import './app.css'
import { ChessboardState, PieceColor, PieceName } from './chessboard/types'
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
        console.log("Loaded templates:", loadedTemplates);
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
    img.src = "/chessboard2.png";
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
    const detectedPieces: { position: [number, number], color: PieceColor, type?: string | null }[] = [];

    console.log("Total grid cells:", gridCells.length);
    console.log("Chessboard rect:", chessboardRect);

    // 只处理前两个棋子
    for (let index = 0; index < Math.min(4, gridCells.length); index++) {
      const cell = gridCells[index];
      const hasPiece = detectPieceInCell(cell);
      if (hasPiece) {
        const pieceColor = detectPieceColor(cell);
        if (pieceColor !== 'unknown') {
          const row = Math.floor(index / 9);  // 修正为 9x10 的棋盘
          const col = index % 9;
          let pieceType = null;
          if (templates && templatesLoaded) {
            // 处理棋子图像
            const processedPieceImage = processPiece(cell, pieceColor);
            const cellMat = cv.matFromImageData(processedPieceImage);
            pieceType = templateMatchingForPiece(cellMat, templates, pieceColor, index);
            cellMat.delete();
          }
          detectedPieces.push({ position: [row, col], color: pieceColor, type: pieceType });
        }
      }
    }

    console.log("Detected pieces:", detectedPieces);

    const overlayCanvas = createOverlayImage(img, chessboardRect, detectedPieces);
    setOverlayImageSrc(overlayCanvas.toDataURL());

    // 更新棋盘状态（如果需要的话）
    // setChessboardState(...);
  };

  const imageStyle = {
    maxWidth: '400px',
    maxHeight: '800px',
    objectFit: 'contain' as const,
  }

  return (
    <div className="app-container">
      <h1>棋盘识别与分析</h1>

      <div className="upload-section">
        <input type="file" onChange={handleImageUpload} />
        {imageSrc && (
          <div style={{ position: 'relative' }}>
            <img src={imageSrc} alt="uploaded" style={imageStyle} />
            {overlayImageSrc && (
              <img
                src={overlayImageSrc}
                alt="overlay"
                style={{
                  ...imageStyle,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* {chessboardState && <ChessboardDisplay chessboardState={chessboardState} />} */}
    </div>
  )
}