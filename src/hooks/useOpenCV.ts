import { useState, useEffect } from 'preact/hooks';
import cv from '@techstark/opencv-js';
import { PieceName } from '../chessboard/types';
import { preprocessAllTemplates } from '../chessboard/templateMatching';

export function useOpenCV() {
  const [templates, setTemplates] = useState<Record<PieceName, cv.Mat> | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await new Promise<void>((resolve) => {
        cv.onRuntimeInitialized = resolve;
      });
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
      }
    };

    initialize();
  }, []);

  return { templates };
}