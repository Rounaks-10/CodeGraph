const path = require('path');

class GraphService {
  /**
   * Build graph representation from parsed file data
   * @param {string} repoId
   * @param {Array} parsedFiles - list of objects returned by parserService
   */
  buildGraph(repoId, parsedFiles) {
    const nodes = [];
    const edges = [];
    const nodeMap = new Map(); // id -> node
    const fileSymbolMap = new Map(); // filePath -> { functions: Map, classes: Map, exports: Map }
    const externalModules = new Set();

    // 1. Create File Nodes and index symbols
    parsedFiles.forEach((file) => {
      const fileId = `file::${file.filePath}`;
      const fileNode = {
        nodeId: fileId,
        repoId,
        type: 'file',
        name: file.fileName,
        filePath: file.filePath,
        startLine: 1,
        endLine: file.functions.reduce((max, f) => Math.max(max, f.endLine), 100),
        params: [],
        exported: true,
        metadata: {
          functionCount: file.functions.length,
          classCount: file.classes.length,
          importCount: file.imports.length,
          routeCount: file.routes.length,
        },
      };
      nodes.push(fileNode);
      nodeMap.set(fileId, fileNode);

      const fnMap = new Map();
      const clsMap = new Map();

      // Classes
      file.classes.forEach((cls) => {
        const classId = `class::${file.filePath}::${cls.name}`;
        const classNode = {
          nodeId: classId,
          repoId,
          type: 'class',
          name: cls.name,
          filePath: file.filePath,
          startLine: cls.startLine,
          endLine: cls.endLine,
          params: [],
          exported: cls.exported,
          docstring: cls.docstring,
          metadata: {
            superClass: cls.superClass,
            methodCount: cls.methods.length,
          },
        };
        nodes.push(classNode);
        nodeMap.set(classId, classNode);
        clsMap.set(cls.name, classNode);

        // DEFINES edge: file -> class
        edges.push({
          edgeId: `edge::${fileId}::DEFINES::${classId}`,
          repoId,
          source: fileId,
          target: classId,
          type: 'DEFINES',
          label: 'defines',
          line: cls.startLine,
        });

        // EXTENDS edge
        if (cls.superClass) {
          edges.push({
            edgeId: `edge::${classId}::EXTENDS::${cls.superClass}`,
            repoId,
            source: classId,
            target: `class::${file.filePath}::${cls.superClass}`, // provisional
            type: 'EXTENDS',
            label: 'extends',
            line: cls.startLine,
          });
        }
      });

      // Functions & Methods
      file.functions.forEach((fn) => {
        const fnId = `fn::${file.filePath}::${fn.fullName || fn.name}`;
        const fnNode = {
          nodeId: fnId,
          repoId,
          type: fn.parentClass ? 'method' : 'function',
          name: fn.fullName || fn.name,
          filePath: file.filePath,
          startLine: fn.startLine,
          endLine: fn.endLine,
          params: fn.params,
          async: fn.async,
          exported: fn.exported,
          docstring: fn.docstring,
          metadata: {
            parentClass: fn.parentClass,
          },
        };
        nodes.push(fnNode);
        nodeMap.set(fnId, fnNode);
        fnMap.set(fn.name, fnNode);
        if (fn.fullName) fnMap.set(fn.fullName, fnNode);

        // DEFINES edge
        const parentId = fn.parentClass
          ? `class::${file.filePath}::${fn.parentClass}`
          : fileId;
        edges.push({
          edgeId: `edge::${parentId}::DEFINES::${fnId}`,
          repoId,
          source: parentId,
          target: fnId,
          type: 'DEFINES',
          label: 'defines',
          line: fn.startLine,
        });
      });

      // API Routes
      file.routes.forEach((rt, idx) => {
        const routeId = `route::${rt.method}::${rt.path}::${file.filePath}::${idx}`;
        const routeNode = {
          nodeId: routeId,
          repoId,
          type: 'route',
          name: `${rt.method} ${rt.path}`,
          filePath: file.filePath,
          startLine: rt.startLine,
          endLine: rt.endLine,
          params: [],
          exported: true,
          metadata: {
            method: rt.method,
            path: rt.path,
            handlers: rt.handlers,
          },
        };
        nodes.push(routeNode);
        nodeMap.set(routeId, routeNode);

        // DEFINES edge: file -> route
        edges.push({
          edgeId: `edge::${fileId}::DEFINES::${routeId}`,
          repoId,
          source: fileId,
          target: routeId,
          type: 'DEFINES',
          label: 'registers',
          line: rt.startLine,
        });

        // ROUTED_TO edges: route -> handler functions
        rt.handlers.forEach((hName) => {
          // Look up in current file or file imports
          let targetFnId = null;
          if (fnMap.has(hName)) {
            targetFnId = fnMap.get(hName).nodeId;
          } else {
            // Check if matching handler in any file
            for (const [, otherFns] of fileSymbolMap) {
              if (otherFns.functions.has(hName)) {
                targetFnId = otherFns.functions.get(hName).nodeId;
                break;
              }
            }
          }

          if (targetFnId) {
            edges.push({
              edgeId: `edge::${routeId}::ROUTED_TO::${targetFnId}`,
              repoId,
              source: routeId,
              target: targetFnId,
              type: 'ROUTED_TO',
              label: 'routed to',
              line: rt.startLine,
            });
          }
        });
      });

      fileSymbolMap.set(file.filePath, { functions: fnMap, classes: clsMap });
    });

    // Helper: resolve relative import paths
    const resolveImportPath = (currentFilePath, importSource) => {
      if (!importSource.startsWith('.')) return null; // External package
      const currentDir = path.dirname(currentFilePath);
      const fullRelative = path.normalize(path.join(currentDir, importSource)).replace(/\\/g, '/');

      const candidates = [
        fullRelative,
        `${fullRelative}.js`,
        `${fullRelative}.jsx`,
        `${fullRelative}.ts`,
        `${fullRelative}.tsx`,
        `${fullRelative}/index.js`,
        `${fullRelative}/index.ts`,
      ];

      for (const c of candidates) {
        if (nodeMap.has(`file::${c}`)) return c;
      }
      return null;
    };

    // 2. Create IMPORTS and CALLS edges across files
    parsedFiles.forEach((file) => {
      const fileId = `file::${file.filePath}`;

      // Imports
      file.imports.forEach((imp) => {
        const resolvedPath = resolveImportPath(file.filePath, imp.source);
        if (resolvedPath) {
          const targetFileId = `file::${resolvedPath}`;
          edges.push({
            edgeId: `edge::${fileId}::IMPORTS::${targetFileId}`,
            repoId,
            source: fileId,
            target: targetFileId,
            type: 'IMPORTS',
            label: 'imports',
            line: imp.startLine,
          });
        } else if (!imp.source.startsWith('.')) {
          // External npm module node
          const modName = imp.source.split('/')[0];
          const modId = `mod::${modName}`;
          if (!externalModules.has(modName)) {
            externalModules.add(modName);
            const modNode = {
              nodeId: modId,
              repoId,
              type: 'module',
              name: modName,
              filePath: 'node_modules',
              startLine: 1,
              endLine: 1,
              params: [],
              exported: true,
              metadata: { isExternal: true },
            };
            nodes.push(modNode);
            nodeMap.set(modId, modNode);
          }

          edges.push({
            edgeId: `edge::${fileId}::IMPORTS::${modId}`,
            repoId,
            source: fileId,
            target: modId,
            type: 'IMPORTS',
            label: 'imports pkg',
            line: imp.startLine,
          });
        }
      });

      // Calls (caller -> callee)
      file.calls.forEach((call) => {
        let callerId = fileId;
        if (call.caller && call.caller !== 'global') {
          callerId = `fn::${file.filePath}::${call.caller}`;
          if (!nodeMap.has(callerId)) {
            callerId = fileId;
          }
        }

        // Try to match callee in current file, then in resolved imports
        let targetCalleeId = null;
        const currentFns = fileSymbolMap.get(file.filePath)?.functions;
        if (currentFns && currentFns.has(call.callee)) {
          targetCalleeId = currentFns.get(call.callee).nodeId;
        } else {
          // Look across all parsed files for exported function matching name or method
          for (const [fPath, symbols] of fileSymbolMap.entries()) {
            if (fPath !== file.filePath && symbols.functions.has(call.callee)) {
              targetCalleeId = symbols.functions.get(call.callee).nodeId;
              break;
            }
          }
        }

        if (targetCalleeId && targetCalleeId !== callerId) {
          const edgeKey = `edge::${callerId}::CALLS::${targetCalleeId}`;
          if (!edges.some((e) => e.edgeId === edgeKey)) {
            edges.push({
              edgeId: edgeKey,
              repoId,
              source: callerId,
              target: targetCalleeId,
              type: 'CALLS',
              label: 'calls',
              line: call.line,
            });
          }
        }
      });
    });

    return { nodes, edges };
  }

  /**
   * Run Graph Algorithms:
   * 1. Circular dependency detection (Cycles in file imports)
   * 2. Unused / Dead code detection
   * 3. Degree centrality / Hotspot analysis
   */
  analyzeGraph(nodes, edges) {
    const fileNodes = nodes.filter((n) => n.type === 'file');
    const fileImportEdges = edges.filter((e) => e.type === 'IMPORTS' && e.target.startsWith('file::'));

    // --- 1. CIRCULAR DEPENDENCY DETECTION (DFS with path tracking) ---
    const fileAdj = new Map();
    fileNodes.forEach((n) => fileAdj.set(n.nodeId, []));
    fileImportEdges.forEach((e) => {
      if (fileAdj.has(e.source)) {
        fileAdj.get(e.source).push(e.target);
      }
    });

    const circularDependencies = [];
    const visited = new Set();
    const recStack = new Set();
    const cycleSignatures = new Set();

    const dfsCycle = (curr, path) => {
      visited.add(curr);
      recStack.add(curr);
      path.push(curr);

      const neighbors = fileAdj.get(curr) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfsCycle(neighbor, [...path]);
        } else if (recStack.has(neighbor)) {
          // Cycle found!
          const cycleStartIndex = path.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            const cyclePath = path.slice(cycleStartIndex);
            cyclePath.push(neighbor); // close loop

            // Normalize cycle signature to prevent duplicate representations
            const rawFiles = cyclePath.map((id) => id.replace('file::', ''));
            const minFile = rawFiles.slice(0, -1).reduce((m, f) => (f < m ? f : m), rawFiles[0]);
            const minIdx = rawFiles.indexOf(minFile);
            const normalized = [
              ...rawFiles.slice(minIdx, -1),
              ...rawFiles.slice(0, minIdx),
              minFile,
            ].join(' -> ');

            if (!cycleSignatures.has(normalized)) {
              cycleSignatures.add(normalized);
              circularDependencies.push({
                cycleId: `cycle-${circularDependencies.length + 1}`,
                length: cyclePath.length - 1,
                path: rawFiles,
                nodes: cyclePath.slice(0, -1).map((id) => {
                  const n = nodes.find((node) => node.nodeId === id);
                  return {
                    id,
                    name: n?.name || path.basename(id),
                    filePath: n?.filePath || id.replace('file::', ''),
                  };
                }),
                impact: 'Causes undefined exports at runtime, memory leaks, and brittle module coupling.',
                suggestion: `Break the cycle between ${rawFiles[0]} and ${rawFiles[1]} by extracting shared models, interfaces, or helper functions into a dedicated common utility module.`,
              });
            }
          }
        }
      }

      recStack.delete(curr);
    };

    fileNodes.forEach((n) => {
      if (!visited.has(n.nodeId)) {
        dfsCycle(n.nodeId, []);
      }
    });

    // --- 2. DEAD CODE & UNUSED EXPORTS DETECTION ---
    const inDegreeMap = new Map();
    const referenceInDegreeMap = new Map();
    nodes.forEach((n) => {
      inDegreeMap.set(n.nodeId, 0);
      referenceInDegreeMap.set(n.nodeId, 0);
    });
    edges.forEach((e) => {
      inDegreeMap.set(e.target, (inDegreeMap.get(e.target) || 0) + 1);
      if (e.type !== 'DEFINES') {
        referenceInDegreeMap.set(e.target, (referenceInDegreeMap.get(e.target) || 0) + 1);
      }
    });

    const unusedSymbols = [];
    nodes.forEach((n) => {
      const refInDeg = referenceInDegreeMap.get(n.nodeId) || 0;
      // Entry files like server.js, index.js, app.js are roots
      const isEntryFile = /^(index|server|app|main)\.(js|ts|jsx|tsx)$/i.test(n.name);

      if (refInDeg === 0 && !isEntryFile && n.type !== 'module') {
        if (n.type === 'function' || n.type === 'method' || n.type === 'class') {
          unusedSymbols.push({
            id: n.nodeId,
            name: n.name,
            type: n.type,
            filePath: n.filePath,
            startLine: n.startLine,
            endLine: n.endLine,
            reason: `Zero incoming calls, routes, or imports across the codebase.`,
            confidence: n.exported ? 'Medium (Exported but unused)' : 'High (Dead internal code)',
          });
        } else if (n.type === 'file' && !n.filePath.includes('test') && !n.filePath.includes('spec') && !n.filePath.endsWith('.d.ts')) {
          unusedSymbols.push({
            id: n.nodeId,
            name: n.name,
            type: 'file',
            filePath: n.filePath,
            startLine: 1,
            endLine: n.endLine,
            reason: 'File is never imported by any other module in this project.',
            confidence: 'High (Orphan file)',
          });
        }
      }
    });

    // --- 3. ARCHITECTURAL HOTSPOTS & CENTRALITY ---
    const outDegreeMap = new Map();
    nodes.forEach((n) => outDegreeMap.set(n.nodeId, 0));
    edges.forEach((e) => {
      outDegreeMap.set(e.source, (outDegreeMap.get(e.source) || 0) + 1);
    });

    const hotspots = [];
    nodes
      .filter((n) => n.type === 'file' || n.type === 'function' || n.type === 'class')
      .forEach((n) => {
        const inDeg = inDegreeMap.get(n.nodeId) || 0;
        const outDeg = outDegreeMap.get(n.nodeId) || 0;
        const totalDegree = inDeg + outDeg;

        if (totalDegree >= 2) {
          // Centrality calculation
          const centralityScore = Math.round((inDeg * 1.5 + outDeg * 1.0) * 10) / 10;
          let riskLevel = 'LOW';
          let description = 'Normal component connectivity.';

          if (centralityScore >= 8 || inDeg >= 5) {
            riskLevel = 'HIGH';
            description = 'Critical architectural nexus! Changes here have high blast radius across multiple files.';
          } else if (centralityScore >= 4) {
            riskLevel = 'MEDIUM';
            description = 'Moderately coupled module with several upstream or downstream dependencies.';
          }

          hotspots.push({
            id: n.nodeId,
            name: n.name,
            type: n.type,
            filePath: n.filePath,
            inDegree: inDeg,
            outDegree: outDeg,
            totalDegree,
            centralityScore,
            riskLevel,
            description,
          });
        }
      });

    hotspots.sort((a, b) => b.centralityScore - a.centralityScore);

    return {
      circularDependencies,
      unusedSymbols: unusedSymbols.slice(0, 30),
      hotspots: hotspots.slice(0, 25),
    };
  }

  /**
   * Trace execution flow step-by-step from an API Route or Function
   * @param {string} startNodeId
   * @param {Array} nodes
   * @param {Array} edges
   */
  traceFlow(startNodeId, nodes, edges) {
    const nodeMap = new Map(nodes.map((n) => [n.nodeId, n]));
    const startNode = nodeMap.get(startNodeId);
    if (!startNode) return null;

    const steps = [];
    const visited = new Set();

    const traverse = (currId, depth = 1) => {
      if (visited.has(currId) || depth > 8) return;
      visited.add(currId);

      const node = nodeMap.get(currId);
      if (!node) return;

      steps.push({
        step: depth,
        nodeId: node.nodeId,
        type: node.type,
        name: node.name,
        filePath: node.filePath,
        startLine: node.startLine,
        endLine: node.endLine,
        docstring: node.docstring,
        params: node.params,
      });

      // Find outgoing ROUTED_TO and CALLS edges
      const outgoingEdges = edges.filter(
        (e) => e.source === currId && (e.type === 'ROUTED_TO' || e.type === 'CALLS' || e.type === 'DEFINES')
      );

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          traverse(edge.target, depth + 1);
        }
      }
    };

    traverse(startNodeId, 1);

    return {
      startNode,
      totalSteps: steps.length,
      trace: steps,
    };
  }
}

module.exports = new GraphService();
