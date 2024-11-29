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
            <div class="upload-group">
              <ImageUploader @imageUpload="handleImageUpload" />
              <LoadDemo @selectDemo="handleImageUpload" />
            </div>
            <div class="result-group">
              <BoardResult />
              <FENDisplay />
              <DepthControl />
            </div>
          </div>
        </div>
      </main>
      <footer>
        <p>
          2024 象棋棋盘识别与分析系统 | Powered by
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
import LoadDemo from './components/LoadDemo.vue';

const { templates } = useOpenCV();
const { fetchBestMove, isEngineReady } = useChessEngine();
const isLoading = computed(() => {
  const templatesReady = !!templates.value;
  return !isEngineReady.value || !templatesReady;
});

const chessStore = useChessStore();

// 添加调试日志
watch(
  () =>
    [chessStore.fenCode, chessStore.depth, chessStore.isProcessing] as [
      string,
      number,
      boolean,
    ],
  ([newFen, newDepth, isProcessing]: [string, number, boolean], [oldFen]) => {
    console.log('[App] 状态变化:', {
      oldFen,
      newFen,
      isProcessing,
      bestMove: chessStore.bestMove,
    });

    // 只有在处理完成且有新的 FEN 码时才触发分析
    if (newFen && !isProcessing && newFen !== oldFen) {
      console.log('[App] 触发引擎分析');
      fetchBestMove(newFen, newDepth);
    } else {
      console.log('[App] 跳过引擎分析:', {
        hasFen: !!newFen,
        isProcessing,
        fenChanged: newFen !== oldFen,
      });
    }
  }
);

const { processUploadedImage } = useImageProcessing(templates);

const handleImageUpload = async (img: HTMLImageElement) => {
  console.log('[App] 开始处理新图片');
  await processUploadedImage(img);
  console.log('[App] 图片处理完成');
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

  .left-column {
    order: 2;
  }

  .right-column {
    order: 1;
  }

  .upload-group {
    order: 1;
  }

  .result-group {
    order: 2;
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
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .upload-group,
  .result-group {
    width: 100%;
  }
}
</style>
