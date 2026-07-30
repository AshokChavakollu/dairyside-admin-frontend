import axios from 'axios';

// admin-backend serves the legacy /api/products and /api/categories aliases on
// the SAME origin as the primary /v1/admin API, so derive this base from the one
// configured env var rather than hardcoding a host. The hardcoded localhost:5001
// meant the deployed panel on admin.dairyside.in asked the operator's own machine
// for the catalog, which Chrome blocks as a private-network (loopback) request —
// surfacing as a CORS failure on every products/categories call in production.
const v1Base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/v1'
const apiBase = `${v1Base.replace(/\/+$/, '').replace(/\/v1$/, '')}/api`

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
