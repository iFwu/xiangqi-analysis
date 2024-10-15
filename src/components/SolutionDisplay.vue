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
