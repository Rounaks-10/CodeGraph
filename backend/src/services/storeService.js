const mongoose = require('mongoose');
const { RepositoryModel, memoryRepos } = require('../models/Repository');
const { GraphNodeModel, memoryNodes } = require('../models/GraphNode');
const { GraphEdgeModel, memoryEdges } = require('../models/GraphEdge');
const { AnalysisReportModel, memoryReports } = require('../models/AnalysisReport');
const { v4: uuidv4 } = require('uuid');

const isMongooseConnected = () => mongoose.connection.readyState === 1;

const storeService = {
  // Repositories
  async createRepo(data) {
    const id = data._id || uuidv4();
    const doc = { ...data, _id: id, id };
    memoryRepos.set(id, doc);

    if (isMongooseConnected()) {
      try {
        const repoDoc = new RepositoryModel(doc);
        await repoDoc.save();
        return repoDoc.toObject();
      } catch (err) {
        console.warn('MongoDB save repo error, stored in memory:', err.message);
      }
    }
    return doc;
  },

  async updateRepo(id, updates) {
    const existing = memoryRepos.get(id) || {};
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    memoryRepos.set(id, updated);

    if (isMongooseConnected()) {
      try {
        await RepositoryModel.findByIdAndUpdate(id, updates, { new: true });
      } catch (err) {
        console.warn('MongoDB update repo error:', err.message);
      }
    }
    return updated;
  },

  async getRepo(id, userId = null) {
    if (isMongooseConnected()) {
      try {
        const query = userId ? { _id: id, userId } : { _id: id };
        const doc = await RepositoryModel.findOne(query).lean();
        if (doc) return doc;
      } catch (err) {
        // fallback to memory
      }
    }
    const mem = memoryRepos.get(id);
    if (!mem) return null;
    if (userId && mem.userId && mem.userId !== userId) return null;
    return mem;
  },

  async listRepos(userId = null) {
    if (isMongooseConnected()) {
      try {
        const query = userId ? { userId } : {};
        const list = await RepositoryModel.find(query).sort({ createdAt: -1 }).lean();
        if (list) return list;
      } catch (err) {
        // fallback to memory
      }
    }
    let all = Array.from(memoryRepos.values());
    if (userId) {
      all = all.filter((r) => r.userId === userId);
    }
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async deleteRepo(id, userId = null) {
    const existing = await this.getRepo(id, userId);
    if (!existing && userId) {
      throw new Error('Repository not found or access denied');
    }

    memoryRepos.delete(id);
    memoryNodes.delete(id);
    memoryEdges.delete(id);
    memoryReports.delete(id);

    if (isMongooseConnected()) {
      try {
        await Promise.all([
          RepositoryModel.findByIdAndDelete(id),
          GraphNodeModel.deleteMany({ repoId: id }),
          GraphEdgeModel.deleteMany({ repoId: id }),
          AnalysisReportModel.deleteMany({ repoId: id }),
        ]);
      } catch (err) {
        console.warn('MongoDB delete repo error:', err.message);
      }
    }
    return true;
  },

  // Graph Nodes
  async saveNodes(repoId, nodes) {
    memoryNodes.set(repoId, nodes);
    if (isMongooseConnected()) {
      try {
        await GraphNodeModel.deleteMany({ repoId });
        if (nodes.length > 0) {
          await GraphNodeModel.insertMany(nodes, { ordered: false });
        }
      } catch (err) {
        console.warn('MongoDB save nodes error:', err.message);
      }
    }
  },

  async getNodes(repoId) {
    if (isMongooseConnected()) {
      try {
        const list = await GraphNodeModel.find({ repoId }).lean();
        if (list && list.length > 0) return list;
      } catch (err) {
        // fallback
      }
    }
    return memoryNodes.get(repoId) || [];
  },

  // Graph Edges
  async saveEdges(repoId, edges) {
    memoryEdges.set(repoId, edges);
    if (isMongooseConnected()) {
      try {
        await GraphEdgeModel.deleteMany({ repoId });
        if (edges.length > 0) {
          await GraphEdgeModel.insertMany(edges, { ordered: false });
        }
      } catch (err) {
        console.warn('MongoDB save edges error:', err.message);
      }
    }
  },

  async getEdges(repoId) {
    if (isMongooseConnected()) {
      try {
        const list = await GraphEdgeModel.find({ repoId }).lean();
        if (list && list.length > 0) return list;
      } catch (err) {
        // fallback
      }
    }
    return memoryEdges.get(repoId) || [];
  },

  // Analysis Reports
  async saveReport(repoId, reportData) {
    const data = { ...reportData, repoId };
    memoryReports.set(repoId, data);
    if (isMongooseConnected()) {
      try {
        await AnalysisReportModel.deleteMany({ repoId });
        const report = new AnalysisReportModel(data);
        await report.save();
      } catch (err) {
        console.warn('MongoDB save report error:', err.message);
      }
    }
    return data;
  },

  async getReport(repoId) {
    if (isMongooseConnected()) {
      try {
        const doc = await AnalysisReportModel.findOne({ repoId }).lean();
        if (doc) return doc;
      } catch (err) {
        // fallback
      }
    }
    return memoryReports.get(repoId) || null;
  },
};

module.exports = storeService;
