const express = require('express');
const fs = require('fs');
const path = require('path');
const storeService = require('../services/storeService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

// Helper: build recursive file tree structure
const getFileTree = (dirPath, rootDir) => {
  const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
  const name = path.basename(dirPath);
  const relPath = path.relative(rootDir, dirPath).replace(/\\/g, '/');

  const stats = fs.statSync(dirPath);
  if (stats.isDirectory()) {
    const children = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // Sort folders first, then files
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
      if (IGNORED.has(entry.name)) continue;

      const fullChild = path.join(dirPath, entry.name);
      children.push(getFileTree(fullChild, rootDir));
    }

    return {
      name,
      path: relPath || '',
      type: 'directory',
      children,
    };
  } else {
    return {
      name,
      path: relPath,
      type: 'file',
      size: stats.size,
    };
  }
};

// Get repository file tree
router.get('/:id/files', async (req, res) => {
  try {
    const repo = await storeService.getRepo(req.params.id);
    if (!repo || !fs.existsSync(repo.rootPath)) {
      return res.status(404).json({ error: 'Repository files not available on disk' });
    }

    const tree = getFileTree(repo.rootPath, repo.rootPath);
    res.json({ tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get file content and associated AST symbols
router.get('/:id/file-content', async (req, res) => {
  try {
    const { path: relativePath } = req.query;
    if (!relativePath) {
      return res.status(400).json({ error: 'File path query parameter is required' });
    }

    const repo = await storeService.getRepo(req.params.id);
    if (!repo || !fs.existsSync(repo.rootPath)) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const safePath = path.normalize(path.join(repo.rootPath, relativePath));
    if (!safePath.startsWith(path.normalize(repo.rootPath))) {
      return res.status(403).json({ error: 'Path traversal forbidden' });
    }

    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(safePath, 'utf8');
    const nodes = await storeService.getNodes(req.params.id);
    const normalizedRel = relativePath.replace(/\\/g, '/');
    const fileSymbols = nodes.filter((n) => n.filePath === normalizedRel);

    res.json({
      filePath: normalizedRel,
      fileName: path.basename(safePath),
      content,
      totalLines: content.split('\n').length,
      symbols: fileSymbols,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
