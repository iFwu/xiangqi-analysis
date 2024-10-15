<template>
  <div class="fen-section">
    <h2>FEN代码</h2>
    <div class="fen-container">
      <input type="text" :value="fenCode" readonly />
      <button @click="onCopy">复制</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useChessStore } from '../stores/chess';
  import { storeToRefs } from 'pinia';

  const chessStore = useChessStore();
  const { fenCode } = storeToRefs(chessStore);

  const onCopy = () => {
    navigator.clipboard.writeText(fenCode.value);
  };
</script>
