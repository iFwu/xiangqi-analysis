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
          height: `${(originalImageSize?.height || 0) * scale}px`,
          marginTop: `${-displayY * scale}px`,
        }"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useChessStore } from '../stores/chess';
  import { storeToRefs } from 'pinia';

  const chessStore = useChessStore();
  const { overlayImageSrc, chessboardRect, originalImageSize } =
    storeToRefs(chessStore);

  const MAX_WIDTH = 360; // 定义最大宽度
  const padding = 15; // 添加间隙

  const displayX = computed(() =>
    Math.max(0, (chessboardRect.value?.x || 0) - padding)
  );
  const displayY = computed(() =>
    Math.max(0, (chessboardRect.value?.y || 0) - padding)
  );

  const displayWidth = computed(() =>
    Math.min(
      (originalImageSize.value?.width || 0) - displayX.value,
      (chessboardRect.value?.width || 0) + 2 * padding
    )
  );

  const displayHeight = computed(() =>
    Math.min(
      (originalImageSize.value?.height || 0) - displayY.value,
      (chessboardRect.value?.height || 0) + 2 * padding
    )
  );

  const scale = computed(() =>
    Math.min(1, MAX_WIDTH / Math.max(displayWidth.value, displayHeight.value))
  );

  const horizontalScale = computed(
    () => (originalImageSize.value?.width || 0) / displayWidth.value
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
