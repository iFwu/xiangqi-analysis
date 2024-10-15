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
  interface FENDisplayProps {
    fenCode: string;
    onCopy: () => void;
  }

  defineProps<FENDisplayProps>();
</script>
