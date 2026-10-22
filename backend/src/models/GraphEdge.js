const mongoose = require('mongoose');

const graphEdgeSchema = new mongoose.Schema({
  edgeId: { type: String, required: true },
  repoId: { type: String, required: true, index: true },
  source: { type: String, required: true, index: true },
  target: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['IMPORTS', 'CALLS', 'DEFINES', 'EXTENDS', 'ROUTED_TO'],
    required: true,
  },
  label: { type: String, default: '' },
  line: { type: Number, default: 0 },
});

const memoryEdges = new Map(); // repoId -> Array<Edge>

const GraphEdgeModel = mongoose.model('GraphEdge', graphEdgeSchema);

module.exports = {
  GraphEdgeModel,
  memoryEdges,
};
