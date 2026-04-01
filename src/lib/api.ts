const BASE = '';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getStats: () => fetchJson<any>('/api/stats'),
  getPrompts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchJson<any>(`/api/prompts${qs}`);
  },
  getPromptById: (id: string) => fetchJson<any>(`/api/prompts/${id}`),
  getSessions: () => fetchJson<any>('/api/sessions'),
  getSessionById: (id: string) => fetchJson<any>(`/api/sessions/${id}`),
  getProjects: () => fetchJson<any>('/api/projects'),
  getProjectById: (id: string) => fetchJson<any>(`/api/projects/${id}`),
  getTemplates: () => fetchJson<any>('/api/templates'),
  getSources: () => fetchJson<any>('/api/sources'),
  search: (q: string) => fetchJson<any>(`/api/search?q=${encodeURIComponent(q)}`),
  getDataInfo: () => fetchJson<any>('/api/data'),
  clearData: () => fetchJson<any>('/api/data', { method: 'DELETE' }),
  ingestSource: (sourceType: string) => fetchJson<any>('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceType }),
  }),
  discoverSources: () => fetchJson<any>('/api/ingest'),
};
