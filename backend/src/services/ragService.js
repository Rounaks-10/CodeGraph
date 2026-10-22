const axios = require('axios');

class RAGService {
  constructor() {
    this.vectorIndices = new Map(); // repoId -> Array<{ id, text, vector, node }>
  }

  /**
   * Simple, fast deterministic token vectorizer for fallback similarity search
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\.\/]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);
  }

  computeVector(text, vocabulary) {
    const tokens = this.tokenize(text);
    const vec = new Float32Array(vocabulary.size);
    const termFreq = new Map();

    tokens.forEach((t) => termFreq.set(t, (termFreq.get(t) || 0) + 1));
    let idx = 0;
    for (const term of vocabulary) {
      if (termFreq.has(term)) {
        vec[idx] = termFreq.get(term) / tokens.length;
      }
      idx++;
    }
    return vec;
  }

  cosineSimilarity(vecA, vecB) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Build vector index for a repository's AST nodes and files
   */
  indexRepository(repoId, nodes, edges) {
    const chunks = [];
    const vocabulary = new Set();

    nodes.forEach((n) => {
      const relatedEdges = edges.filter((e) => e.source === n.nodeId || e.target === n.nodeId);
      const edgeSummary = relatedEdges
        .map((e) => `${e.type} ${e.source === n.nodeId ? 'to ' + e.target : 'from ' + e.source}`)
        .join(', ');

      const text = [
        `Type: ${n.type}`,
        `Name: ${n.name}`,
        `File: ${n.filePath}`,
        `Lines: ${n.startLine}-${n.endLine}`,
        n.params?.length ? `Parameters: ${n.params.join(', ')}` : '',
        n.docstring ? `Documentation: ${n.docstring}` : '',
        n.metadata?.method ? `HTTP Method: ${n.metadata.method}` : '',
        n.metadata?.path ? `Route Path: ${n.metadata.path}` : '',
        `Connections: ${edgeSummary}`,
      ]
        .filter(Boolean)
        .join('\n');

      this.tokenize(text).forEach((w) => vocabulary.add(w));
      chunks.push({ id: n.nodeId, text, node: n });
    });

    const vocabList = Array.from(vocabulary);
    const vocabSet = new Set(vocabList);

    const indexedItems = chunks.map((chunk) => ({
      ...chunk,
      vector: this.computeVector(chunk.text, vocabSet),
    }));

    this.vectorIndices.set(repoId, {
      vocabulary: vocabSet,
      items: indexedItems,
    });
  }

  /**
   * Retrieve relevant nodes using vector search + graph neighborhood expansion
   */
  retrieve(repoId, query, nodes, edges, topK = 5) {
    const index = this.vectorIndices.get(repoId);
    if (!index || index.items.length === 0) {
      this.indexRepository(repoId, nodes, edges);
    }

    const currentIndex = this.vectorIndices.get(repoId);
    if (!currentIndex) return [];

    const queryVec = this.computeVector(query, currentIndex.vocabulary);
    const scored = currentIndex.items.map((item) => ({
      ...item,
      score: this.cosineSimilarity(queryVec, item.vector),
    }));

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, topK);

    // Graph expansion: pull in immediate neighbors (calls, routed_to, imports)
    const expandedNodeIds = new Set(topMatches.map((m) => m.node.nodeId));
    topMatches.forEach((m) => {
      edges.forEach((e) => {
        if (e.source === m.node.nodeId) expandedNodeIds.add(e.target);
        if (e.target === m.node.nodeId) expandedNodeIds.add(e.source);
      });
    });

    const nodeMap = new Map(nodes.map((n) => [n.nodeId, n]));
    const contextNodes = Array.from(expandedNodeIds)
      .map((id) => nodeMap.get(id))
      .filter(Boolean);

    return { topMatches, contextNodes };
  }

  /**
   * Built-in Graph Reasoning Engine
   * Generates comprehensive, grounded analysis from AST + graph topology
   */
  generateLocalExplanation(query, repo, relevantData, report, edges) {
    const { topMatches, contextNodes } = relevantData;
    const lowerQ = query.toLowerCase();

    // Check if query is about an API route call flow
    const routeMatch = contextNodes.find(
      (n) => n.type === 'route' || lowerQ.includes('api') || lowerQ.includes('called') || lowerQ.includes('post') || lowerQ.includes('get')
    );

    // Check if query is about circular dependencies
    if (lowerQ.includes('circular') || lowerQ.includes('cycle') || lowerQ.includes('deadlock')) {
      if (!report || report.circularDependencies.length === 0) {
        return {
          answer: `### Code Quality Analysis: Circular Dependencies\n\nNo circular import dependencies were detected in this repository. All modules have clean, acyclic dependency trees!`,
          citations: [],
        };
      }
      const cycles = report.circularDependencies;
      let text = `### Circular Dependencies Detected (${cycles.length} found)\n\n`;
      cycles.forEach((c, idx) => {
        text += `#### Cycle ${idx + 1}: ${c.path.join(' -> ')}\n`;
        text += `- **Impact**: ${c.impact}\n`;
        text += `- **Recommended Fix**: ${c.suggestion}\n\n`;
      });
      return {
        answer: text,
        citations: cycles[0].nodes.map((n) => ({
          filePath: n.filePath,
          line: 1,
          name: n.name,
        })),
      };
    }

    // Check if query is about unused code
    if (lowerQ.includes('unused') || lowerQ.includes('dead code')) {
      const unused = report?.unusedSymbols || [];
      if (unused.length === 0) {
        return {
          answer: `### Unused Code Analysis\n\nNo dead or unreferenced exported symbols were detected. Code coverage and module references appear healthy.`,
          citations: [],
        };
      }
      let text = `### Potentially Unused Code (${unused.length} identified)\n\n`;
      text += `| Symbol | Type | File | Location | Confidence |\n`;
      text += `| :--- | :--- | :--- | :--- | :--- |\n`;
      unused.slice(0, 10).forEach((s) => {
        text += `| \`${s.name}\` | ${s.type} | \`${s.filePath}\` | L${s.startLine}-${s.endLine} | ${s.confidence} |\n`;
      });
      text += `\n*Note: If these functions are meant for public library consumers or dynamic reflection, they can safely remain; otherwise they are candidates for pruning.*`;
      return {
        answer: text,
        citations: unused.slice(0, 5).map((u) => ({
          filePath: u.filePath,
          line: u.startLine,
          name: u.name,
        })),
      };
    }

    // Trace API or function execution flow
    if (routeMatch) {
      const startNode = routeMatch;
      const outgoing = edges.filter((e) => e.source === startNode.nodeId);
      const callChain = [];

      outgoing.forEach((e) => {
        const targetNode = contextNodes.find((cn) => cn.nodeId === e.target);
        if (targetNode) {
          callChain.push({ edge: e, node: targetNode });
          // Second hop
          edges
            .filter((e2) => e2.source === targetNode.nodeId)
            .forEach((e2) => {
              const subTarget = contextNodes.find((cn) => cn.nodeId === e2.target);
              if (subTarget) callChain.push({ edge: e2, node: subTarget });
            });
        }
      });

      let text = `### Execution Flow Analysis: \`${startNode.name}\`\n\n`;
      text += `When **\`${startNode.name}\`** is triggered in **\`${startNode.filePath}\`** (lines ${startNode.startLine}–${startNode.endLine}), the following execution pipeline takes place:\n\n`;

      text += `1. **Incoming Request Dispatch**: Handled by **\`${startNode.filePath}\`**.\n`;
      if (callChain.length > 0) {
        callChain.forEach((step, idx) => {
          text += `${idx + 2}. **${step.edge.type === 'ROUTED_TO' ? 'Controller Handler' : 'Function Invocation'}**: Triggers \`${step.node.name}\` in \`${step.node.filePath}\` (lines ${step.node.startLine}–${step.node.endLine}).\n`;
          if (step.node.docstring) {
            text += `   > *Doc: ${step.node.docstring}*\n`;
          }
          if (step.node.params?.length) {
            text += `   - Parameters: \`(${step.node.params.join(', ')})\`\n`;
          }
        });
      } else {
        text += `2. **Handler Processing**: Direct inline handler processes request body and sends JSON response.\n`;
      }

      text += `\n#### Architectural Insights:\n- **Primary File**: \`${startNode.filePath}\`\n- **Upstream / Downstream Connections**: ${outgoing.length} direct connection(s).\n`;

      const citations = [
        { filePath: startNode.filePath, line: startNode.startLine, name: startNode.name },
        ...callChain.map((c) => ({
          filePath: c.node.filePath,
          line: c.node.startLine,
          name: c.node.name,
        })),
      ];

      return { answer: text, citations };
    }

    // Default codebase assistant answer synthesized from top matching nodes
    let text = `### Codebase Intelligence Analysis\n\nBased on your query: *"**${query}**"*, here is the structural breakdown of the relevant codebase components:\n\n`;

    topMatches.slice(0, 4).forEach((match, idx) => {
      const n = match.node;
      text += `#### ${idx + 1}. \`${n.name}\` (${n.type})\n`;
      text += `- **File**: \`${n.filePath}\` (Lines ${n.startLine}–${n.endLine})\n`;
      if (n.docstring) text += `- **Description**: ${n.docstring}\n`;
      if (n.params?.length) text += `- **Signature**: \`(${n.params.join(', ')})\`\n`;

      const connected = edges.filter((e) => e.source === n.nodeId || e.target === n.nodeId);
      if (connected.length > 0) {
        text += `- **Relationships**:\n`;
        connected.slice(0, 3).forEach((e) => {
          const isSource = e.source === n.nodeId;
          const other = isSource ? e.target : e.source;
          text += `  - ${isSource ? 'Calls/Defines' : 'Referenced by'} \`${other.split('::').pop()}\` (${e.type})\n`;
        });
      }
      text += `\n`;
    });

    const citations = topMatches.map((m) => ({
      filePath: m.node.filePath,
      line: m.node.startLine,
      name: m.node.name,
    }));

    return { answer: text, citations };
  }

  /**
   * Main answer generator: Uses external LLM if API Key available, or falls back to reasoning engine
   */
  async ask(query, repo, nodes, edges, report, apiKey = null) {
    const relevantData = this.retrieve(repo.id || repo._id, query, nodes, edges, 6);
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!key) {
      // Use built-in deterministic graph reasoning engine
      return this.generateLocalExplanation(query, repo, relevantData, report, edges);
    }

    // If Gemini API Key provided
    if (key.startsWith('AIza') || process.env.GEMINI_API_KEY) {
      try {
        const geminiKey = process.env.GEMINI_API_KEY || key;
        const prompt = `You are CodeGraph, an expert AI codebase intelligence assistant.
Explain the codebase based on the provided repository context, AST symbols, and graph relationships.

Question: ${query}

Codebase Architecture & Relevant AST Symbols:
${relevantData.contextNodes
  .map(
    (n) =>
      `- [${n.type.toUpperCase()}] ${n.name} in ${n.filePath}:${n.startLine}-${n.endLine} (Params: ${n.params?.join(', ') || 'none'})`
  )
  .join('\n')}

Relationships & Call Graph:
${edges
  .filter((e) =>
    relevantData.contextNodes.some((cn) => cn.nodeId === e.source || cn.nodeId === e.target)
  )
  .slice(0, 20)
  .map((e) => `${e.source} --[${e.type}]--> ${e.target}`)
  .join('\n')}

Please provide a clear, comprehensive explanation. Include step-by-step traces if the user asks what happens when an API is called. Reference file paths and line numbers clearly.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
          },
          { timeout: 15000 }
        );

        const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          const citations = relevantData.topMatches.map((m) => ({
            filePath: m.node.filePath,
            line: m.node.startLine,
            name: m.node.name,
          }));
          return { answer: reply, citations };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local graph reasoning:', err.message);
      }
    }

    return this.generateLocalExplanation(query, repo, relevantData, report, edges);
  }
}

module.exports = new RAGService();
