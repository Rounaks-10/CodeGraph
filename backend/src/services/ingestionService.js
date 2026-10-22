const simpleGit = require('simple-git');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const parserService = require('./parserService');
const graphService = require('./graphService');
const ragService = require('./ragService');
const storeService = require('./storeService');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  'coverage',
  '.turbo',
  '.cache',
  'vendor',
  'bin',
  'obj',
  '.vscode',
  '.idea',
]);

const SUPPORTED_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.json',
]);

class IngestionService {
  /**
   * Scan directory recursively for source files, ignoring artifacts
   */
  scanDirectory(dirPath, rootDir = dirPath) {
    let files = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(this.scanDirectory(fullPath, rootDir));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
          files.push({
            fullPath,
            relativePath: relPath,
            fileName: entry.name,
            ext,
            size: fs.statSync(fullPath).size,
          });
        }
      }
    }
    return files;
  }

  /**
   * Calculate language breakdown by lines of code
   */
  calculateLanguages(scannedFiles) {
    const langLines = {};
    let totalLines = 0;

    for (const f of scannedFiles) {
      try {
        const content = fs.readFileSync(f.fullPath, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;

        let lang = 'JavaScript';
        if (f.ext === '.ts' || f.ext === '.tsx') lang = 'TypeScript';
        else if (f.ext === '.json') lang = 'JSON';

        langLines[lang] = (langLines[lang] || 0) + lines;
      } catch (err) {
        // ignore unreadable
      }
    }

    const percentages = {};
    for (const [lang, lines] of Object.entries(langLines)) {
      percentages[lang] = Math.round((lines / (totalLines || 1)) * 100);
    }
    return { langLines, percentages, totalLines };
  }

  /**
   * Process and analyze repository files into AST and Knowledge Graph
   */
  async processRepository(repoId, rootDir) {
    try {
      await storeService.updateRepo(repoId, {
        status: 'parsing',
        statusMessage: 'Scanning source files and parsing Abstract Syntax Trees...',
      });

      const scannedFiles = this.scanDirectory(rootDir);
      const { percentages, totalLines } = this.calculateLanguages(scannedFiles);

      // Parse code files
      const parsedFiles = [];
      for (const file of scannedFiles) {
        if (file.ext === '.json') continue; // Skip AST parse for raw JSON configs
        try {
          const content = fs.readFileSync(file.fullPath, 'utf8');
          const parsed = parserService.parseFile(content, file.relativePath);
          parsedFiles.push(parsed);
        } catch (err) {
          console.warn(`Failed parsing file ${file.relativePath}:`, err.message);
        }
      }

      await storeService.updateRepo(repoId, {
        status: 'analyzing',
        statusMessage: 'Building code graph and running graph algorithms...',
      });

      // Construct Knowledge Graph
      const { nodes, edges } = graphService.buildGraph(repoId, parsedFiles);

      // Run Graph Algorithms (Cycles, Dead Code, Hotspots)
      const report = graphService.analyzeGraph(nodes, edges);

      // Index into RAG vector engine
      ragService.indexRepository(repoId, nodes, edges);

      // Save everything
      await storeService.saveNodes(repoId, nodes);
      await storeService.saveEdges(repoId, edges);
      await storeService.saveReport(repoId, report);

      // Count stats
      const functionCount = nodes.filter((n) => n.type === 'function' || n.type === 'method').length;
      const classCount = nodes.filter((n) => n.type === 'class').length;
      const routeCount = nodes.filter((n) => n.type === 'route').length;

      await storeService.updateRepo(repoId, {
        status: 'ready',
        statusMessage: 'Analysis complete. Knowledge graph and RAG index ready.',
        languages: percentages,
        stats: {
          fileCount: scannedFiles.length,
          symbolCount: nodes.length,
          functionCount,
          classCount,
          routeCount,
          edgeCount: edges.length,
          cycleCount: report.circularDependencies.length,
          deadCodeCount: report.unusedSymbols.length,
          linesOfCode: totalLines,
        },
      });

      return { nodes, edges, report };
    } catch (err) {
      console.error('Error processing repository:', err);
      await storeService.updateRepo(repoId, {
        status: 'error',
        statusMessage: `Analysis failed: ${err.message}`,
      });
      throw err;
    }
  }

  /**
   * Ingest repository from Git URL
   */
  async ingestFromGitUrl(repoUrl, storageDir, userId = 'default-user') {
    const rawName = path.basename(repoUrl, '.git') || 'repo';
    const repoName = rawName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const repoDoc = await storeService.createRepo({
      userId,
      name: repoName,
      url: repoUrl,
      sourceType: 'git',
      rootPath: path.join(storageDir, `${repoName}_${Date.now()}`),
      status: 'cloning',
      statusMessage: 'Cloning public repository via git...',
    });

    // Run async in background
    (async () => {
      try {
        fs.mkdirSync(repoDoc.rootPath, { recursive: true });
        const git = simpleGit();
        await git.clone(repoUrl, repoDoc.rootPath, ['--depth', '1']);
        await this.processRepository(repoDoc._id || repoDoc.id, repoDoc.rootPath);
      } catch (err) {
        console.error('Git clone failed:', err);
        await storeService.updateRepo(repoDoc._id || repoDoc.id, {
          status: 'error',
          statusMessage: `Git clone error: ${err.message}`,
        });
      }
    })();

    return repoDoc;
  }

  /**
   * Ingest repository from uploaded ZIP
   */
  async ingestFromZip(zipFilePath, originalName, storageDir, userId = 'default-user') {
    const cleanName = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const extractDir = path.join(storageDir, `${cleanName}_${Date.now()}`);

    const repoDoc = await storeService.createRepo({
      userId,
      name: cleanName,
      sourceType: 'zip',
      rootPath: extractDir,
      status: 'cloning',
      statusMessage: 'Extracting repository archive...',
    });

    (async () => {
      try {
        fs.mkdirSync(extractDir, { recursive: true });
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(extractDir, true);

        // Remove temporary upload file
        if (fs.existsSync(zipFilePath)) {
          try {
            fs.unlinkSync(zipFilePath);
          } catch (_) {}
        }

        // If zip contained a single root directory, adjust rootPath
        const items = fs.readdirSync(extractDir);
        let actualRoot = extractDir;
        if (items.length === 1 && fs.statSync(path.join(extractDir, items[0])).isDirectory()) {
          actualRoot = path.join(extractDir, items[0]);
        }

        await storeService.updateRepo(repoDoc._id || repoDoc.id, { rootPath: actualRoot });
        await this.processRepository(repoDoc._id || repoDoc.id, actualRoot);
      } catch (err) {
        console.error('Zip extraction failed:', err);
        await storeService.updateRepo(repoDoc._id || repoDoc.id, {
          status: 'error',
          statusMessage: `Zip processing error: ${err.message}`,
        });
      }
    })();

    return repoDoc;
  }

  /**
   * Ingest pre-bundled sample repository
   */
  async ingestSample(sampleInfo, storageDir, userId = 'default-user') {
    const copyDir = path.join(storageDir, `${sampleInfo.name}_${Date.now()}`);

    const repoDoc = await storeService.createRepo({
      userId,
      name: sampleInfo.name,
      url: 'https://github.com/codegraph-samples/' + sampleInfo.name,
      sourceType: 'sample',
      rootPath: copyDir,
      status: 'parsing',
      statusMessage: 'Loading pre-configured architecture sample...',
    });

    (async () => {
      try {
        // Recursive copy
        fs.cpSync(sampleInfo.path, copyDir, { recursive: true });
        await this.processRepository(repoDoc._id || repoDoc.id, copyDir);
      } catch (err) {
        console.error('Sample ingestion error:', err);
        await storeService.updateRepo(repoDoc._id || repoDoc.id, {
          status: 'error',
          statusMessage: `Sample load error: ${err.message}`,
        });
      }
    })();

    return repoDoc;
  }
}

module.exports = new IngestionService();
