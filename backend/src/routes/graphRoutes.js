const express = require('express');
const storeService = require('../services/storeService');
const graphService = require('../services/graphService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

// Get graph nodes and edges
router.get('/:id/graph', async (req, res) => {
  try {
    const { type, file, limit } = req.query;
    let nodes = await storeService.getNodes(req.params.id);
    let edges = await storeService.getEdges(req.params.id);

    // Filter by type if provided (e.g. 'file', 'function', 'class', 'route')
    if (type && type !== 'all') {
      const allowedTypes = new Set(type.split(','));
      nodes = nodes.filter((n) => allowedTypes.has(n.type));
      const nodeIds = new Set(nodes.map((n) => n.nodeId));
      edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Filter by specific file
    if (file) {
      const fileId = `file::${file}`;
      const relevantNodeIds = new Set([fileId]);

      // Include all symbols in this file
      nodes.forEach((n) => {
        if (n.filePath === file) relevantNodeIds.add(n.nodeId);
      });

      // Include 1-hop neighbors
      edges.forEach((e) => {
        if (relevantNodeIds.has(e.source)) relevantNodeIds.add(e.target);
        if (relevantNodeIds.has(e.target)) relevantNodeIds.add(e.source);
      });

      nodes = nodes.filter((n) => relevantNodeIds.has(n.nodeId));
      edges = edges.filter((e) => relevantNodeIds.has(e.source) && relevantNodeIds.has(e.target));
    }

    if (limit && parseInt(limit) > 0) {
      nodes = nodes.slice(0, parseInt(limit));
      const nodeIds = new Set(nodes.map((n) => n.nodeId));
      edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    res.json({ nodes, edges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get circular dependencies
router.get('/:id/cycles', async (req, res) => {
  try {
    const report = await storeService.getReport(req.params.id);
    res.json({
      circularDependencies: report?.circularDependencies || [],
      count: report?.circularDependencies?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unused code & dead exports
router.get('/:id/unused', async (req, res) => {
  try {
    const report = await storeService.getReport(req.params.id);
    res.json({
      unusedSymbols: report?.unusedSymbols || [],
      count: report?.unusedSymbols?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get architectural hotspots
router.get('/:id/hotspots', async (req, res) => {
  try {
    const report = await storeService.getReport(req.params.id);
    res.json({
      hotspots: report?.hotspots || [],
      count: report?.hotspots?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trace execution flow from a node
router.get('/:id/trace', async (req, res) => {
  try {
    const { startNodeId } = req.query;
    if (!startNodeId) {
      return res.status(400).json({ error: 'startNodeId query parameter is required' });
    }

    const nodes = await storeService.getNodes(req.params.id);
    const edges = await storeService.getEdges(req.params.id);

    const traceResult = graphService.traceFlow(startNodeId, nodes, edges);
    if (!traceResult) {
      return res.status(404).json({ error: 'Start node not found in repository graph' });
    }

    res.json(traceResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
