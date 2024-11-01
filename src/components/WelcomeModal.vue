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

<style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .welcome-modal {
    padding: 20px;
    border-radius: 12px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 90%;
    width: 500px;
    position: fixed;
    z-index: 1000;
    background-color: white;
  }

  .welcome-modal::backdrop {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .welcome-modal-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .welcome-modal h2 {
    margin-bottom: 15px;
    color: #2c3e50;
    font-size: 1.5rem;
  }

  .welcome-modal p {
    margin: 5px 0; /* 将底部边距从 10px 减少到 5px */
    color: #34495e;
    font-size: 1rem;
  }

  .welcome-modal p:last-of-type {
    margin-bottom: 15px;
  }

  .welcome-modal .button-group {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px; /* 将上边距从 20px 减少到 10px */
    flex-wrap: wrap;
  }

  .welcome-modal button {
    padding: 10px 20px;
    font-size: 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition:
      background-color 0.3s,
      transform 0.1s;
    flex: 1;
    min-width: 120px;
  }

  .welcome-modal button:hover {
    transform: translateY(-2px);
  }

  .welcome-modal .primary-button {
    background-color: #3498db;
    color: white;
  }

  .welcome-modal .primary-button:hover {
    background-color: #2980b9;
  }

  .welcome-modal .secondary-button {
    background-color: #ecf0f1;
    color: #2c3e50;
  }

  .welcome-modal .secondary-button:hover {
    background-color: #bdc3c7;
  }

  @media (max-width: 480px) {
    .welcome-modal {
      padding: 15px;
      width: 95%;
    }

    .welcome-modal h2 {
      font-size: 1.2rem;
    }

    .welcome-modal p {
      font-size: 0.9rem;
    }

    .welcome-modal button {
      padding: 8px 16px;
      font-size: 0.9rem;
    }
  }
</style>
