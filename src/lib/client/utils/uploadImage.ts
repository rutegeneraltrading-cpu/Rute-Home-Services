import { createClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const WORKER_DOCUMENTS_BUCKET = 'worker_documents';

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
