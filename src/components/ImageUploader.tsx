import { useRef } from 'preact/hooks';

interface ImageUploaderProps {
  onImageUpload: (img: HTMLImageElement) => void;
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="upload-section">
      <h2>上传图片</h2>
      <input 
        ref={fileInputRef}
        type="file" 
        onChange={handleImageUpload} 
        accept="image/*"
        style={{ display: 'none' }}
      />
      <button onClick={handleButtonClick}>选择图片</button>
    </section>
  );
}