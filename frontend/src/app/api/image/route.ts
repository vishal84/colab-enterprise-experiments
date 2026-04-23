import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';

const storage = new Storage();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gcsPath = searchParams.get('path');

    if (!gcsPath || !gcsPath.startsWith('gs://')) {
      return NextResponse.json({ error: 'Invalid GCS path' }, { status: 400 });
    }

    // Parse gs://bucket-name/path/to/file
    const withoutPrefix = gcsPath.replace('gs://', '');
    const slashIdx = withoutPrefix.indexOf('/');
    const bucketName = withoutPrefix.substring(0, slashIdx);
    const filePath = withoutPrefix.substring(slashIdx + 1);

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [contents] = await file.download();
    
    return new NextResponse(new Uint8Array(contents), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
