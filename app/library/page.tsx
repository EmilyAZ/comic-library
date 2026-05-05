'use client';

import { useEffect, useState } from 'react';

type Comic = {
  id: string;
  comicvine_id: number;
  title: string;
  issue_number: string | null;
  volume_name: string | null;
  cover_date: string | null;
  cover_image_url: string | null;
  description: string | null;
  added_at: string;
};

export default function LibraryPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadComics();
  }, []);

  async function loadComics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comics');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load library');

      setComics(data.comics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this comic from your library?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/comics/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      // Remove from local state without refetching
      setComics((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Library</h1>
            <p className="text-gray-400">
              {loading
                ? 'Loading...'
                : `${comics.length} comic${comics.length === 1 ? '' : 's'} in your collection`}
            </p>
            </div>
          <a href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition">← Search</a>
        </div>

        {error && (
          <div className="bg-red-900 p-4 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && comics.length === 0 && !error && (
          <div className="text-center mt-16">
            <p className="text-gray-500 text-lg mb-4">Your library is empty.</p>
            
            <a href="/" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition">Search for comics to add</a>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {comics.map((comic) => (
            <div key={comic.id} className="bg-gray-800 rounded overflow-hidden flex flex-col">
              {comic.cover_image_url && (
                <img
                  src={comic.cover_image_url}
                  alt={comic.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-3 flex flex-col flex-1">
                <div className="font-bold truncate">
                  {comic.volume_name || comic.title} #{comic.issue_number}
                </div>
                {comic.cover_date && (
                  <div className="text-xs text-gray-500 mt-1">{comic.cover_date}</div>
                )}
                <button
                  onClick={() => handleDelete(comic.id)}
                  disabled={deletingId === comic.id}
                  className="mt-3 w-full px-3 py-2 rounded text-sm font-medium bg-red-700 hover:bg-red-600 disabled:bg-gray-700 transition"
                >
                  {deletingId === comic.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}