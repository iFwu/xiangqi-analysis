interface ImageUploaderProps {
  onImageUpload: (img: HTMLImageElement) => void;
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const handleImageUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => onImageUpload(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="upload-section">
      <h2>上传图片</h2>
      <input type="file" onChange={handleImageUpload} />
    </section>
  );
}