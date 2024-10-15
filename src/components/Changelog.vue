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
