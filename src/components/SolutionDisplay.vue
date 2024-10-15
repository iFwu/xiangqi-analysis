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
  import { moveToChineseNotation } from '../chessboard/moveHelper';

  interface SolutionDisplayProps {
    bestMove: string;
    isCalculating: boolean;
    error: string | null;
    onNextMove: () => void;
    onPreviousMove: () => void;
    moveHistory: string[];
    fenCode: string;
    fenHistory: string[];
    onFenUpdate: (newFen: string) => void;
  }

  const props = defineProps<SolutionDisplayProps>();

  const currentMoveColor = computed(() =>
    props.moveHistory.length % 2 === 0 ? '红方' : '黑方'
  );
  const currentMoveNumber = computed(() => props.moveHistory.length + 1);

  const moveItems = computed(() =>
    props.moveHistory.map((move, index) => {
      const fenBeforeMove = props.fenHistory[index];
      return moveToChineseNotation(fenBeforeMove, move);
    })
  );

  const isGameOver = computed(
    () => props.bestMove === 'red_wins' || props.bestMove === 'black_wins'
  );
  const gameOverMessage = computed(() =>
    props.bestMove === 'red_wins'
      ? '红方胜'
      : props.bestMove === 'black_wins'
        ? '黑方胜'
        : ''
  );
</script>
