import cv from '@techstark/opencv-js';
import { onMounted, onUnmounted, shallowRef, markRaw } from 'vue';
import { PieceName } from '../types';
import { preprocessAllTemplates } from '../utils/cv/templateMatching';
import { useChessStore } from '../stores/chess';

export function useOpenCV() {
  const templates = shallowRef<Record<PieceName, cv.Mat> | undefined>();
  const maxRetries = 10;
  let retries = 0;
  const chessStore = useChessStore();

  const onOpenCVReady = async () => {
    console.log('OpenCV.js is ready');
    try {
      const loadedTemplates = await preprocessAllTemplates();
      if (Object.keys(loadedTemplates).length === 0) {
        chessStore.setError('没有成功加载任何模板');
        return;
      }
      templates.value = markRaw(loadedTemplates);
    } catch (err) {
      chessStore.setError(`加载模板时出错: ${(err as Error).message}`);
    }
  };

  let intervalId: number | undefined;

  onMounted(() => {
    const initialize = async () => {
      intervalId = window.setInterval(async () => {
        if (retries >= maxRetries) {
          chessStore.setError('在最大重试次数后仍未能加载 OpenCV.js');
          clearInterval(intervalId);
          return;
        }
        retries++;
        if (!templates.value && typeof cv !== 'undefined') {
          clearInterval(intervalId);
          await onOpenCVReady();
        } else if (templates.value) {
          clearInterval(intervalId);
        }
      }, 500);
      if (typeof cv !== 'undefined') {
        await new Promise<void>((resolve) => {
          cv.onRuntimeInitialized = resolve;
        });
        await onOpenCVReady();
      } else {
        document.addEventListener('opencv-loaded', onOpenCVReady);
      }
    };

    initialize();
  });

  onUnmounted(() => {
    document.removeEventListener('opencv-loaded', onOpenCVReady);
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return { templates };
}
