const mongoose = require('mongoose');

const graphNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, index: true },
  repoId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['file', 'function', 'class', 'method', 'route', 'module'],
    required: true,
  },
  name: { type: String, required: true },
  filePath: { type: String, default: '' },
  startLine: { type: Number, default: 0 },
  endLine: { type: Number, default: 0 },
  params: { type: [String], default: [] },
  async: { type: Boolean, default: false },
  exported: { type: Boolean, default: false },
  docstring: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

const memoryNodes = new Map(); // repoId -> Array<Node>

const GraphNodeModel = mongoose.model('GraphNode', graphNodeSchema);

module.exports = {
  GraphNodeModel,
  memoryNodes,
};
