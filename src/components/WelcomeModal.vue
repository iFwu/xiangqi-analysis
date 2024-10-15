<template>
  <div v-if="isOpen" class="modal-overlay">
    <dialog open class="welcome-modal">
      <div class="welcome-modal-content">
        <h2>欢迎使用</h2>
        <p>该应用正在开发完善中</p>
        <p>目前在 JJ象棋 残局截图上进行了测试</p>
        <p>请注意：需要在设置中关闭行棋提示</p>
        <Changelog />
        <div class="button-group">
          <button @click="handleClose(false)" class="primary-button">
            我知道了
          </button>
          <button @click="handleClose(true)" class="secondary-button">
            不再提示
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import Changelog from './Changelog.vue';

  const APP_VERSION = import.meta.env.VITE_GIT_COMMIT_HASH || 'development';

  const isOpen = ref(false);

  onMounted(() => {
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    const skipFutureModals =
      localStorage.getItem('skipFutureModals') === 'true';

    if (!skipFutureModals || lastSeenVersion !== APP_VERSION) {
      isOpen.value = true;
    }
  });

  const handleClose = (skip: boolean) => {
    isOpen.value = false;
    localStorage.setItem('lastSeenVersion', APP_VERSION);
    if (skip) {
      localStorage.setItem('skipFutureModals', 'true');
    } else {
      localStorage.removeItem('skipFutureModals');
    }
  };
</script>
