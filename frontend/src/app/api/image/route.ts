import { GoogleAuth } from 'google-auth-library';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gcsPath = searchParams.get('path');

    if (!gcsPath || !gcsPath.startsWith('gs://')) {
      console.error('Image proxy: Invalid GCS path received:', gcsPath);
      return NextResponse.json({ error: 'Invalid GCS path' }, { status: 400 });
    }

    // Parse gs://bucket-name/path/to/file
    const withoutPrefix = gcsPath.replace('gs://', '');
    const slashIdx = withoutPrefix.indexOf('/');
    if (slashIdx === -1) {
      return NextResponse.json({ error: 'Invalid GCS path format' }, { status: 400 });
    }
    const bucketName = withoutPrefix.substring(0, slashIdx);
    const objectPath = withoutPrefix.substring(slashIdx + 1);

    console.log(`Image proxy: Fetching gs://${bucketName}/${objectPath}`);

    // Use the GCS JSON API with ADC auth (same auth approach as search route)
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const accessToken = await auth.getAccessToken();

    const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(objectPath)}?alt=media`;

    const gcsResponse = await fetch(gcsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!gcsResponse.ok) {
      const errText = await gcsResponse.text();
      console.error(`Image proxy: GCS fetch failed (${gcsResponse.status}):`, errText.substring(0, 300));
      return NextResponse.json({ error: errText }, { status: gcsResponse.status });
    }

    const imageBuffer = await gcsResponse.arrayBuffer();

    // Detect content type from file extension
    const ext = objectPath.split('.').pop()?.toLowerCase();
    let contentType = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'svg') contentType = 'image/svg+xml';

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
