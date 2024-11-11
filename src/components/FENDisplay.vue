<template>
  <section class="section">
    <h2>FEN代码</h2>
    <div class="fen-container">
      <input type="text" :value="fenCode" readonly />
      <button @click="onCopy">复制</button>
    </div>
  </section>
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

<style scoped>
.fen-container {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.fen-container input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.fen-container button {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
