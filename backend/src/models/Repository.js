const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  _id: { type: String }, // Allow UUID strings as _id
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  url: { type: String, default: '' },
  sourceType: { type: String, enum: ['git', 'zip', 'sample'], default: 'git' },
  rootPath: { type: String, required: true },
  defaultBranch: { type: String, default: 'main' },
  languages: { type: Map, of: Number, default: {} },
  stats: {
    fileCount: { type: Number, default: 0 },
    dirCount: { type: Number, default: 0 },
    symbolCount: { type: Number, default: 0 },
    functionCount: { type: Number, default: 0 },
    classCount: { type: Number, default: 0 },
    routeCount: { type: Number, default: 0 },
    edgeCount: { type: Number, default: 0 },
    cycleCount: { type: Number, default: 0 },
    deadCodeCount: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['pending', 'cloning', 'parsing', 'analyzing', 'ready', 'error'],
    default: 'pending',
  },
  statusMessage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false }); // Disable auto ObjectId since we supply UUID strings as _id

// Fallback in-memory store
const memoryRepos = new Map();

const RepositoryModel = mongoose.model('Repository', repositorySchema);

module.exports = {
  RepositoryModel,
  memoryRepos,
};
