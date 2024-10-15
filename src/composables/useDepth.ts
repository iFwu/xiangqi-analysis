import { ref, watch } from 'vue';

export function useDepth() {
  const initialDepth = Number(localStorage.getItem('depth')) || 14;
  const depth = ref(initialDepth);

  watch(depth, (newDepth) => {
    localStorage.setItem('depth', newDepth.toString());
  });

  const setDepth = (newDepth: number) => {
    depth.value = newDepth;
  };

  return { depth, setDepth };
}
