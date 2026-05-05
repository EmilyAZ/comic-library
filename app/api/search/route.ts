import { NextRequest, NextResponse } from 'next/server';
import { searchComics } from '@/lib/comicvine';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.trim() === '') {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const results = await searchComics(query.trim());
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}