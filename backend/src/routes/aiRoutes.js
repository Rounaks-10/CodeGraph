const express = require('express');
const storeService = require('../services/storeService');
const ragService = require('../services/ragService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/:id/ask', async (req, res) => {
  try {
    const { query, apiKey } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query prompt string is required' });
    }

    const repo = await storeService.getRepo(req.params.id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const nodes = await storeService.getNodes(req.params.id);
    const edges = await storeService.getEdges(req.params.id);
    const report = await storeService.getReport(req.params.id);

    const result = await ragService.ask(query.trim(), repo, nodes, edges, report, apiKey);

    // Provide contextual suggested questions based on repo symbols
    const routeNodes = nodes.filter((n) => n.type === 'route');
    const sampleRoute = routeNodes[0]?.name || 'POST /api/auth/login';

    const suggested = [
      `What happens when ${sampleRoute} is called?`,
      'Are there any circular dependencies between modules?',
      'Identify potentially unused exports or dead files',
      'Which modules act as architectural hotspots?',
    ];

    res.json({
      query,
      answer: result.answer,
      citations: result.citations,
      suggestedQuestions: suggested,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
