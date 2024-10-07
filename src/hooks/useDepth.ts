import { useState, useEffect } from 'preact/hooks';

export function useDepth() {
  const initialDepth = Number(localStorage.getItem('depth')) || 14;
  const [depth, setDepth] = useState(initialDepth);

  useEffect(() => {
    localStorage.setItem('depth', depth.toString());
  }, [depth]);

  return { depth, setDepth };
}