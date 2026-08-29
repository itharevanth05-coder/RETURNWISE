const API_BASE = 'http://localhost:8000/api/v1';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await res.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Returns
  getReturns: (params = {}) => {
    const query = new URLSearchParams();
    if (params.risk_category) query.append('risk_category', params.risk_category);
    if (params.action) query.append('action', params.action);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    return fetchJson(`${API_BASE}/returns?${query.toString()}`);
  },

  createReturnRequest: (payload) =>
    fetchJson(`${API_BASE}/returns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getReturnDetail: (id) => fetchJson(`${API_BASE}/returns/${id}`),

  // Investigation & Rerun
  triggerInvestigation: (id) =>
    fetchJson(`${API_BASE}/investigate/${id}`, { method: 'POST' }),

  rerunDecision: (id, overrides = {}) =>
    fetchJson(`${API_BASE}/investigate/${id}/rerun`, {
      method: 'POST',
      body: JSON.stringify(overrides),
    }),

  // What-If Simulation
  simulateScenario: (payload) =>
    fetchJson(`${API_BASE}/simulate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Analytics
  getAnalyticsOverview: () => fetchJson(`${API_BASE}/analytics/overview`),

  // Entities
  getCustomers: () => fetchJson(`${API_BASE}/customers`),
  getCustomer: (id) => fetchJson(`${API_BASE}/customers/${id}`),
  getProducts: () => fetchJson(`${API_BASE}/products`),
  getProduct: (id) => fetchJson(`${API_BASE}/products/${id}`),
};
