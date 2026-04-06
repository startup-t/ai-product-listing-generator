import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";

const MAX_DIMENSION = 1600;

async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not load image for preprocessing."));
    img.src = url;
  });

  return img;
}

export async function resizeImageForBackgroundRemoval(file: File): Promise<File> {
  const url = URL.createObjectURL(file);

  try {
    const img = await loadImageFromUrl(url);
    const longestSide = Math.max(img.width, img.height);

    if (longestSide <= MAX_DIMENSION) {
      return file;
    }

    const scale = MAX_DIMENSION / longestSide;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available for image resizing.");
    }

    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const resizedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Could not resize image before background removal."));
      }, file.type || "image/jpeg", 0.92);
    });

    return new File([resizedBlob], file.name, {
      type: resizedBlob.type || file.type || "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function removeBackgroundFromImage(file: File): Promise<Blob> {
  const result = await imglyRemoveBackground(file);
  return result;
}

export async function placeOnWhiteBackground(blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImageFromUrl(url);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available for image compositing.");
    }

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}
