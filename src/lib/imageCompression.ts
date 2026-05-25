/**
 * Compresses an image file using browser Canvas APIs.
 * If compression is not applicable or fails, the original file is returned.
 */
export const compressImage = async (
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<File | Blob> => {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

  // Don't try to compress non-image files or GIFs (as converting animated GIFs via canvas yields a static first frame)
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio resizing
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback to original file
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG for optimal size reduction
        const outputType = "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Return compressed version only if it's smaller than original
              if (blob.size < file.size) {
                const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
                const newName = `${originalNameWithoutExt}.jpg`;
                const compressedFile = new File([blob], newName, {
                  type: outputType,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            } else {
              resolve(file);
            }
          },
          outputType,
          quality
        );
      };
      img.onerror = () => {
        resolve(file);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
};
