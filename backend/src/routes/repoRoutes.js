const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storeService = require('../services/storeService');
const ingestionService = require('../services/ingestionService');
const sampleRepoService = require('../services/sampleRepoService');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer setup for zip uploads
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are supported'));
    }
  },
});

const reposStorageDir = path.join(__dirname, '..', '..', 'data', 'repositories');
if (!fs.existsSync(reposStorageDir)) {
  fs.mkdirSync(reposStorageDir, { recursive: true });
}

// Ingest via Git URL (Protected to current user)
router.post('/git', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Valid repository HTTP/HTTPS URL is required' });
    }
    const repo = await ingestionService.ingestFromGitUrl(url.trim(), reposStorageDir, req.user.id);
    res.status(202).json({ success: true, repo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest via ZIP Upload (Protected to current user)
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ZIP file upload required' });
    }
    const repo = await ingestionService.ingestFromZip(
      req.file.path,
      req.file.originalname,
      reposStorageDir,
      req.user.id
    );
    res.status(202).json({ success: true, repo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest Sample Project (Protected to current user)
router.post('/sample', requireAuth, async (req, res) => {
  try {
    const { sampleId } = req.body;
    const baseDir = path.join(__dirname, '..', '..');
    const samples = await sampleRepoService.ensureSampleRepos(baseDir);
    const target = samples.find((s) => s.id === sampleId) || samples[0];

    const repo = await ingestionService.ingestSample(target, reposStorageDir, req.user.id);
    res.status(202).json({ success: true, repo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List available samples (Public information)
router.get('/samples/available', async (req, res) => {
  try {
    const baseDir = path.join(__dirname, '..', '..');
    const samples = await sampleRepoService.ensureSampleRepos(baseDir);
    res.json({ samples });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List only current authenticated user's repositories
router.get('/', requireAuth, async (req, res) => {
  try {
    const repos = await storeService.listRepos(req.user.id);
    res.json({ repos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get repo details (only if belongs to user)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const repo = await storeService.getRepo(req.params.id, req.user.id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found or access denied.' });
    }
    res.json({ repo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete repo (only if belongs to user)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const repo = await storeService.getRepo(req.params.id, req.user.id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found or access denied.' });
    }

    if (repo.rootPath && fs.existsSync(repo.rootPath)) {
      try {
        fs.rmSync(repo.rootPath, { recursive: true, force: true });
      } catch (_) {}
    }

    await storeService.deleteRepo(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
