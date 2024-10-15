import cv from '@techstark/opencv-js';
import { ref, onMounted, onUnmounted, markRaw } from 'vue';
import { PieceName } from '../chessboard/types';
import { preprocessAllTemplates } from '../chessboard/templateMatching';

export function useOpenCV() {
  const templates = ref<Record<PieceName, any> | null>(null);
  const isLoading = ref(true);

  const onOpenCVReady = async () => {
    console.log('OpenCV.js is ready');
    try {
      const loadedTemplates = await preprocessAllTemplates();
      if (Object.keys(loadedTemplates).length === 0) {
        console.error('No templates were successfully loaded');
        return;
      }
      templates.value = markRaw(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      isLoading.value = false;
    }
  };

  let intervalId: number | undefined;

  onMounted(() => {
    const initialize = async () => {
      if (typeof cv !== 'undefined') {
        await new Promise<void>((resolve) => {
          cv.onRuntimeInitialized = resolve;
        });
        await onOpenCVReady();
      } else {
        document.addEventListener('opencv-loaded', onOpenCVReady);
        intervalId = window.setInterval(() => {
          if (!isLoading.value && typeof cv !== 'undefined') {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = undefined;
            }
            onOpenCVReady();
          }
        }, 500);
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

  return { templates, isLoading };
}
