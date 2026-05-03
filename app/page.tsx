import { supabase } from '@/lib/supabase';

export default async function Home() {
  // Try to insert a test comic (will fail silently if duplicate, that's fine)
  await supabase.from('comics').insert({
    comicvine_id: 99999,
    title: 'Test Comic',
    issue_number: '1',
    volume_name: 'Test Volume',
    cover_date: '2026-01-01',
    cover_image_url: 'https://via.placeholder.com/200x300',
    description: 'This is a hardcoded test comic to verify our database connection.',
  });

  // Read all comics back
  const { data: comics, error } = await supabase
    .from('comics')
    .select('*')
    .order('added_at', { ascending: false });

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Comic Library — DB Test</h1>

      {error && (
        <div className="bg-red-900 p-4 rounded mb-4">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      <p className="mb-4 text-gray-400">
        Found {comics?.length ?? 0} comic(s) in database
      </p>

      <ul className="space-y-3">
        {comics?.map((comic) => (
          <li key={comic.id} className="bg-gray-800 p-4 rounded">
            <div className="font-bold">{comic.title} #{comic.issue_number}</div>
            <div className="text-sm text-gray-400">{comic.volume_name}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}