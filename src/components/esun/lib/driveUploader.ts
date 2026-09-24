export interface UploadProgress {
  status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error';
  progressPct: number;
  error?: string;
  driveUrl?: string;
  thumbnailUrl?: string;
}

const APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx2I7-77T-EUv-3DCK7ueL9eGn4871nv-EJY_qBJxRu5TFQ3IWNcXOjEE89ghI4UbLa2w/exec';

/**
 * Extracts the Google Drive File ID from different URL patterns
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/id=([a-zA-Z0-9_-]+)/) ||
                url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/file\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/open\?id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Converts a Google Drive URL into a high-resolution, fast-loading image URL
 */
export function getDriveDirectImageUrl(url: string, width = 1600): string {
  if (!url) return '';
  const driveId = extractDriveFileId(url);
  if (driveId) {
    // Primary: Google user content CDN (fast & direct)
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }
  return url;
}

/**
 * Compresses an image client-side to ensure fast uploads and optimal presentation rendering
 */
export async function compressImageClientSide(
  file: File,
  maxWidth = 1920,
  quality = 0.85
): Promise<{ blob: Blob; base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar canvas 2D'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, base64, dataUrl });
            } else {
              reject(new Error('Fallo al crear Blob de imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an Anteproyecto image directly to Google Drive via Google Apps Script Webhook
 */
export async function uploadAnteproyectoImageToDrive(
  file: File,
  clientName: string,
  categoryTitle: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ driveUrl: string; thumbnailUrl: string }> {
  try {
    onProgress?.({ status: 'compressing', progressPct: 20 });
    
    const { base64, dataUrl } = await compressImageClientSide(file, 1920, 0.85);

    onProgress?.({ status: 'uploading', progressPct: 50 });

    const cleanClient = (clientName || 'Cliente').trim().replace(/[/\\?%*:|"<>]/g, '-');
    const cleanCategory = (categoryTitle || 'Capitulo').trim().replace(/[/\\?%*:|"<>]/g, '-');
    const filename = `ESUN_${cleanCategory}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const folderName = `ESUN - ${cleanClient}`;

    const response = await fetch(APPS_SCRIPT_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        filename,
        mimeType: 'image/jpeg',
        base64,
        moduleType: 'ESUN_PROYECTO',
        siteName: cleanClient,
        folderName
      })
    });

    onProgress?.({ status: 'uploading', progressPct: 90 });

    const result = await response.json();

    if (!result || !result.success || !result.url) {
      throw new Error(result?.error || 'No se recibió la URL de Google Drive');
    }

    const driveUrl = result.url;
    const thumbnailUrl = getDriveDirectImageUrl(driveUrl);

    onProgress?.({
      status: 'success',
      progressPct: 100,
      driveUrl,
      thumbnailUrl
    });

    return { driveUrl, thumbnailUrl };
  } catch (err: any) {
    const errorMsg = err?.message || 'Error al subir la imagen a Google Drive';
    onProgress?.({
      status: 'error',
      progressPct: 0,
      error: errorMsg
    });
    throw new Error(errorMsg);
  }
}
