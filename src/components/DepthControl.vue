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

<style scoped>
  .depth-control-section {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .depth-control-section h2 {
    text-align: left;
  }

  .depth-slider-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .depth-slider-container label {
    font-weight: bold;
  }

  #depth-slider {
    width: 100%;
  }
</style>
