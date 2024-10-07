import cv from '@techstark/opencv-js';
import { useState, useEffect } from 'preact/hooks';
import { PieceName } from '../chessboard/types';
import { preprocessAllTemplates } from '../chessboard/templateMatching';

export function useOpenCV() {
  const [ templates, setTemplates ] = useState<Record<PieceName, any> | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);

  const onOpenCVReady = async () => {
    console.log('OpenCV.js is ready');
    try {
      const loadedTemplates = await preprocessAllTemplates();
      if (Object.keys(loadedTemplates).length === 0) {
        console.error('No templates were successfully loaded');
        return;
      }
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const initialize = async () => {
      if (cv) {
        await new Promise<void>((resolve) => {
          cv.onRuntimeInitialized = resolve;
        });
        await onOpenCVReady();
      } else {
        document.addEventListener('opencv-loaded', onOpenCVReady);
      }
    }

    initialize();

    return () => {
      document.removeEventListener('opencv-loaded', onOpenCVReady);
    };
  }, []);

  return { templates, isLoading };
}