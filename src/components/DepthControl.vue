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
        :value="depth"
        @input="handleDepthChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  interface DepthControlProps {
    depth: number;
    onDepthChange: (newDepth: number) => void;
  }

  const props = withDefaults(defineProps<DepthControlProps>(), {
    depth: 15,
  });

  const handleDepthChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onDepthChange(Number(target.value));
  };
</script>
