const BASE = '';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getStats: () => fetchJson<any>('/api/stats'),
  getPrompts: async (params?: Record<string, string>) => {
    const merged = { limit: '10000', ...params };
    const qs = '?' + new URLSearchParams(merged).toString();
    const data = await fetchJson<any>(`/api/prompts${qs}`);
    return data.prompts ?? data;
  },
  getPromptById: (id: string) => fetchJson<any>(`/api/prompts/${id}`),
  getSessions: async () => {
    const data = await fetchJson<any>('/api/sessions');
    return data.sessions ?? data;
  },
  getSessionById: (id: string) => fetchJson<any>(`/api/sessions/${id}`),
  getProjects: async () => {
    const data = await fetchJson<any>('/api/projects');
    return data.projects ?? data;
  },
  getProjectById: (id: string) => fetchJson<any>(`/api/projects/${id}`),
  getTemplates: async () => {
    const data = await fetchJson<any>('/api/templates');
    return data.templates ?? data;
  },
  getSources: async () => {
    const data = await fetchJson<any>('/api/sources');
    return data.sources ?? data;
  },
  search: (q: string) => fetchJson<any>(`/api/search?q=${encodeURIComponent(q)}`),
  getDataInfo: () => fetchJson<any>('/api/data'),
  clearData: () => fetchJson<any>('/api/data', { method: 'DELETE' }),
  ingestSource: (sourceType: string) => fetchJson<any>('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceType }),
  }),
  discoverSources: async () => {
    const data = await fetchJson<any>('/api/ingest');
    return data.sources ?? data;
  },
};
