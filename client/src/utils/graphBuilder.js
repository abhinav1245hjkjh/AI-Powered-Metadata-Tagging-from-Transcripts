/**
 * Narrative Intelligence Graph Builder — MetaScript AI
 * 
 * Transforms real transcript NLP metadata (category, keywords, entities, speakers, segments, rawText)
 * into a structured, hierarchical Narrative Intelligence Graph.
 * 
 * Hierarchy:
 * - Level 0 (Center): Central Narrative (Domain / Overarching Theme)
 * - Level 1 (Inner Orbit): Core Subthemes & Topics (KeyBERT keyphrases with relevance scores)
 * - Level 2 (Outer Orbit): Key Interlocutors (Speakers) & Key Named Entities (spaCy)
 * 
 * Generates deterministic collision-free radial coordinates, normalized relationship scores,
 * and comprehensive connectivity metrics.
 */

const NORMALIZE_ENTITY_TYPE = {
  PERSON: 'ENTITY',
  PER: 'ENTITY',
  ORG: 'ENTITY',
  ORGANIZATION: 'ENTITY',
  GPE: 'ENTITY',
  LOC: 'ENTITY',
  LOCATION: 'ENTITY',
  PRODUCT: 'ENTITY',
  EVENT: 'ENTITY'
};

export const buildIntelligenceGraph = (transcript) => {
  if (!transcript || !transcript.metadata) {
    return {
      nodes: [],
      edges: [],
      centralNode: null,
      stats: { totalNodes: 0, totalEdges: 0, topics: 0, speakers: 0, entities: 0 },
      insights: null
    };
  }

  const meta = transcript.metadata;
  const rawText = transcript.rawText || '';
  const segments = meta.segments && meta.segments.length > 0
    ? meta.segments
    : [{ index: 0, heading: 'Full Script', text: rawText }];

  const rawKeywords = Array.isArray(meta.keywords) ? meta.keywords : [];
  const rawSpeakers = Array.isArray(meta.speakers) ? meta.speakers : [];
  const rawEntities = Array.isArray(meta.entities) ? meta.entities : [];
  const category = meta.category || { label: 'General Conversation', confidence: 0.88 };

  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // 1. Establish the CENTRAL NARRATIVE NODE (Level 0)
  // Derived from the domain category or transcript primary theme
  const centralLabel = category.label
    ? category.label.charAt(0).toUpperCase() + category.label.slice(1)
    : transcript.title || 'Central Narrative';

  const centralConfidence = Number((category.confidence || 0.92).toFixed(2));

  const centralNode = {
    id: 'node_central',
    label: centralLabel,
    sublabel: 'Primary Narrative Domain',
    type: 'CENTRAL',
    ring: 0,
    relevance: centralConfidence,
    relevanceTier: 'High',
    mentions: segments.length,
    description: `The overarching domain narrative connecting core subthemes, dialogue turns, and entities across ${segments.length} transcript segments.`,
    segmentIndices: segments.map((_, i) => i + 1),
    degree: 0,
    radius: 46
  };

  nodes.push(centralNode);
  nodeMap.set(centralNode.id, centralNode);

  // 2. Establish Level 1: Core Subthemes & Topics (Inner Orbit)
  // Select top 4–6 distinct keywords
  const topTopics = rawKeywords.slice(0, 6);
  const topicNodeIds = [];

  topTopics.forEach((kw, idx) => {
    const cleanKw = (kw || '').trim();
    if (!cleanKw || cleanKw.toLowerCase() === centralLabel.toLowerCase()) return;

    const id = `top_${cleanKw.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (nodeMap.has(id)) return;

    // Count occurrences across segments
    const matchedSegments = [];
    segments.forEach((seg, sIdx) => {
      if ((seg.text || '').toLowerCase().includes(cleanKw.toLowerCase())) {
        matchedSegments.push(sIdx + 1);
      }
    });

    const occurrences = matchedSegments.length || 1;
    // Score derived from rank and occurrence frequency
    const topicRelevance = Number(Math.max(0.65, 0.88 - idx * 0.05 + Math.min(0.1, occurrences * 0.02)).toFixed(2));

    const topicNode = {
      id,
      label: cleanKw.charAt(0).toUpperCase() + cleanKw.slice(1),
      sublabel: 'Key Topic',
      type: 'TOPIC',
      ring: 1,
      relevance: topicRelevance,
      relevanceTier: topicRelevance >= 0.8 ? 'High' : 'Medium',
      mentions: occurrences,
      description: `Core topical concept extracted with KeyBERT contextual embeddings. Discussed in ${occurrences} segment(s).`,
      segmentIndices: matchedSegments,
      degree: 0,
      radius: 34
    };

    nodes.push(topicNode);
    nodeMap.set(id, topicNode);
    topicNodeIds.push(id);

    // Direct relationship from Central Narrative -> Subtheme
    const edgeStrength = Number((topicRelevance * 0.95).toFixed(2));
    edges.push({
      id: `edge_central_${id}`,
      source: 'node_central',
      target: id,
      type: 'CORE_THEME',
      label: 'Core Theme',
      strength: edgeStrength,
      weight: edgeStrength >= 0.8 ? 'High' : 'Medium'
    });
  });

  // 3. Establish Level 2: Interlocutors & Named Entities (Outer Orbit)
  // Process Speakers
  const speakerNodeIds = [];
  const totalTurns = rawSpeakers.reduce((acc, s) => acc + (s.lineCount || 1), 0) || 1;

  rawSpeakers.slice(0, 4).forEach((spk, idx) => {
    const spkName = (spk.speaker || '').trim();
    if (!spkName) return;

    const id = `spk_${spkName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (nodeMap.has(id)) return;

    const turns = spk.lineCount || 1;
    const speakerRelevance = Number(Math.max(0.60, 0.85 - idx * 0.06 + (turns / totalTurns) * 0.15).toFixed(2));

    // Find segments where speaker is active
    const spkSegments = [];
    segments.forEach((seg, sIdx) => {
      if ((seg.text || '').toLowerCase().includes(spkName.toLowerCase()) || (seg.heading && seg.heading.toLowerCase().includes(spkName.toLowerCase()))) {
        spkSegments.push(sIdx + 1);
      }
    });

    const spkNode = {
      id,
      label: spkName,
      sublabel: 'Active Speaker',
      type: 'SPEAKER',
      ring: 2,
      relevance: speakerRelevance,
      relevanceTier: speakerRelevance >= 0.75 ? 'High' : 'Medium',
      mentions: turns,
      description: `Identified interlocutor contributing ${turns} dialogue turn(s) (${Math.round((turns / totalTurns) * 100)}% of conversation).`,
      segmentIndices: spkSegments,
      degree: 0,
      radius: 28
    };

    nodes.push(spkNode);
    nodeMap.set(id, spkNode);
    speakerNodeIds.push(id);

    // Connect speaker to the most relevant topic or central narrative
    // Find if speaker co-occurs with any topic
    let bestTopicId = null;
    topTopics.forEach((t) => {
      const tId = `top_${t.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const topicNode = nodeMap.get(tId);
      if (topicNode && topicNode.segmentIndices.some((idx) => spkSegments.includes(idx))) {
        bestTopicId = tId;
      }
    });

    const targetId = bestTopicId || 'node_central';
    const edgeStrength = Number((speakerRelevance * 0.88).toFixed(2));

    edges.push({
      id: `edge_${id}_${targetId}`,
      source: targetId,
      target: id,
      type: 'DISCUSSES',
      label: targetId === 'node_central' ? 'Participates in' : 'Discusses',
      strength: edgeStrength,
      weight: edgeStrength >= 0.75 ? 'High' : 'Medium'
    });
  });

  // Process Entities (People, Orgs, Locations)
  const entityNodeIds = [];
  const uniqueEntitiesMap = new Map();

  rawEntities.forEach((e) => {
    const text = (e.text || '').trim();
    if (!text || text.length < 2) return;
    // Don't duplicate if already a speaker or central
    if (speakerNodeIds.some((sId) => sId.includes(text.toLowerCase())) || text.toLowerCase() === centralLabel.toLowerCase()) return;
    if (!uniqueEntitiesMap.has(text.toLowerCase())) {
      uniqueEntitiesMap.set(text.toLowerCase(), { text, label: e.label });
    }
  });

  const topEntities = Array.from(uniqueEntitiesMap.values()).slice(0, 4);

  topEntities.forEach((ent, idx) => {
    const id = `ent_${ent.text.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (nodeMap.has(id)) return;

    const entSegments = [];
    segments.forEach((seg, sIdx) => {
      if ((seg.text || '').toLowerCase().includes(ent.text.toLowerCase())) {
        entSegments.push(sIdx + 1);
      }
    });

    const mentions = entSegments.length || 1;
    const entityRelevance = Number(Math.max(0.55, 0.75 - idx * 0.05 + Math.min(0.12, mentions * 0.03)).toFixed(2));

    const entNode = {
      id,
      label: ent.text,
      sublabel: ent.label || 'Entity',
      type: 'ENTITY',
      ring: 2,
      relevance: entityRelevance,
      relevanceTier: entityRelevance >= 0.7 ? 'Medium' : 'Low',
      mentions,
      description: `Named entity identified by spaCy NER. Referenced in ${mentions} transcript segment(s).`,
      segmentIndices: entSegments,
      degree: 0,
      radius: 26
    };

    nodes.push(entNode);
    nodeMap.set(id, entNode);
    entityNodeIds.push(id);

    // Connect entity to closest topic or central node
    let bestTopicId = null;
    topTopics.forEach((t) => {
      const tId = `top_${t.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const topicNode = nodeMap.get(tId);
      if (topicNode && topicNode.segmentIndices.some((idx) => entSegments.includes(idx))) {
        bestTopicId = tId;
      }
    });

    const targetId = bestTopicId || 'node_central';
    const edgeStrength = Number((entityRelevance * 0.82).toFixed(2));

    edges.push({
      id: `edge_${id}_${targetId}`,
      source: targetId,
      target: id,
      type: 'REFERENCED_WITH',
      label: 'Referenced with',
      strength: edgeStrength,
      weight: edgeStrength >= 0.7 ? 'Medium' : 'Low'
    });
  });

  // Calculate Node Degrees & Connections
  edges.forEach((edge) => {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    if (sNode) sNode.degree += 1;
    if (tNode) tNode.degree += 1;
  });

  // Compute Deterministic Radial Positions for 100% Collision-Free Layout
  // Width: 800, Height: 520, Center: (400, 250)
  const cx = 400;
  const cy = 250;

  // Level 0: Central Node
  centralNode.x = cx;
  centralNode.y = cy;

  // Level 1: Inner Orbit (Core Subthemes / Topics)
  const rx1 = 175;
  const ry1 = 135;
  const numRing1 = topicNodeIds.length;
  topicNodeIds.forEach((id, idx) => {
    const node = nodeMap.get(id);
    if (!node) return;
    const angle = (idx / Math.max(1, numRing1)) * 2 * Math.PI - Math.PI / 2;
    node.x = cx + Math.cos(angle) * rx1;
    node.y = cy + Math.sin(angle) * ry1;
  });

  // Level 2: Outer Orbit (Speakers & Entities)
  const rx2 = 295;
  const ry2 = 210;
  const ring2Ids = [...speakerNodeIds, ...entityNodeIds];
  const numRing2 = ring2Ids.length;
  const angleOffset = numRing1 > 0 ? (Math.PI / numRing1) * 0.5 : 0;

  ring2Ids.forEach((id, idx) => {
    const node = nodeMap.get(id);
    if (!node) return;
    const angle = (idx / Math.max(1, numRing2)) * 2 * Math.PI - Math.PI / 2 + angleOffset;
    node.x = cx + Math.cos(angle) * rx2;
    node.y = cy + Math.sin(angle) * ry2;
  });

  // Statistics
  const stats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    topics: topicNodeIds.length,
    speakers: speakerNodeIds.length,
    entities: entityNodeIds.length
  };

  const insights = {
    centralTheme: centralNode.label,
    topTopic: topicNodeIds.length > 0 ? nodeMap.get(topicNodeIds[0])?.label : 'None',
    dominantSpeaker: speakerNodeIds.length > 0 ? nodeMap.get(speakerNodeIds[0])?.label : 'None',
    connectionCount: edges.length
  };

  return {
    nodes,
    edges,
    centralNode,
    stats,
    insights
  };
};
