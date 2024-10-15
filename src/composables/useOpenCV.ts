import cv from '@techstark/opencv-js';
import { onMounted, onUnmounted, shallowRef, markRaw } from 'vue';
import { PieceName } from '../types';
import { preprocessAllTemplates } from '../utils/cv/templateMatching';
import { useChessStore } from '../stores/chess';
import { storeToRefs } from 'pinia';

export function useOpenCV() {
  const templates = shallowRef<Record<PieceName, cv.Mat> | undefined>();
  const maxRetries = 10;
  let retries = 0;
  const chessStore = useChessStore();
  const { error } = storeToRefs(chessStore);

  const onOpenCVReady = async () => {
    console.log('OpenCV.js is ready');
    try {
      const loadedTemplates = await preprocessAllTemplates();
      if (Object.keys(loadedTemplates).length === 0) {
        error.value = '没有成功加载任何模板';
        return;
      }
      templates.value = markRaw(loadedTemplates);
    } catch (err) {
      error.value = `加载模板时出错: ${(err as Error).message}`;
    }
  };

  let intervalId: number | undefined;

  onMounted(() => {
    const initialize = async () => {
      intervalId = window.setInterval(async () => {
        if (retries >= maxRetries) {
          error.value = '在最大重试次数后仍未能加载 OpenCV.js';
          clearInterval(intervalId);
          return;
        }
        retries++;
        if (!templates.value && typeof cv !== 'undefined') {
          clearInterval(intervalId);
          await onOpenCVReady();
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
