import { useState, useEffect, useRef } from 'preact/hooks';
import './app.css';
import { ChessboardState, PieceColor, PieceName, PieceType } from './chessboard/types';
import { detectAndExtractChessboard } from './chessboard/chessboardDetection';
import { detectPieceInCell, detectPieceColor, processPiece } from './chessboard/pieceDetection';
import { createOverlayImage } from './chessboard/overlayCreation';
import { preprocessAllTemplates, templateMatchingForPiece } from './chessboard/templateMatching';
import cv from "@techstark/opencv-js";
import { ImageUploader } from './components/ImageUploader';
import { ChessboardOverlay } from './components/ChessboardOverlay';
import { FENDisplay } from './components/FENDisplay';
import { SolutionDisplay } from './components/SolutionDisplay';

export function App() {
  const [imageSrc, setImageSrc] = useState('');
  const [overlayImageSrc, setOverlayImageSrc] = useState('');
  const [chessboardState, setChessboardState] = useState<ChessboardState | null>(null);
  const [templates, setTemplates] = useState<Record<PieceName, cv.Mat> | null>(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [fenCode, setFenCode] = useState('');
  const overlayRef = useRef<HTMLImageElement>(null);
  const [chessboardRect, setChessboardRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [detectedPieces, setDetectedPieces] = useState<{ position: [number, number], color: PieceColor, type: PieceType | null }[]>([]);

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
    img.src = "/chessboard2.png";
  };

  const processImage = (img: HTMLImageElement) => {
    const { gridCells, chessboardRect } = detectAndExtractChessboard(img);
    console.log("Original image size:", img.width, img.height);
    console.log("Detected chessboard rect:", chessboardRect);

    const adjustedChessboardRect = {
      x: Math.max(0, Math.min(chessboardRect.x, img.width - chessboardRect.width)),
      y: Math.max(0, Math.min(chessboardRect.y, img.height - chessboardRect.height)),
      width: Math.min(chessboardRect.width, img.width),
      height: Math.min(chessboardRect.height, img.height)
    };

    console.log("Adjusted chessboard rect:", adjustedChessboardRect);
    setChessboardRect(adjustedChessboardRect);

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

    setDetectedPieces(detectedPieces);
    const overlayCanvas = createOverlayImage(img, chessboardRect, detectedPieces);
    setOverlayImageSrc(overlayCanvas.toDataURL());
  };

  const handleCopyFEN = () => {
    navigator.clipboard.writeText(fenCode);
  };

  return (
    <div className="app-container">
      <header>
        <h1>象棋棋盘识别与分析</h1>
      </header>
      <main>
        <div className="content-wrapper">
          <div className="left-column">
            <ImageUploader onImageUpload={processImage} />
            <ChessboardOverlay imageSrc={imageSrc} overlayImageSrc={overlayImageSrc} />
            <FENDisplay fenCode={fenCode} onCopy={handleCopyFEN} />
          </div>
          <SolutionDisplay />
        </div>
      </main>
      <footer>
        <p>© 2023 象棋棋盘识别与分析系统</p>
      </footer>
    </div>
  );
}