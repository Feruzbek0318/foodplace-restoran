import localforage from 'localforage';

localforage.config({
  name: 'RestaurantApp',
  storeName: 'images'
});

/**
 * Compresses an image file and saves it to IndexedDB, returning a unique reference ID.
 */
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Faqat rasm yuklash mumkin'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await localforage.setItem(id, dataUrl);
        resolve(id);
      };
      img.onerror = () => reject(new Error('Rasmni yuklashda xatolik yuz berdi'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Faylni o‘qishda xatolik yuz berdi'));
    reader.readAsDataURL(file);
  });
}

/**
 * Retrieves the base64 data URL for an image by its ID.
 */
export async function getImageUrl(id: string): Promise<string | null> {
  if (!id) return null;
  if (id.startsWith('http') || id.startsWith('data:')) return id; // Fallback for old static urls
  try {
    const data = await localforage.getItem<string>(id);
    return data;
  } catch (error) {
    console.error('Rasmni o‘qishda xatolik:', error);
    return null;
  }
}
