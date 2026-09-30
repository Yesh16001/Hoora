const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = (isFormData = false) => {
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('campusfind_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred during API request');
  }
  return data;
};

export const api = {
  // Auth
  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  login: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // AI Assistant Services & Config
  configAiKey: async (gemini_api_key) => {
    const res = await fetch(`${API_BASE_URL}/admin/config-ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ gemini_api_key }),
    });
    return handleResponse(res);
  },

  aiAutoTag: async (title, description) => {
    const res = await fetch(`${API_BASE_URL}/ai/auto-tag`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, description }),
    });
    return handleResponse(res);
  },

  aiVerifyClaim: async (item_title, item_description, claim_evidence) => {
    const res = await fetch(`${API_BASE_URL}/ai/verify-claim`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ item_title, item_description, claim_evidence }),
    });
    return handleResponse(res);
  },

  // Upload File/Image
  uploadFile: async (fileOrBase64) => {
    if (typeof fileOrBase64 === 'string') {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ image_data: fileOrBase64 }),
      });
      return handleResponse(res);
    } else {
      const formData = new FormData();
      formData.append('file', fileOrBase64);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    }
  },

  // Items
  getItems: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.status) params.append('status', filters.status);
    if (filters.my_items) params.append('my_items', 'true');

    const res = await fetch(`${API_BASE_URL}/items?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getItemDetail: async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/items/${itemId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createItem: async (itemData) => {
    const res = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(itemData),
    });
    return handleResponse(res);
  },

  // Smart Matching
  getItemMatches: async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/items/${itemId}/matches`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Claims
  submitClaim: async (itemId, evidence, image_proof_url = '') => {
    const res = await fetch(`${API_BASE_URL}/items/${itemId}/claims`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ evidence, image_proof_url }),
    });
    return handleResponse(res);
  },

  getMyClaims: async () => {
    const res = await fetch(`${API_BASE_URL}/my-claims`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Admin & Audit
  getAdminDashboard: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAdminItems: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/items`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateItemStatus: async (itemId, status) => {
    const res = await fetch(`${API_BASE_URL}/admin/items/${itemId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  getAdminClaims: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/claims`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateClaimStatus: async (claimId, status, admin_notes = '') => {
    const res = await fetch(`${API_BASE_URL}/admin/claims/${claimId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, admin_notes }),
    });
    return handleResponse(res);
  },
};
