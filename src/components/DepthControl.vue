<template>
  <div class="depth-control-section">
    <h2>搜索深度控制</h2>
    <div class="depth-slider-container">
      <label for="depth-slider">当前深度: {{ depth }}</label>
      <input
        id="depth-slider"
        type="range"
        min="10"
        max="30"
        v-model.number="depth"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useChessStore } from '../stores/chess';
  import { storeToRefs } from 'pinia';

  const chessStore = useChessStore();
  const { depth } = storeToRefs(chessStore);
</script>
