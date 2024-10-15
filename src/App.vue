<template>
  <div>
    <!-- 加载状态处理 -->
    <div v-if="isLoading" class="loading-overlay">
      <Spinner />
      <p>正在加载必要组件，请稍候...</p>
      <p>如果加载时间过长，请刷新页面重试。</p>
    </div>

    <!-- 主界面 -->
    <div v-else>
      <header>
        <h1>象棋棋盘识别与分析</h1>
      </header>
      <main class="app-container">
        <WelcomeModal />
        <div class="content-wrapper">
          <div class="left-column">
            <SolutionDisplay
              :bestMove="bestMove"
              :isCalculating="isCalculating"
              :error="error"
              @nextMove="handleNextMove"
              @previousMove="handlePreviousMove"
              :moveHistory="moveHistory"
              :fenCode="fenCode"
              :fenHistory="fenHistory"
              @fenUpdate="handleFenUpdate"
            />
          </div>
          <div class="right-column">
            <ImageUploader @imageUpload="handleImageUpload" />
            <BoardResult
              :overlayImageSrc="overlayImageSrc"
              :chessboardRect="chessboardRect"
              :originalImageSize="originalImageSize"
            />
            <FENDisplay :fenCode="fenCode" @copy="handleCopyFEN" />
            <DepthControl :depth="depth" @depthChange="setDepth" />
          </div>
        </div>
      </main>
      <footer>
        <p>
          © 2024 象棋棋盘识别与分析系统 | Powered by
          <a href="https://github.com/official-pikafish/Pikafish">Pikafish</a
          >&nbsp;|&nbsp;
          <a href="https://github.com/iFwu/xiangqi-analysis">GitHub 源码仓库</a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import cv from '@techstark/opencv-js';
  import './app.css';

  import { PieceColor, PieceType } from './chessboard/types';
  import { detectAndExtractChessboard } from './chessboard/chessboardDetection';
  import {
    detectPieceInCell,
    detectPieceColor,
    processPiece,
  } from './chessboard/pieceDetection';
  import { createOverlayImage } from './chessboard/overlayCreation';
  import { templateMatchingForPiece } from './chessboard/templateMatching';
  import ImageUploader from './components/ImageUploader.vue';
  import BoardResult from './components/BoardResult.vue';
  import FENDisplay from './components/FENDisplay.vue';
  import SolutionDisplay from './components/SolutionDisplay.vue';
  import { generateFenFromPieces } from './chessboard/fenGeneration';
  import { updateFEN } from './chessboard/moveHelper';
  import { useOpenCV } from './composables/useOpenCV';
  import { useChessEngine } from './composables/useChessEngine';
  import { useDepth } from './composables/useDepth';
  import DepthControl from './components/DepthControl.vue';
  import WelcomeModal from './components/WelcomeModal.vue';
  import Spinner from './components/Spinner.vue';

  const overlayImageSrc = ref('');
  const fenCode = ref('');
  const fenHistory = ref<string[]>([]);
  const moveHistory = ref<string[]>([]);
  const chessboardRect = ref<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>();
  const originalImageSize = ref<{
    width: number;
    height: number;
  }>();

  const { templates, isLoading: isOpenCVLoading } = useOpenCV();
  const {
    bestMove,
    isCalculating,
    error,
    fetchBestMove,
    setBestMove,
    isEngineReady,
  } = useChessEngine();
  const { depth, setDepth } = useDepth();
  const isLoading = computed(
    () => isOpenCVLoading.value || !isEngineReady.value
  );

  watch(
    () => [fenCode.value, depth.value],
    () => {
      if (fenCode.value) {
        fetchBestMove(fenCode.value, depth.value);
      }
    }
  );

  const handleCopyFEN = () => {
    navigator.clipboard.writeText(fenCode.value);
  };

  const handleNextMove = () => {
    if (
      !bestMove.value ||
      bestMove.value === 'red_wins' ||
      bestMove.value === 'black_wins'
    ) {
      return;
    }
    const newFen = updateFEN(fenCode.value, bestMove.value);
    fenCode.value = newFen;
    fenHistory.value.push(newFen);
    moveHistory.value.push(bestMove.value);
    setBestMove('');
  };

  const handlePreviousMove = () => {
    if (fenHistory.value.length > 1) {
      fenHistory.value.pop();
      moveHistory.value.pop();
      fenCode.value = fenHistory.value[fenHistory.value.length - 1];
      setBestMove('');
    }
  };

  const processImage = (img: HTMLImageElement) => {
    if (isOpenCVLoading.value || !templates.value) {
      return;
    }

    originalImageSize.value = { width: img.width, height: img.height };
    const { gridCells, chessboardRect: detectedChessboardRect } =
      detectAndExtractChessboard(img);

    const adjustedChessboardRect = {
      x: Math.max(0, detectedChessboardRect.x),
      y: Math.max(0, detectedChessboardRect.y),
      width: Math.min(
        detectedChessboardRect.width,
        img.width - detectedChessboardRect.x
      ),
      height: Math.min(
        detectedChessboardRect.height,
        img.height - detectedChessboardRect.y
      ),
    };

    chessboardRect.value = adjustedChessboardRect;

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
          pieceType = templateMatchingForPiece(
            cellMat,
            templates.value,
            pieceColor
          );
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
    overlayImageSrc.value = overlayCanvas.toDataURL();

    const pieceLayout: string[][] = Array.from({ length: 10 }, () =>
      Array(9).fill('none')
    );
    detectedPieces.forEach((piece) => {
      const [row, col] = piece.position;
      if (piece.type !== null) {
        pieceLayout[row][col] = `${piece.color}_${piece.type}`;
      }
    });

    const initialFenCode = generateFenFromPieces(pieceLayout, 'red');
    fenCode.value = initialFenCode;
    fenHistory.value = [initialFenCode];
  };

  const handleImageUpload = (img: HTMLImageElement) => {
    fenHistory.value = [];
    moveHistory.value = [];
    setBestMove('');
    processImage(img);
  };

  const handleFenUpdate = (newFen: string) => {
    fenCode.value = newFen;
    fenHistory.value.push(newFen);
    setBestMove('');
  };
</script>
