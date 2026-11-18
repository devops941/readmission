const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem('readmit_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      errMsg = await res.text() || errMsg;
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse<any>(res);
  },
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },

  // Datasets
  async getDatasets() {
    const res = await fetch(`${API_BASE}/datasets`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async getDataset(id: string) {
    const res = await fetch(`${API_BASE}/datasets/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async uploadDatasetFile(datasetId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/${datasetId}/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse<any>(res);
  },
  async commitImport(datasetId: string, stagingId: string, dropPhi: boolean) {
    const formData = new FormData();
    formData.append('staging_id', stagingId);
    formData.append('drop_phi_columns', dropPhi ? 'true' : 'false');
    const res = await fetch(`${API_BASE}/datasets/${datasetId}/import/commit`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse<any>(res);
  },

  // Encounters
  async getEncounters(datasetId: string, skip = 0, limit = 50, filters?: any) {
    let url = `${API_BASE}/encounters?dataset_id=${datasetId}&skip=${skip}&limit=${limit}`;
    if (filters?.primary_dx_group) url += `&primary_dx_group=${filters.primary_dx_group}`;
    if (filters?.discharge_disposition) url += `&discharge_disposition=${filters.discharge_disposition}`;
    if (filters?.readmit_30d !== undefined && filters.readmit_30d !== 'all') url += `&readmit_30d=${filters.readmit_30d}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async addEncounter(datasetId: string, record: any) {
    const res = await fetch(`${API_BASE}/encounters?dataset_id=${datasetId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    return handleResponse<any>(res);
  },
  async updateEncounter(datasetId: string, encounterId: string, record: any) {
    const res = await fetch(`${API_BASE}/encounters/${encounterId}?dataset_id=${datasetId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    return handleResponse<any>(res);
  },
  async deleteEncounter(datasetId: string, encounterId: string) {
    const res = await fetch(`${API_BASE}/encounters/${encounterId}?dataset_id=${datasetId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },

  // Dictionary
  async getDictionary(datasetId: string) {
    const res = await fetch(`${API_BASE}/dictionary?dataset_id=${datasetId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async updateDictionary(datasetId: string, variable: string, patch: any) {
    const res = await fetch(`${API_BASE}/dictionary/${variable}?dataset_id=${datasetId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(patch)
    });
    return handleResponse<any>(res);
  },

  // Patterns
  async getRates(datasetId: string, by = 'primary_dx_group') {
    const res = await fetch(`${API_BASE}/patterns/rates?dataset_id=${datasetId}&by=${by}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async getTrends(datasetId: string) {
    const res = await fetch(`${API_BASE}/patterns/trend?dataset_id=${datasetId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async getCrosstab(datasetId: string, row = 'age_band', col = 'primary_dx_group') {
    const res = await fetch(`${API_BASE}/patterns/crosstab?dataset_id=${datasetId}&row=${row}&col=${col}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async getRegression(datasetId: string) {
    const res = await fetch(`${API_BASE}/patterns/regression?dataset_id=${datasetId}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async getFindings(datasetId: string) {
    const res = await fetch(`${API_BASE}/patterns/findings?dataset_id=${datasetId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  // Models
  async getModels(datasetId: string) {
    const res = await fetch(`${API_BASE}/models?dataset_id=${datasetId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async getModel(modelId: string) {
    const res = await fetch(`${API_BASE}/models/${modelId}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async compareModels(datasetId: string) {
    const res = await fetch(`${API_BASE}/models/compare?dataset_id=${datasetId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async trainModel(datasetId: string, config: any) {
    const res = await fetch(`${API_BASE}/models/train?dataset_id=${datasetId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config)
    });
    return handleResponse<any>(res);
  },
  async setModelStatus(modelId: string, status: string) {
    const res = await fetch(`${API_BASE}/models/${modelId}/status?status=${status}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },

  // Explain
  async getGlobalExplain(modelId: string) {
    const res = await fetch(`${API_BASE}/explain/${modelId}/global`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async getPdp(modelId: string, feature: string) {
    const res = await fetch(`${API_BASE}/explain/${modelId}/pdp?feature=${encodeURIComponent(feature)}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async getRecordExplain(modelId: string, encounterId: string) {
    const res = await fetch(`${API_BASE}/explain/${modelId}/record/${encounterId}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async getStability(modelId: string) {
    const res = await fetch(`${API_BASE}/explain/${modelId}/stability`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Subgroups
  async getSubgroups(modelId: string, by = 'insurance', threshold = 0.20) {
    const res = await fetch(`${API_BASE}/subgroups/${modelId}?by=${by}&threshold=${threshold}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Monitor
  async getDrift(modelId: string) {
    const res = await fetch(`${API_BASE}/monitor/${modelId}/drift`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async getPerformance(modelId: string) {
    const res = await fetch(`${API_BASE}/monitor/${modelId}/performance`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  async getAlerts(datasetId: string) {
    const res = await fetch(`${API_BASE}/monitor/alerts?dataset_id=${datasetId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  // Reviews
  async getReviews(modelId: string) {
    const res = await fetch(`${API_BASE}/reviews/${modelId}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async submitReview(data: any) {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },

  // Export
  getExportUrl(datasetId: string, modelId: string | null, format = 'pdf') {
    return `${API_BASE}/reports/export?dataset_id=${datasetId}&format=${format}${modelId ? `&model_id=${modelId}` : ''}`;
  },

  // Admin
  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async getAudit() {
    const res = await fetch(`${API_BASE}/admin/audit`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  async getSystem() {
    const res = await fetch(`${API_BASE}/admin/system`, { headers: getHeaders() });
    return handleResponse<any>(res);
  }
};
