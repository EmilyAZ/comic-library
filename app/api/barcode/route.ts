import { NextRequest, NextResponse } from 'next/server';
import { searchByBarcode } from '@/lib/comicvine';

export async function GET(request: NextRequest) {
  const upc = request.nextUrl.searchParams.get('upc');

  if (!upc || upc.trim() === '') {
    return NextResponse.json({ error: 'Missing upc parameter' }, { status: 400 });
  }

  try {
    const result = await searchByBarcode(upc.trim());
    if (!result) {
      return NextResponse.json({ found: false });
    }
    return NextResponse.json({ found: true, comic: result });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}