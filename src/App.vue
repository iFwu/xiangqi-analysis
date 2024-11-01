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

<style scoped>
  .app-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
  }

  .content-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    box-sizing: border-box;
  }

  .left-column,
  .right-column {
    width: 100%;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .loading-overlay p {
    margin-top: 20px;
    font-size: 1.2rem;
    color: #333;
  }

  /* 媒体查询 */
  @media (max-width: 768px) {
    .content-wrapper {
      flex-direction: column;
      gap: 0;
    }

    .solution-section {
      order: 1;
    }
    .upload-section {
      order: 0;
    }
    .board-result-section {
      order: 2;
    }
    .fen-section {
      order: 3;
    }
    .depth-control-section {
      order: 4;
    }
  }

  @media (min-width: 769px) {
    .content-wrapper {
      flex-direction: row;
      align-items: flex-start;
    }

    .left-column {
      width: calc(50% - 1rem);
      position: sticky;
      top: 1rem;
      align-self: flex-start;
    }

    .right-column {
      width: calc(50% - 1rem);
    }

    .solution-section {
      height: calc(100vh - 2rem);
      overflow-y: auto;
      order: -1;
    }
  }
</style>
