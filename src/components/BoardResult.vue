<template>
  <section class="board-result-section">
    <h2>分析结果</h2>
    <div
      class="image-container"
      :style="{
        width: `${finalWidth}px`,
        paddingBottom: `${finalHeight}px`,
      }"
    >
      <img
        v-if="overlayImageSrc"
        :src="overlayImageSrc"
        alt="分析结果"
        class="overlay-image"
        :style="{
          left: `${leftOffset}px`,
          width: `${stretchedWidth}px`,
          height: `${originalImageSize.height * scale}px`,
          marginTop: `${-displayY * scale}px`,
        }"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface BoardResultProps {
    overlayImageSrc: string;
    chessboardRect?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    originalImageSize?: {
      width: number;
      height: number;
    };
  }
  const props = withDefaults(defineProps<BoardResultProps>(), {
    chessboardRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    originalImageSize: () => ({ width: 0, height: 0 }),
  });

  const MAX_WIDTH = 360; // 定义最大宽度
  const padding = 15; // 添加间隙

  const displayX = computed(() =>
    Math.max(0, props.chessboardRect.x - padding)
  );
  const displayY = computed(() =>
    Math.max(0, props.chessboardRect.y - padding)
  );

  const displayWidth = computed(() =>
    Math.min(
      props.originalImageSize.width - displayX.value,
      props.chessboardRect.width + 2 * padding
    )
  );

  const displayHeight = computed(() =>
    Math.min(
      props.originalImageSize.height - displayY.value,
      props.chessboardRect.height + 2 * padding
    )
  );

  const scale = computed(() =>
    Math.min(1, MAX_WIDTH / Math.max(displayWidth.value, displayHeight.value))
  );

  const horizontalScale = computed(
    () => props.originalImageSize.width / displayWidth.value
  );

  const finalWidth = computed(() => displayWidth.value * scale.value);
  const finalHeight = computed(() => displayHeight.value * scale.value);

  const stretchedWidth = computed(
    () => finalWidth.value * horizontalScale.value
  );
  const leftOffset = computed(
    () => (finalWidth.value - stretchedWidth.value) / 2
  );
</script>
