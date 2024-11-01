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

<style scoped>
  .fen-section {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .fen-section h2 {
    text-align: left;
  }

  .fen-container {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center; /* 添加这行以垂直居中对齐项目 */
  }

  .fen-container input {
    flex: 1; /* 让输入框占据剩余空间 */
    margin: 0; /* 移除之前的 margin */
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .fen-container button {
    flex-shrink: 0; /* 防止按钮被压缩 */
    white-space: nowrap; /* 防止文本换行 */
  }
</style>
