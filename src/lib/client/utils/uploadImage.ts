const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
