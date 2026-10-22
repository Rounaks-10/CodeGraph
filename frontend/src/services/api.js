import axios from 'axios';

const API_BASE = '/api';

// Interceptor to automatically attach JWT Bearer token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cg_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Authentication
  async register(name, email, password) {
    const res = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
    return res.data;
  },

  async login(email, password) {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return res.data;
  },

  async getMe() {
    const res = await axios.get(`${API_BASE}/auth/me`);
    return res.data.user;
  },

  // Repositories
  async getRepos() {
    const res = await axios.get(`${API_BASE}/repos`);
    return res.data.repos;
  },

  async getRepo(id) {
    const res = await axios.get(`${API_BASE}/repos/${id}`);
    return res.data.repo;
  },

  async ingestGit(url) {
    const res = await axios.post(`${API_BASE}/repos/git`, { url });
    return res.data.repo;
  },

  async uploadZip(formData) {
    const res = await axios.post(`${API_BASE}/repos/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.repo;
  },

  async loadSample(sampleId) {
    const res = await axios.post(`${API_BASE}/repos/sample`, { sampleId });
    return res.data.repo;
  },

  async getAvailableSamples() {
    const res = await axios.get(`${API_BASE}/repos/samples/available`);
    return res.data.samples;
  },

  async deleteRepo(id) {
    const res = await axios.delete(`${API_BASE}/repos/${id}`);
    return res.data;
  },

  // Graph and Algorithms
  async getGraph(repoId, params = {}) {
    const res = await axios.get(`${API_BASE}/graph/${repoId}/graph`, { params });
    return res.data;
  },

  async getCycles(repoId) {
    const res = await axios.get(`${API_BASE}/graph/${repoId}/cycles`);
    return res.data;
  },

  async getUnused(repoId) {
    const res = await axios.get(`${API_BASE}/graph/${repoId}/unused`);
    return res.data;
  },

  async getHotspots(repoId) {
    const res = await axios.get(`${API_BASE}/graph/${repoId}/hotspots`);
    return res.data;
  },

  async traceFlow(repoId, startNodeId) {
    const res = await axios.get(`${API_BASE}/graph/${repoId}/trace`, {
      params: { startNodeId },
    });
    return res.data;
  },

  // Source Code and Files
  async getFileTree(repoId) {
    const res = await axios.get(`${API_BASE}/code/${repoId}/files`);
    return res.data.tree;
  },

  async getFileContent(repoId, path) {
    const res = await axios.get(`${API_BASE}/code/${repoId}/file-content`, {
      params: { path },
    });
    return res.data;
  },

  // AI Assistant (RAG)
  async askAI(repoId, query, apiKey = null) {
    const res = await axios.post(`${API_BASE}/ai/${repoId}/ask`, { query, apiKey });
    return res.data;
  },
};
