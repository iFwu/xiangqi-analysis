<template>
  <section class="upload-container">
    <h2>上传图片</h2>
    <input
      ref="fileInputRef"
      type="file"
      @change="handleImageUpload"
      accept="image/*"
      class="file-input"
    />
    <button @click="handleButtonClick">选择图片</button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ImageUploaderProps {
  onImageUpload: (img: HTMLImageElement) => Promise<void>;
}

const props = defineProps<ImageUploaderProps>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = async () => {
        await props.onImageUpload(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleButtonClick = () => {
  fileInputRef.value?.click();
};
</script>

<style scoped>
.upload-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

h2 {
  margin: 0;
  color: #333;
}

.file-input {
  display: none;
}
</style>
