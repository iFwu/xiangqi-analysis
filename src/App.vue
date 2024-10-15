<template>
  <div>
    <!-- 加载状态处理 -->
    <div v-if="isLoading" class="loading-overlay">
      <Spinner />
      <p>正在加载必要组件，请稍候...</p>
      <p>如果加载时间过长，请刷新页面重试。</p>
    </div>

    <!-- 主界面 -->
    <div v-else>
      <header>
        <h1>象棋棋盘识别与分析</h1>
      </header>
      <main class="app-container">
        <WelcomeModal />
        <div class="content-wrapper">
          <div class="left-column">
            <SolutionDisplay />
          </div>
          <div class="right-column">
            <ImageUploader @imageUpload="handleImageUpload" />
            <BoardResult />
            <FENDisplay />
            <DepthControl />
          </div>
        </div>
      </main>
      <footer>
        <p>
          © 2024 象棋棋盘识别与分析系统 | Powered by
          <a href="https://github.com/official-pikafish/Pikafish">Pikafish</a
          >&nbsp;|&nbsp;
          <a href="https://github.com/iFwu/xiangqi-analysis">GitHub 源码仓库</a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue';

  import { useOpenCV } from './composables/useOpenCV';
  import { useChessEngine } from './composables/useChessEngine';
  import { useChessStore } from './stores/chess';
  import { useImageProcessing } from './composables/useImageProcessing';

  import ImageUploader from './components/ImageUploader.vue';
  import BoardResult from './components/BoardResult.vue';
  import FENDisplay from './components/FENDisplay.vue';
  import SolutionDisplay from './components/SolutionDisplay.vue';
  import DepthControl from './components/DepthControl.vue';
  import WelcomeModal from './components/WelcomeModal.vue';
  import Spinner from './components/Spinner.vue';

  const { templates } = useOpenCV();
  const { fetchBestMove, isEngineReady } = useChessEngine();
  const isLoading = computed(() => {
    const templatesReady = !!templates.value;
    return !isEngineReady.value || !templatesReady;
  });

  const chessStore = useChessStore();

  watch(
    () => [chessStore.fenCode, chessStore.depth],
    () => {
      if (chessStore.fenCode) {
        fetchBestMove(chessStore.fenCode, chessStore.depth);
      }
    }
  );

  const { processUploadedImage } = useImageProcessing(templates);

  const handleImageUpload = (img: HTMLImageElement) => {
    chessStore.resetHistory();
    processUploadedImage(img);
  };
</script>
