<template>
  <section class="section">
    <h2>示例</h2>
    <div class="demo-images-grid">
      <div
        v-for="(image, index) in demoImages"
        :key="index"
        class="demo-image-item"
        @click="() => handleImageClick(image)"
      >
        <img :src="image.url" :alt="image.description" />
        <span class="demo-image-description">{{ image.description }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface DemoImage {
  url: string;
  description: string;
}

const demoImages: DemoImage[] = [
  {
    url: new URL('../../assets/demo/example1.jpg', import.meta.url).href,
    description: '示例1',
  },
  {
    url: new URL('../../assets/demo/example2.jpg', import.meta.url).href,
    description: '示例2',
  },
  {
    url: new URL('../../assets/demo/example3.jpg', import.meta.url).href,
    description: '示例3',
  },
];

const emit = defineEmits<{
  (e: 'selectDemo', img: HTMLImageElement): Promise<void>;
}>();

const handleImageClick = (demoImage: DemoImage) => {
  const img = new Image();
  img.src = demoImage.url;
  img.onload = async () => {
    await emit('selectDemo', img);
  };
};
</script>

<style scoped>
.demo-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.demo-image-item {
  cursor: pointer;
  transition: transform 0.2s;
  text-align: center;
}

.demo-image-item:hover {
  transform: scale(1.05);
}

.demo-image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.demo-image-description {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}
</style>
