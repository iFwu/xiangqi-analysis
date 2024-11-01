<template>
  <div class="changelog">
    <h3 @click="toggleExpand" class="changelog-title">
      <span class="changelog-arrow">{{ isExpanded ? '▼' : '▶' }}</span>
      更新日志
    </h3>
    <div
      v-if="isExpanded"
      class="changelog-content markdown-content"
      v-html="htmlContent"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { html } from '../../CHANGELOG.md';

  const isExpanded = ref(false);

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
  };

  const htmlContent = html;
</script>

<style scoped>
  .changelog {
    text-align: center;
    margin-bottom: 15px;
    font-size: 0.9rem; /* 减小整体字体大小 */
  }

  .changelog-title {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    font-size: 1rem; /* 保持标题字体大小不变 */
  }

  .changelog-arrow {
    margin-right: 10px;
    font-size: 0.8em;
  }

  .changelog-content {
    text-align: left;
    padding-left: 10px;
    padding-right: 10px;
  }

  .changelog-content ul {
    list-style-type: disc; /* 恢复项目符号 */
    padding-left: 20px; /* 为项目符号留出空间 */
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .changelog-content li {
    margin-bottom: 3px;
    position: relative;
  }

  .changelog-content li::before {
    content: '•'; /* 自定义项目符号 */
    position: absolute;
    left: -15px;
    color: #3498db; /* 使用主题色 */
  }

  .changelog-content p {
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .changelog-content h1,
  .changelog-content h2,
  .changelog-content h3,
  .changelog-content h4,
  .changelog-content h5,
  .changelog-content h6 {
    margin-top: 10px;
    margin-bottom: 5px;
    color: #2c3e50; /* 使用深色以增加对比度 */
  }

  .changelog-content h1 {
    font-size: 1.2rem;
  }

  .changelog-content h2 {
    font-size: 1.1rem;
  }

  .changelog-content h3 {
    font-size: 1rem;
  }

  .changelog-content h4,
  .changelog-content h5,
  .changelog-content h6 {
    font-size: 0.9rem;
  }
</style>
