<template>
  <section class="section">
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
  </section>
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
    // 确保历史记录索引有效
    if (index >= fenHistory.value.length) {
      console.error('历史记录不同步:', {
        moveIndex: index,
        fenHistoryLength: fenHistory.value.length,
        moveHistoryLength: moveHistory.value.length,
        fenHistory: fenHistory.value,
        moveHistory: moveHistory.value,
      });
      return '未知走法';
    }

    try {
      return moveToChineseNotation(fenHistory.value[index], move);
    } catch (err) {
      console.error('转换走法出错:', err);
      return '未知走法';
    }
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
.solution-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
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
