'use client';

import { useState } from 'react';
import type { ComicVineIssue } from '@/lib/comicvine';
import BarcodeScanner from './components/BarcodeScanner';

type AddStatus = 'idle' | 'saving' | 'added' | 'duplicate' | 'error';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ComicVineIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track per-comic add status: { 12345: 'added', 67890: 'saving', ... }
  const [addStatus, setAddStatus] = useState<Record<number, AddStatus>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLookupStatus, setScanLookupStatus] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setAddStatus({});

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(comic: ComicVineIssue) {
    setAddStatus((prev) => ({ ...prev, [comic.id]: 'saving' }));

    try {
      const res = await fetch('/api/comics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicvine_id: comic.id,
          title: comic.volume?.name || comic.name || 'Unknown',
          issue_number: comic.issue_number,
          volume_name: comic.volume?.name,
          cover_date: comic.cover_date,
          cover_image_url: comic.image?.medium_url,
          description: comic.description,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.alreadyExists) {
        setAddStatus((prev) => ({ ...prev, [comic.id]: 'duplicate' }));
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Save failed');
      }

      setAddStatus((prev) => ({ ...prev, [comic.id]: 'added' }));
    } catch (err) {
      console.error('Add error:', err);
      setAddStatus((prev) => ({ ...prev, [comic.id]: 'error' }));
    }
  }
  async function handleBarcodeDetected(code: string) {
    setScannerOpen(false);
    setScanLookupStatus(`Looking up barcode ${code}...`);

    try {
      const res = await fetch(`/api/barcode?upc=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lookup failed');
      }

      if (!data.found) {
        setScanLookupStatus(`No comic found for barcode ${code}. Try searching by name.`);
        return;
      }

      // Show the result by setting it as the only search result
      setResults([data.comic]);
      setQuery(`Barcode: ${code}`);
      setScanLookupStatus(null);
    } catch (err) {
      setScanLookupStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function getButtonProps(status: AddStatus) {
    switch (status) {
      case 'saving':
        return { text: 'Saving...', className: 'bg-gray-700', disabled: true };
      case 'added':
        return { text: '✓ Added', className: 'bg-green-700', disabled: true };
      case 'duplicate':
        return { text: 'Already in library', className: 'bg-gray-700', disabled: true };
      case 'error':
        return { text: 'Error — retry', className: 'bg-red-700 hover:bg-red-600', disabled: false };
      default:
        return { text: '+ Add to Library', className: 'bg-blue-600 hover:bg-blue-700', disabled: false };
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Comic Library</h1>
            <p className="text-gray-400">Search the ComicVine database</p>
            </div>
          <a href="/library" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition">My Library →</a>
        </div>

        <form onSubmit={handleSearch} className="mb-2 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comics... (e.g. Spider-Man)"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded font-medium transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded font-medium transition"
            title="Scan barcode"
          >
            📷 Scan
          </button>
        </form>

        {scanLookupStatus && (
          <p className="text-sm text-gray-400 mb-6">{scanLookupStatus}</p>
        )}

        {error && (
          <div className="bg-red-900 p-4 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && <p className="text-gray-400">Loading...</p>}

        {!loading && results.length > 0 && (
          <p className="text-gray-400 mb-4">{results.length} results</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((comic) => {
            const status = addStatus[comic.id] || 'idle';
            const btn = getButtonProps(status);
            return (
              <div key={comic.id} className="bg-gray-800 rounded overflow-hidden flex flex-col">
                {comic.image?.medium_url && (
                  <img
                    src={comic.image.medium_url}
                    alt={comic.name || 'Comic cover'}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-3 flex flex-col flex-1">
                  <div className="font-bold truncate">
                    {comic.volume?.name || 'Unknown'} #{comic.issue_number}
                  </div>
                  {comic.name && (
                    <div className="text-sm text-gray-400 truncate">{comic.name}</div>
                  )}
                  {comic.cover_date && (
                    <div className="text-xs text-gray-500 mt-1">{comic.cover_date}</div>
                  )}
                  <button
                    onClick={() => handleAdd(comic)}
                    disabled={btn.disabled}
                    className={`mt-3 w-full px-3 py-2 rounded text-sm font-medium transition ${btn.className}`}
                  >
                    {btn.text}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && results.length === 0 && query && !error && (
          <p className="text-gray-500 text-center mt-8">
            No results yet. Try searching!
          </p>
        )}
        {scannerOpen && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setScannerOpen(false)}
          />
        )}
      </div>
    </main>
  );

}