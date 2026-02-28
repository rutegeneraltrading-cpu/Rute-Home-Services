import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'worker_documents';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Remove mandatory auth check: allow both logged-in and public users to upload documents
    // Get FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json(
        { error: 'No document type provided' },
        { status: 400 },
      );
    }
    // Validate file
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be image or PDF' },
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
    const ext = file.name.split('.').pop();
    const filename = `worker-${type}-${timestamp}-${random}.${ext}`;
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
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
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
    return NextResponse.json({ url: publicUrlData.publicUrl, type });
  } catch (error) {
    console.error('Worker document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
