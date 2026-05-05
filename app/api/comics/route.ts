import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.comicvine_id || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: comicvine_id and title' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('comics')
      .insert({
        comicvine_id: body.comicvine_id,
        title: body.title,
        issue_number: body.issue_number || null,
        volume_name: body.volume_name || null,
        cover_date: body.cover_date || null,
        cover_image_url: body.cover_image_url || null,
        description: body.description || null,
      })
      .select()
      .single();

    if (error) {
      // Postgres error code 23505 = unique violation (duplicate)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already in library', alreadyExists: true },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ comic: data }, { status: 201 });
  } catch (err) {
    console.error('Save error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('comics')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ comics: data });
  } catch (err) {
    console.error('Fetch error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}