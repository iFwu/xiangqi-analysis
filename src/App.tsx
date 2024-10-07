// App.tsx
import { useState, useEffect } from 'preact/hooks';
import cv from '@techstark/opencv-js';
import './app.css';

import { PieceColor, PieceType } from './chessboard/types';
import { detectAndExtractChessboard } from './chessboard/chessboardDetection';
import { detectPieceInCell, detectPieceColor, processPiece } from './chessboard/pieceDetection';
import { createOverlayImage } from './chessboard/overlayCreation';
import { templateMatchingForPiece } from './chessboard/templateMatching';
import { ImageUploader } from './components/ImageUploader';
import { BoardResult } from './components/BoardResult';
import { FENDisplay } from './components/FENDisplay';
import { SolutionDisplay } from './components/SolutionDisplay';
import { generateFenFromPieces } from './chessboard/fenGeneration';
import { updateFEN } from './chessboard/moveHelper';
import { useOpenCV } from './hooks/useOpenCV';
import { useChessEngine } from './hooks/useChessEngine';
import { useDepth } from './hooks/useDepth';
import { DepthControl } from './components/DepthControl';
import { WelcomeModal } from './components/WelcomeModal';
import { Spinner } from './components/Spinner';

export function App() {
  const [overlayImageSrc, setOverlayImageSrc] = useState('');
  const [fenCode, setFenCode] = useState('');
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [chessboardRect, setChessboardRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>();
  const [originalImageSize, setOriginalImageSize] = useState<{
    width: number;
    height: number;
  }>();

  const { templates, isLoading: isOpenCVLoading } = useOpenCV();
  const { bestMove, isCalculating, error, fetchBestMove, setBestMove, isEngineReady } = useChessEngine();
  const { depth, setDepth } = useDepth();
  const isLoading = isOpenCVLoading || !isEngineReady;

  useEffect(() => {
    if (fenCode) {
      fetchBestMove(fenCode, depth);
    }
  }, [fenCode, depth, fetchBestMove]);

  const handleCopyFEN = () => {
    navigator.clipboard.writeText(fenCode);
  };

  const handleNextMove = () => {
    if (!bestMove || bestMove === 'red_wins' || bestMove === 'black_wins') {
      return;
    }
    const newFen = updateFEN(fenCode, bestMove);
    setFenCode(newFen);
    setFenHistory((prev) => [...prev, newFen]);
    setMoveHistory((prev) => [...prev, bestMove]);
    setBestMove('');
  };

  const handlePreviousMove = () => {
    if (fenHistory.length > 1) {
      const newFenHistory = fenHistory.slice(0, -1);
      const newMoveHistory = moveHistory.slice(0, -1);
      const previousFen = newFenHistory[newFenHistory.length - 1];

      setFenHistory(newFenHistory);
      setMoveHistory(newMoveHistory);
      setFenCode(previousFen);
      setBestMove('');
    }
  };

  const processImage = (img: HTMLImageElement) => {
    if (isOpenCVLoading || !templates) {
      return;
    }

    setOriginalImageSize({ width: img.width, height: img.height });
    const { gridCells, chessboardRect } = detectAndExtractChessboard(img);

    const adjustedChessboardRect = {
      x: Math.max(0, chessboardRect.x),
      y: Math.max(0, chessboardRect.y),
      width: Math.min(chessboardRect.width, img.width - chessboardRect.x),
      height: Math.min(chessboardRect.height, img.height - chessboardRect.y),
    };

    setChessboardRect(adjustedChessboardRect);

    const detectedPieces: {
      position: [number, number];
      color: PieceColor;
      type: PieceType;
    }[] = [];

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
          detectedPieces.push({
            position: [row, col],
            color: pieceColor,
            type: pieceType,
          });
        }
      }
    }

    const overlayCanvas = createOverlayImage(
      img,
      adjustedChessboardRect,
      detectedPieces
    );
    setOverlayImageSrc(overlayCanvas.toDataURL());

    const pieceLayout: string[][] = Array(10)
      .fill(null)
      .map(() => Array(9).fill('none'));
    detectedPieces.forEach((piece) => {
      const [row, col] = piece.position;
      if (piece.type !== null) {
        pieceLayout[row][col] = `${piece.color}_${piece.type}`;
      }
    });

    const initialFenCode = generateFenFromPieces(pieceLayout, 'red');
    setFenCode(initialFenCode);
    setFenHistory([initialFenCode]);
  };

  const handleImageUpload = (img: HTMLImageElement) => {
    setFenHistory([]);
    setMoveHistory([]);
    setBestMove('');
    processImage(img);
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <Spinner />
        <p>正在加载必要组件，请稍候...</p>
        <p>如果加载时间过长，请刷新页面重试。</p>
      </div>
    );
  }

  return (
    <>
      <header>
        <h1>象棋棋盘识别与分析</h1>
      </header>
      <main className="app-container">
        <WelcomeModal />
        <div className="content-wrapper">
          <div className="left-column">
            <SolutionDisplay
              bestMove={bestMove}
              isCalculating={isCalculating}
              error={error}
              onNextMove={handleNextMove}
              onPreviousMove={handlePreviousMove}
              moveHistory={moveHistory}
              fenCode={fenCode}
              fenHistory={fenHistory}
            />
          </div>
          <div className="right-column">
            <ImageUploader onImageUpload={handleImageUpload} />
            <BoardResult
              overlayImageSrc={overlayImageSrc}
              chessboardRect={chessboardRect}
              originalImageSize={originalImageSize}
            />
            <FENDisplay fenCode={fenCode} onCopy={handleCopyFEN} />
            <DepthControl depth={depth} onDepthChange={setDepth} />
          </div>
        </div>
      </main>
      <footer>
        <p>
          © 2024 象棋棋盘识别与分析系统 | 
          Powered by <a href="https://github.com/official-pikafish/Pikafish">Pikafish</a>&nbsp;|&nbsp;
          <a href="https://github.com/iFwu/xiangqi-analysis">GitHub 源码仓库</a>
        </p>
      </footer>
    </>
  );
}