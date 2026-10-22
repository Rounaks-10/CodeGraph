const mongoose = require('mongoose');

const analysisReportSchema = new mongoose.Schema({
  repoId: { type: String, required: true, index: true },
  // Using Mixed type to avoid strict schema casting errors for complex nested data
  circularDependencies: { type: mongoose.Schema.Types.Mixed, default: [] },
  unusedSymbols: { type: mongoose.Schema.Types.Mixed, default: [] },
  hotspots: { type: mongoose.Schema.Types.Mixed, default: [] },
  createdAt: { type: Date, default: Date.now },
});

const memoryReports = new Map(); // repoId -> Report

const AnalysisReportModel = mongoose.model('AnalysisReport', analysisReportSchema);

module.exports = {
  AnalysisReportModel,
  memoryReports,
};
