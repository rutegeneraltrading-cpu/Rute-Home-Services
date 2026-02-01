import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const BUCKET_NAME = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user from session (cookies)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const buffer = await file.arrayBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${user.id}-${timestamp}-${random}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 400 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user from session (cookies)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get image URL from query params
    const imageUrl = request.nextUrl.searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Extract filename from URL
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const parts = pathname.split('/');
    const filename = parts[parts.length - 1];

    if (!filename) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (deleteError) {
      console.error('Failed to delete image:', deleteError);
      // Don't fail if deletion doesn't work - just log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
