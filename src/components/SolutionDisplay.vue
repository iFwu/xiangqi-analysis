<template>
  <div class="solution-section">
    <h2>解法展示</h2>
    <div class="chessboard-display">
      <ChessboardDisplay
        :fen="fenCode"
        :bestMove="isGameOver ? '' : bestMove"
        @fenUpdate="onFenUpdate"
      />
    </div>
    <div class="solution-controls">
      <button @click="onPreviousMove" :disabled="moveHistory.length === 0">
        上一步
      </button>
      <button
        @click="onNextMove"
        :disabled="isCalculating || !bestMove || isGameOver"
      >
        下一步
      </button>
    </div>
    <div class="solution-debug">
      <p v-if="isCalculating">正在计算最佳走法...</p>
      <p v-if="error" :style="{ color: 'red' }">{{ error }}</p>
      <p v-if="!isGameOver && bestMove">
        {{ currentMoveColor }}最佳走法：
        {{ moveToChineseNotation(fenCode, bestMove) }} （第
        {{ currentMoveNumber }} 步）
      </p>
      <p v-if="isGameOver" :style="{ fontWeight: 'bold', color: 'green' }">
        {{ gameOverMessage }}
      </p>
    </div>
    <div class="move-list">
      <span v-for="(move, index) in moveItems" :key="index" class="move-item">
        {{ move }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import ChessboardDisplay from './ChessboardDisplay.vue';
  import { moveToChineseNotation } from '../utils/notationUtils';
  import { useChessStore } from '../stores/chess';
  import { storeToRefs } from 'pinia';

  const chessStore = useChessStore();
  const { bestMove, isCalculating, error, moveHistory, fenCode, fenHistory } =
    storeToRefs(chessStore);

  const onNextMove = () => {
    chessStore.handleNextMove();
  };

  const onPreviousMove = () => {
    chessStore.handlePreviousMove();
  };

  const onFenUpdate = (newFen: string) => {
    chessStore.setFenCode(newFen);
  };

  const currentMoveColor = computed(() =>
    moveHistory.value.length % 2 === 0 ? '红方' : '黑方'
  );

  const currentMoveNumber = computed(() => moveHistory.value.length + 1);

  const moveItems = computed(() =>
    moveHistory.value.map((move, index) => {
      const fenBeforeMove = fenHistory.value[index];
      return moveToChineseNotation(fenBeforeMove, move);
    })
  );

  const isGameOver = computed(
    () => bestMove.value === 'red_wins' || bestMove.value === 'black_wins'
  );

  const gameOverMessage = computed(() =>
    bestMove.value === 'red_wins'
      ? '红方胜'
      : bestMove.value === 'black_wins'
        ? '黑方胜'
        : ''
  );
</script>

<style scoped>
  .solution-section {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .solution-section h2 {
    text-align: left;
  }

  .solution-section > *:not(h2) {
    text-align: center;
  }

  .solution-controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    border-radius: 4px;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 1em;
    font-weight: 500;
    background-color: var(--primary-color);
    color: #fff;
    cursor: pointer;
    transition:
      background-color 0.3s,
      opacity 0.3s;
    display: inline-block; /* 确保按钮可以被居中 */
  }

  button:hover {
    background-color: var(--primary-hover-color);
  }

  button:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .chessboard-display {
    margin-bottom: 1rem;
  }

  .move-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-start;
  }

  .move-item {
    background-color: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9em;
    display: inline-block;
    margin-bottom: 0.25rem;
  }

  .move-item:nth-child(odd) {
    background-color: #ffebee; /* 浅红色背景 */
  }

  .move-item:nth-child(even) {
    background-color: #e3f2fd; /* 浅蓝色背景 */
  }

  .solution-debug {
    margin: 1rem 0;
    font-size: 1.1em;
  }

  .solution-debug p {
    margin: 0.5rem 0;
  }
</style>
