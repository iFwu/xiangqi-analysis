import { useState, useEffect } from 'preact/hooks'
import './app.css'
import { ChessboardDisplay } from './chessboard/ChessboardDisplay'
import { ChessboardState, PieceColor } from './chessboard/types'
import { detectAndExtractChessboard } from './chessboard/chessboardDetection';
import { detectPieceInCell, detectPieceColor, processPiece } from './chessboard/pieceDetection';
import cv from "@techstark/opencv-js";

export function App() {
  const [imageSrc, setImageSrc] = useState('')
  const [chessboardState, setChessboardState] = useState<ChessboardState | null>(null)
  const [gridCells, setGridCells] = useState<ImageData[]>([])
  const [detectedPieces, setDetectedPieces] = useState<{ image: string, color: PieceColor }[]>([])

  useEffect(() => {
    cv.onRuntimeInitialized = () => {
      console.log("OpenCV.js is ready");
      loadAndProcessDebugImage();
    };
  }, []);

  const loadAndProcessDebugImage = () => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(img.src);
      const detectedGridCells = detectAndExtractChessboard(img);
      setGridCells(detectedGridCells);
      detectPieces(detectedGridCells);
    };
    img.src = "/public/chessboard2.png";
  };

  const handleImageUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setImageSrc(img.src)
          const detectedGridCells = detectAndExtractChessboard(img);
          setGridCells(detectedGridCells);
          detectPieces(detectedGridCells);
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const detectPieces = (cells: ImageData[]) => {
    console.log(`开始检测棋子，共 ${cells.length} 个格子`);
    const detectedPieces: { image: string, color: PieceColor }[] = [];
    let processedCount = 0;
    const maxProcessCount = 40; // 设置要处理的最大格子数

    cells.forEach((cell, index) => {
      if (processedCount >= maxProcessCount) return;

      console.log(`检测第 ${index + 1} 个格子`);
      const hasPiece = detectPieceInCell(cell);
      console.log(`格子 ${index + 1} 是否有棋子: ${hasPiece}`);
      if (hasPiece) {
        const pieceColor = detectPieceColor(cell, index);
        console.log(`格子 ${index + 1} 棋子颜色: ${pieceColor}`);
        if (pieceColor !== 'unknown') {
          const processedPiece = processPiece(cell, pieceColor);
          console.log(`格子 ${index + 1} 处理后的棋子尺寸: ${processedPiece.width}x${processedPiece.height}`);
          const pieceImage = imageDataToDataURL(processedPiece);
          detectedPieces.push({ image: pieceImage, color: pieceColor });
          processedCount++;
        }
      }
    });

    console.log(`检测完成，共检测到 ${detectedPieces.length} 个棋子`);
    setDetectedPieces(detectedPieces);
  };

  const imageDataToDataURL = (imageData: ImageData): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  const imageStyle = {
    maxWidth: '400px',
    maxHeight: '400px',
    objectFit: 'contain' as const,
  }

  return (
    <div className="app-container">
      <h1>棋盘识别与分析</h1>

      <div className="upload-section">
        <input type="file" onChange={handleImageUpload} />
        {imageSrc && <img src={imageSrc} alt="uploaded" style={imageStyle} />}
      </div>

      {chessboardState && <ChessboardDisplay chessboardState={chessboardState} />}

      <div className="detected-pieces">
        <h2>检测到的棋子：</h2>
        <div className="piece-grid">
          {detectedPieces.map((piece, index) => (
            <div key={index} className="piece-item">
              <img src={piece.image} alt={`${piece.color} piece`} style={{ width: '50px', height: '50px' }} />
              <p>{piece.color === 'red' ? '红方棋子' : '黑方棋子'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}