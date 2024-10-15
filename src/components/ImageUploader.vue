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
