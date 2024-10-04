// App.tsx
import cv from "@techstark/opencv-js";
import { useState, useEffect, useCallback } from 'preact/hooks';

import './app.css';

import { PieceColor, PieceName, PieceType } from './chessboard/types';
import { detectAndExtractChessboard } from './chessboard/chessboardDetection';
import { detectPieceInCell, detectPieceColor, processPiece } from './chessboard/pieceDetection';
import { createOverlayImage } from './chessboard/overlayCreation';
import { preprocessAllTemplates, templateMatchingForPiece } from './chessboard/templateMatching';
import { ImageUploader } from './components/ImageUploader';
import { ChessboardOverlay } from './components/ChessboardOverlay';
import { FENDisplay } from './components/FENDisplay';
import { SolutionDisplay } from './components/SolutionDisplay';
import { generateFenFromPieces } from './chessboard/fenGeneration';
import { ChessEngine } from './chessEngine';
import { updateFEN } from './chessboard/moveHelper';

export function App() {
  const [overlayImageSrc, setOverlayImageSrc] = useState('');
  const [fenCode, setFenCode] = useState('');
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const [engine, setEngine] = useState<ChessEngine | null>(null);
  const [bestMove, setBestMove] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const [templates, setTemplates] = useState<Record<PieceName, cv.Mat> | null>(null);
  const [chessboardRect, setChessboardRect] = useState<{ x: number; y: number; width: number; height: number }>();
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number }>();

  // Initialize OpenCV and Chess Engine
  useEffect(() => {
    const initialize = async () => {
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
      } catch (error) {
        console.error("Error loading templates:", error);
      }

      // Initialize the chess engine
      const newEngine = new ChessEngine();
      await newEngine.initEngine();
      setEngine(newEngine);
    };

    initialize();
  }, []);

  // Process image when both templates and engine are ready
  useEffect(() => {
    if (templates && engine) {
      loadAndProcessDebugImage(templates);
    }
  }, [templates, engine]);

  const loadAndProcessDebugImage = (templates: Record<PieceName, cv.Mat>) => {
    const img = new Image();
    img.onload = () => {
      processImage(img, templates);
    };
    img.src = "/test.png";
  };

  const processImage = (img: HTMLImageElement, templates: Record<PieceName, cv.Mat>) => {
    setOriginalImageSize({ width: img.width, height: img.height });
    const { gridCells, chessboardRect } = detectAndExtractChessboard(img);
    console.log("Original image size:", img.width, img.height);
    console.log("Detected chessboard rect:", chessboardRect);

    const adjustedChessboardRect = {
      x: Math.max(0, chessboardRect.x),
      y: Math.max(0, chessboardRect.y),
      width: Math.min(chessboardRect.width, img.width - chessboardRect.x),
      height: Math.min(chessboardRect.height, img.height - chessboardRect.y)
    };

    console.log("Adjusted chessboard rect:", adjustedChessboardRect);
    setChessboardRect(adjustedChessboardRect);

    const detectedPieces: { position: [number, number], color: PieceColor, type: PieceType }[] = [];

    for (let index = 0; index < gridCells.length; index++) {
      const cell = gridCells[index];
      const hasPiece = detectPieceInCell(cell);
      if (hasPiece) {
        const pieceColor = detectPieceColor(cell);
        if (pieceColor !== 'unknown') {
          const row = Math.floor(index / 9);
          const col = index % 9;
          let pieceType: PieceType = 'none';
          const processedPieceImage = processPiece(cell, pieceColor);
          const cellMat = cv.matFromImageData(processedPieceImage);
          pieceType = templateMatchingForPiece(cellMat, templates, pieceColor);
          cellMat.delete();
          detectedPieces.push({ position: [row, col], color: pieceColor, type: pieceType });
          console.log(`Detected piece at (${row}, ${col}): color=${pieceColor}, type=${pieceType}`);
        }
      }
    }

    const overlayCanvas = createOverlayImage(img, adjustedChessboardRect, detectedPieces);
    setOverlayImageSrc(overlayCanvas.toDataURL());

    const pieceLayout: string[][] = Array(10).fill(null).map(() => Array(9).fill('none'));
    detectedPieces.forEach((piece) => {
      const [row, col] = piece.position;
      if (piece.type !== null) {
        pieceLayout[row][col] = `${piece.color}_${piece.type}`;
      }
    });

    const initialFenCode = generateFenFromPieces(pieceLayout, 'red');
    setFenCode(initialFenCode);
    setFenHistory([initialFenCode]);
    // We don't call fetchBestMove here; the next useEffect will handle it
  };

  // Fetch best move whenever fenCode changes and engine is ready
  useEffect(() => {
    if (fenCode && engine) {
      fetchBestMove(fenCode);
    }
  }, [fenCode, engine]);

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
      if (move === 'red_wins' || move === 'black_wins') {
        // 游戏结束，不需要进一步操作
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [engine]);

  const handleNextMove = async () => {
    if (!bestMove || bestMove === 'red_wins' || bestMove === 'black_wins') {
      setError('No valid move available');
      return;
    }
    // Apply the best move to the current FEN
    const newFen = updateFEN(fenCode, bestMove);
    setFenCode(newFen);
    setFenHistory(prev => [...prev, newFen]);
    setMoveHistory(prev => [...prev, bestMove]);
    setBestMove(''); // Reset bestMove
    // The useEffect will fetch the next best move automatically
  };

  const handlePreviousMove = () => {
    if (fenHistory.length > 1) {
      // Remove the last FEN and move from their respective histories
      const newFenHistory = fenHistory.slice(0, -1);
      const newMoveHistory = moveHistory.slice(0, -1);
      
      // Set the current FEN to the previous one
      const previousFen = newFenHistory[newFenHistory.length - 1];
      
      setFenHistory(newFenHistory);
      setMoveHistory(newMoveHistory);
      setFenCode(previousFen);
      setBestMove(''); // Reset bestMove to trigger a new calculation
    }
  };

  const handleImageUpload = (img: HTMLImageElement) => {
    if (templates) {
      processImage(img, templates);
    } else {
      console.error("Templates not loaded yet");
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>象棋棋盘识别与分析</h1>
      </header>
      <main>
        <div className="content-wrapper">
          <div className="left-column">
            <ImageUploader onImageUpload={handleImageUpload} />
            <ChessboardOverlay 
              overlayImageSrc={overlayImageSrc} 
              chessboardRect={chessboardRect} 
              originalImageSize={originalImageSize}
            />
            <FENDisplay 
              fenCode={fenCode} 
              onCopy={handleCopyFEN} 
            />
          </div>
          <SolutionDisplay 
            bestMove={bestMove}
            loading={loading}
            error={error}
            onNextMove={handleNextMove}
            onPreviousMove={handlePreviousMove}
            moveHistory={moveHistory}
            fenCode={fenCode}
            fenHistory={fenHistory}
          />
        </div>
      </main>
      <footer>
        <p>© 2023 象棋棋盘识别与分析系统</p>
      </footer>
    </div>
  );
}