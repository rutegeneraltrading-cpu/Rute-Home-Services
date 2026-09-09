import { createClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const WORKER_DOCUMENTS_BUCKET = 'worker_documents';
const AVATARS_BUCKET = 'avatars';

/**
 * Downscale/recompress an image in the browser so large phone photos become
 * small enough to upload reliably. Returns a JPEG blob. Falls back to the
 * original file if anything goes wrong (e.g. HEIC that can't be decoded).
 */
async function downscaleImage(
  file: File,
  maxDimension = 1200,
  quality = 0.85,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    return blob && blob.size > 0 ? blob : file;
  } catch {
    return file;
  }
}

/**
 * Upload a worker profile photo straight to Supabase Storage from the browser.
 *
 * Bypasses the Next.js API route (Vercel's ~4.5MB body limit → 413 on big phone
 * photos). The image is downscaled client-side first, then written to the public
 * `avatars` bucket. Anon uploads are allowed for `worker-` prefixed files (see
 * the `allow_public_worker_avatar_upload` migration), so this works before the
 * worker's auth session exists.
 */
export async function uploadWorkerAvatarDirect(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Profile photo must be an image');
  }

  const optimized = await downscaleImage(file, 1200, 0.85);

  if (optimized.size > MAX_FILE_SIZE) {
    throw new Error('Image is too large. Please use a smaller photo.');
  }

  const supabase = createClient();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `worker-${Date.now()}-${random}.jpg`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filename, optimized, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload profile photo');
  }

  const { data } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
}

/**
 * Upload a worker document straight to Supabase Storage from the browser.
 *
 * This deliberately bypasses the Next.js API route: Vercel serverless functions
 * cap the request body at ~4.5MB, so routing document uploads through an API
 * endpoint fails with FUNCTION_PAYLOAD_TOO_LARGE (413) for typical ID scans /
 * PDFs / phone photos, which in turn blocked worker creation entirely.
 *
 * The `worker_documents` bucket has a public INSERT policy, so the anon key can
 * upload directly. Safe to call before the worker account exists.
 */
export async function uploadWorkerDocument(
  file: File,
  type: string,
): Promise<{ type: string; file_url: string }> {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    throw new Error('File must be an image or PDF');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'bin';
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `worker-${type}-${Date.now()}-${random}.${ext}`;

  const { error } = await supabase.storage
    .from(WORKER_DOCUMENTS_BUCKET)
    .upload(filename, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload document');
  }

  const { data } = supabase.storage
    .from(WORKER_DOCUMENTS_BUCKET)
    .getPublicUrl(filename);

  return { type, file_url: data.publicUrl };
}

export async function uploadProfileImage(file: File): Promise<string> {
  // Validate file on client side
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  // Upload via API (cookies handle auth automatically)
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/upload-avatar', {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important: Send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

export async function uploadCategoryImage(file: File): Promise<string> {
  // Validate file on client side
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  // Upload via API (cookies handle auth automatically)
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/upload-category-image', {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important: Send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    const response = await fetch(
      `/api/admin/upload-avatar?url=${encodeURIComponent(imageUrl)}`,
      {
        method: 'DELETE',
        credentials: 'include', // Important: Send cookies
      },
    );

    if (!response.ok) {
      console.error('Failed to delete image');
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}

export async function deleteCategoryImage(imageUrl: string): Promise<void> {
  try {
    const response = await fetch(
      `/api/admin/upload-category-image?url=${encodeURIComponent(imageUrl)}`,
      {
        method: 'DELETE',
        credentials: 'include', // Important: Send cookies
      },
    );

    if (!response.ok) {
      console.error('Failed to delete image');
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
export async function uploadProductImage(file: File): Promise<string> {
  // Validate file on client side
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  // Upload via API (cookies handle auth automatically)
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/upload-product-image', {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important: Send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Upload a worker profile avatar (uses admin-client endpoint — no session required).
 * Safe to call before the worker account is created.
 */
export async function uploadWorkerAvatarImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/upload-worker-avatar', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    const response = await fetch(
      `/api/admin/upload-product-image?url=${encodeURIComponent(imageUrl)}`,
      {
        method: 'DELETE',
        credentials: 'include', // Important: Send cookies
      },
    );

    if (!response.ok) {
      console.error('Failed to delete image');
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
