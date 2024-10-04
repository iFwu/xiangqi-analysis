import { useState, useEffect, useCallback } from 'preact/hooks';
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
import { generateFenFromPieces } from './chessboard/fenGeneration';
import { ChessEngine } from './chessEngine';
import { updateFEN, decodeBestMove } from './chessboard/fenUpdate';

export function App() {
  const [imageSrc, setImageSrc] = useState('');
  const [overlayImageSrc, setOverlayImageSrc] = useState('');
  const [chessboardState, setChessboardState] = useState<ChessboardState | null>(null);
  const [templates, setTemplates] = useState<Record<PieceName, cv.Mat> | null>(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [fenCode, setFenCode] = useState('');
  const [chessboardRect, setChessboardRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [detectedPieces, setDetectedPieces] = useState<{ position: [number, number], color: PieceColor, type: PieceType | null }[]>([]);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [includeFenSuffix, setIncludeFenSuffix] = useState(true);
  const [engine, setEngine] = useState<ChessEngine | null>(null);
  const [bestMove, setBestMove] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

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

    // 初始化象棋引擎
    const newEngine = new ChessEngine();
    newEngine.initEngine().then(() => setEngine(newEngine));

    return () => {
      // 清理逻辑（如果需要）
    };
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
    img.src = "/test.png";
  };

  const processImage = (img: HTMLImageElement) => {
    setOriginalImageSize({ width: img.width, height: img.height });
    const { gridCells, chessboardRect } = detectAndExtractChessboard(img);
    console.log("Original image size:", img.width, img.height);
    console.log("Detected chessboard rect:", chessboardRect);

    // 确保 chessboardRect 的值在图像范围内
    const adjustedChessboardRect = {
      x: Math.max(0, chessboardRect.x),
      y: Math.max(0, chessboardRect.y),
      width: Math.min(chessboardRect.width, img.width - chessboardRect.x),
      height: Math.min(chessboardRect.height, img.height - chessboardRect.y)
    };

    console.log("Adjusted chessboard rect:", adjustedChessboardRect);
    setChessboardRect(adjustedChessboardRect);

    const detectedPieces: { position: [number, number], color: PieceColor, type: PieceType }[] = [];

    gridCells.forEach((cell, index) => {
      const hasPiece = detectPieceInCell(cell);
      if (hasPiece) {
        const pieceColor = detectPieceColor(cell);
        if (pieceColor !== 'unknown') {
          const row = Math.floor(index / 9);
          const col = index % 9;
          let pieceType: PieceType = 'none';
          if (templates && templatesLoaded) {
            const processedPieceImage = processPiece(cell, pieceColor);
            const cellMat = cv.matFromImageData(processedPieceImage);
            pieceType = templateMatchingForPiece(cellMat, templates, pieceColor);
            cellMat.delete();
          }
          detectedPieces.push({ position: [row, col], color: pieceColor, type: pieceType });
          console.log(`Detected piece at (${row}, ${col}): color=${pieceColor}, type=${pieceType}`);
        }
      }
    });

    setDetectedPieces(detectedPieces);
    const overlayCanvas = createOverlayImage(img, chessboardRect, detectedPieces);
    setOverlayImageSrc(overlayCanvas.toDataURL());

    const pieceLayout: string[][] = Array(10).fill(null).map(() => Array(9).fill('none'));
    detectedPieces.forEach((piece) => {
      const [row, col] = piece.position;
      if (piece.type !== null) {
        pieceLayout[row][col] = `${piece.color}_${piece.type}`;
      }
    });

    console.log("Piece layout:");
    console.table(pieceLayout);

    const fenCode = generateFenFromPieces(pieceLayout, includeFenSuffix);
    console.log('Generated FEN:', fenCode);
    setFenCode(fenCode);

    // 在生成 FEN 后立即获取最佳走法
    if (engine) {
      fetchBestMove(fenCode);
    }
  };

  const handleCopyFEN = () => {
    navigator.clipboard.writeText(fenCode);
  };

  const fetchBestMove = useCallback(async (fen: string) => {
    if (!engine) return;
    setLoading(true);
    setError(null);
    try {
      const move = await engine.getBestMove(fen);
      setBestMove(move);
      const newFen = updateFEN(fen, move);
      setFenCode(newFen);
      setMoveHistory(prev => [...prev, move]);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [engine]);

  const handleNextMove = useCallback(() => {
    if (fenCode) {
      fetchBestMove(fenCode);
    }
  }, [fenCode, fetchBestMove]);

  return (
    <div className="app-container">
      <header>
        <h1>象棋棋盘识别与分析</h1>
      </header>
      <main>
        <div className="content-wrapper">
          <div className="left-column">
            <ImageUploader onImageUpload={processImage} />
            <ChessboardOverlay 
              overlayImageSrc={overlayImageSrc} 
              chessboardRect={chessboardRect} 
              originalImageSize={originalImageSize}
            />
            <FENDisplay 
              fenCode={fenCode} 
              onCopy={handleCopyFEN} 
              onToggleSuffix={() => setIncludeFenSuffix(!includeFenSuffix)}
              includeSuffix={includeFenSuffix}
            />
          </div>
          <SolutionDisplay 
            bestMove={bestMove}
            loading={loading}
            error={error}
            onNextMove={handleNextMove}
            moveHistory={moveHistory}
            fenCode={fenCode}  // 新增这一行
          />
        </div>
      </main>
      <footer>
        <p>© 2023 象棋棋盘识别与分析系统</p>
      </footer>
    </div>
  );
}