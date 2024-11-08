<template>
  <section class="upload-section">
    <h2>上传图片</h2>
    <input
      ref="fileInputRef"
      type="file"
      @change="handleImageUpload"
      accept="image/*"
      :style="{ display: 'none' }"
    />
    <button @click="handleButtonClick">选择图片</button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ImageUploaderProps {
  onImageUpload: (img: HTMLImageElement) => void;
}

const props = defineProps<ImageUploaderProps>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => props.onImageUpload(img);
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
.upload-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.upload-section h2 {
  text-align: left;
}

.upload-section > *:not(h2) {
  text-align: center;
}

.upload-section input[type='file'] {
  display: block;
  margin: 1rem 0;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}
</style>
