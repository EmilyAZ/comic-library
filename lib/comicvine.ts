// ComicVine API wrapper

const COMICVINE_BASE = 'https://comicvine.gamespot.com/api';

export type ComicVineIssue = {
  id: number;
  name: string | null;
  issue_number: string;
  cover_date: string | null;
  description: string | null;
  image: {
    medium_url: string;
    thumb_url: string;
  } | null;
  volume: {
    id: number;
    name: string;
  } | null;
};

export async function searchComics(query: string): Promise<ComicVineIssue[]> {
  const apiKey = process.env.COMICVINE_API_KEY;
  if (!apiKey) {
    throw new Error('COMICVINE_API_KEY is not set');
  }


  const params = new URLSearchParams({
    api_key: apiKey,
    format: 'json',
    query: query,
    resources: 'issue',
    limit: '20',
    field_list: 'id,name,issue_number,cover_date,description,image,volume',
  });

  const url = `${COMICVINE_BASE}/search/?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      // ComicVine REQUIRES a custom User-Agent or it returns 420
      'User-Agent': 'ComicLibraryApp/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`ComicVine API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status_code !== 1) {
    throw new Error(`ComicVine error: ${data.error}`);
  }

  return data.results as ComicVineIssue[];
}

export async function searchByBarcode(upc: string): Promise<ComicVineIssue | null> {
    const apiKey = process.env.COMICVINE_API_KEY;
    if (!apiKey) {
      throw new Error('COMICVINE_API_KEY is not set');
    }
  
    const params = new URLSearchParams({
      api_key: apiKey,
      format: 'json',
      filter: `upc:${upc}`,
      field_list: 'id,name,issue_number,cover_date,description,image,volume',
      limit: '1',
    });
  
    const url = `https://comicvine.gamespot.com/api/issues/?${params.toString()}`;
  
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ComicLibraryApp/1.0' },
    });
  
    if (!response.ok) {
      throw new Error(`ComicVine API error: ${response.status}`);
    }
  
    const data = await response.json();
  
    if (data.status_code !== 1) {
      throw new Error(`ComicVine error: ${data.error}`);
    }
  
    return data.results.length > 0 ? data.results[0] : null;
  }