import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Tag,
  Mic,
  Building2,
  ExternalLink,
  Compass,
  Network,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_STYLES = {
  CENTRAL: {
    color: '#1D4ED8',      // Deep Blue
    border: '#1D4ED8',
    bg: '#EFF6FF',
    text: '#1E3A8A',
    badgeBg: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]',
    accentBorder: 'border-l-[#1D4ED8]',
    icon: Compass,
    label: 'Central Theme'
  },
  TOPIC: {
    color: '#2563EB',      // Primary Blue
    border: '#60A5FA',
    bg: '#EFF6FF',
    text: '#1E3A8A',
    badgeBg: 'bg-[#EFF6FF] text-[#1E3A8A] border-[#93C5FD]',
    accentBorder: 'border-l-[#2563EB]',
    icon: Tag,
    label: 'Topic'
  },
  SPEAKER: {
    color: '#7C3AED',      // Professional Purple
    border: '#A78BFA',
    bg: '#F5F3FF',
    text: '#4C1D95',
    badgeBg: 'bg-[#F5F3FF] text-[#4C1D95] border-[#DDD6FE]',
    accentBorder: 'border-l-[#7C3AED]',
    icon: Mic,
    label: 'Speaker'
  },
  ENTITY: {
    color: '#15803D',      // Professional Green
    border: '#4ADE80',
    bg: '#F0FDF4',
    text: '#166534',
    badgeBg: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    accentBorder: 'border-l-[#15803D]',
    icon: Building2,
    label: 'Named Entity'
  }
};

const NarrativeGraph = ({
  graphData,
  onNavigateToTranscript,
  title = 'Transcript'
}) => {
  const { nodes = [], edges = [], centralNode } = graphData;

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Viewport transformation states (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Filtering & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState('node_central');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Node Dragging Positions
  const [positions, setPositions] = useState({});
  const [draggedNodeId, setDraggedNodeId] = useState(null);

  // Initialize Deterministic Node Positions
  useEffect(() => {
    if (nodes.length === 0) return;
    const initial = {};
    nodes.forEach((n) => {
      initial[n.id] = { x: n.x || 400, y: n.y || 250 };
    });
    setPositions(initial);
    if (!selectedNodeId && centralNode) {
      setSelectedNodeId(centralNode.id);
    }
  }, [nodes, centralNode]);

  // Handle Drag & Drop of Nodes
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handleMouseMove = (e) => {
    if (draggedNodeId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;

      const clampedX = Math.max(60, Math.min(740, rawX));
      const clampedY = Math.max(45, Math.min(455, rawY));

      setPositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: clampedX, y: clampedY }
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e) => {
    if (e.button === 0 && !draggedNodeId) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  // Wheel Zoom Handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.4, Math.min(2.5, prev * zoomFactor)));
  };

  // Reset Viewport
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (nodes.length > 0) {
      const initial = {};
      nodes.forEach((n) => {
        initial[n.id] = { x: n.x || 400, y: n.y || 250 };
      });
      setPositions(initial);
    }
    toast.success('Reset graph viewport');
  };

  // Filtered Visible Nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesType =
        selectedTypeFilter === 'ALL' || n.type === selectedTypeFilter || n.type === 'CENTRAL';
      const matchesSearch =
        !searchTerm.trim() || n.label.toLowerCase().includes(searchTerm.toLowerCase().trim());
      return matchesType && matchesSearch;
    });
  }, [nodes, selectedTypeFilter, searchTerm]);

  // Sort nodes so selected node renders last (on top of other elements)
  const sortedNodesForRender = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      if (a.id === selectedNodeId) return 1;
      if (b.id === selectedNodeId) return -1;
      return 0;
    });
  }, [filteredNodes, selectedNodeId]);

  const visibleNodeIdSet = useMemo(() => {
    return new Set(filteredNodes.map((n) => n.id));
  }, [filteredNodes]);

  // Filtered Visible Edges
  const filteredEdges = useMemo(() => {
    return edges.filter(
      (edge) => visibleNodeIdSet.has(edge.source) && visibleNodeIdSet.has(edge.target)
    );
  }, [edges, visibleNodeIdSet]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || centralNode || nodes[0] || null;
  }, [selectedNodeId, nodes, centralNode]);

  // Connected node IDs for highlighting
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNodeIdSet = useMemo(() => {
    if (!activeFocusId) return new Set();
    const set = new Set([activeFocusId]);
    edges.forEach((e) => {
      if (e.source === activeFocusId) set.add(e.target);
      if (e.target === activeFocusId) set.add(e.source);
    });
    return set;
  }, [activeFocusId, edges]);

  // Edges attached to the selected node
  const selectedNodeEdges = useMemo(() => {
    if (!selectedNode) return [];
    return edges
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((e) => {
        const otherId = e.source === selectedNode.id ? e.target : e.source;
        const otherNode = nodes.find((n) => n.id === otherId);
        return {
          id: e.id,
          strength: e.strength,
          otherNode: otherNode || { label: 'Unknown', type: 'ENTITY' }
        };
      })
      .sort((a, b) => b.strength - a.strength);
  }, [selectedNode, edges, nodes]);

  if (nodes.length === 0) {
    return (
      <div className="saas-card p-10 text-center space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
        <div className="w-10 h-10 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] flex items-center justify-center mx-auto text-[#475467]">
          <Network className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">
          Narrative Intelligence Graph Unavailable
        </h3>
        <p className="text-xs text-[#344054] max-w-md mx-auto">
          No extracted themes, topics, speakers, or entities were found. Process or re-analyze the transcript to generate the narrative network.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Search + Filter Tabs + Viewport Controls */}
      <div className="saas-card p-3 sm:p-4 bg-white border border-[#E4E7EC] shadow-saas">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left: Type Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'TOPIC', 'SPEAKER', 'ENTITY'].map((type) => {
              const count =
                type === 'ALL'
                  ? nodes.length
                  : nodes.filter((n) => n.type === type || (type === 'TOPIC' && n.type === 'CENTRAL')).length;

              const labelMap = {
                ALL: 'All Nodes',
                TOPIC: 'Topics',
                SPEAKER: 'Speakers',
                ENTITY: 'Entities'
              };

              const activeColorClass =
                type === 'SPEAKER'
                  ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                  : type === 'ENTITY'
                  ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                  : 'bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]';

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedTypeFilter === type
                      ? activeColorClass
                      : 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#344054] hover:text-[#111827] border border-[#D0D5DD]'
                  }`}
                >
                  <span>{labelMap[type]}</span>
                  <span className="ml-1.5 opacity-80 text-[10px] font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Right: Search Filter + Zoom Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#475467] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search concepts..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#D0D5DD] text-[#111827] text-xs placeholder-[#667085] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
                className="p-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#111827] border border-[#D0D5DD] transition-colors cursor-pointer shadow-saas"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, z / 1.15))}
                className="p-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#111827] border border-[#D0D5DD] transition-colors cursor-pointer shadow-saas"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#111827] border border-[#D0D5DD] transition-colors cursor-pointer shadow-saas"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Network Graph & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Main Canvas Area */}
        <div
          ref={containerRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="lg:col-span-8 xl:col-span-8 saas-card relative h-[520px] overflow-hidden bg-white border border-[#E4E7EC] shadow-saas select-none cursor-grab active:cursor-grabbing"
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox="0 0 800 500"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Subtle Radial Grid Pattern */}
              <pattern id="light-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="#E5E7EB" />
              </pattern>

              {/* Pulsing Glow Animation Filter for Active Selection */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#light-grid)" />

            {/* Transformable Canvas Group */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              
              {/* Concentric Guide Orbits matching exact radial nodes */}
              <ellipse cx="400" cy="250" rx="175" ry="135" fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="5 5" />
              <ellipse cx="400" cy="250" rx="295" ry="210" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />

              {/* Relationship Links (Edges) */}
              {filteredEdges.map((edge) => {
                const sourcePos = positions[edge.source];
                const targetPos = positions[edge.target];
                if (!sourcePos || !targetPos) return null;

                const isConnectedToActive =
                  activeFocusId && (edge.source === activeFocusId || edge.target === activeFocusId);

                // Determine semantic edge color based on connected node types
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                const hasSpeaker = sourceNode?.type === 'SPEAKER' || targetNode?.type === 'SPEAKER';
                const hasEntity = sourceNode?.type === 'ENTITY' || targetNode?.type === 'ENTITY';

                const edgeStroke = isConnectedToActive
                  ? hasSpeaker
                    ? '#8B5CF6'
                    : hasEntity
                    ? '#22C55E'
                    : '#2563EB'
                  : '#CBD5E1';

                const edgeWidth = isConnectedToActive ? 3.0 : Math.max(1.5, edge.strength * 2);
                const edgeOpacity = isConnectedToActive ? 1 : 0.75;

                // Midpoint for score badge
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;

                return (
                  <g key={edge.id} className="transition-all duration-200">
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={edgeStroke}
                      strokeWidth={edgeWidth}
                      strokeOpacity={edgeOpacity}
                    />

                    {/* Edge Strength Pill */}
                    {isConnectedToActive && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-14"
                          y="-8"
                          width="28"
                          height="16"
                          rx="4"
                          fill="#FFFFFF"
                          stroke={edgeStroke}
                          strokeWidth="1.5"
                        />
                        <text
                          y="3.5"
                          textAnchor="middle"
                          fill={edgeStroke}
                          fontSize="9"
                          fontWeight="800"
                          fontFamily="Inter, monospace"
                          className="select-none pointer-events-none"
                        >
                          {edge.strength}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Interactive Graph Nodes (Sorted so selected node renders on top) */}
              {sortedNodesForRender.map((node) => {
                const pos = positions[node.id] || { x: node.x || 400, y: node.y || 250 };
                const isSelected = selectedNodeId === node.id;
                const isCentral = node.type === 'CENTRAL';

                const style = CATEGORY_STYLES[node.type] || CATEGORY_STYLES.ENTITY;
                const radius = isCentral ? 34 : isSelected ? 24 : 20;

                const isFocusActive = Boolean(activeFocusId);
                const isNodeConnected = connectedNodeIdSet.has(node.id);
                const nodeOpacity = isFocusActive ? (isNodeConnected ? 1 : 0.85) : 1;

                // Smart Label Truncation (Max 14 chars on node text)
                const truncatedLabel =
                  node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    opacity={nodeOpacity}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                    className="cursor-pointer group transition-opacity duration-200"
                  >
                    {/* Outer Focus Glow Ring if Selected */}
                    {isSelected && (
                      <g>
                        <circle
                          r={radius + 8}
                          fill="none"
                          stroke={style.color}
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          filter="url(#glow)"
                          className="animate-pulse"
                        />
                        <circle
                          r={radius + 4}
                          fill="none"
                          stroke={style.color}
                          strokeWidth="1.5"
                          opacity="0.6"
                        />
                      </g>
                    )}

                    {/* Node Main Circle with Solid Background Fill */}
                    <circle
                      r={radius}
                      fill={style.bg}
                      stroke={isSelected ? style.color : style.border}
                      strokeWidth={isSelected || isCentral ? 3.5 : 2.5}
                      className="transition-all duration-200 shadow-sm"
                    />

                    {/* Node Core Icon or Inner Dot */}
                    {isCentral ? (
                      <g className="pointer-events-none select-none">
                        <circle r="10" fill="#1D4ED8" />
                        <text
                          textAnchor="middle"
                          y="3.5"
                          fill="#FFFFFF"
                          fontSize="9"
                          fontWeight="800"
                          fontFamily="Inter, sans-serif"
                        >
                          CORE
                        </text>
                      </g>
                    ) : (
                      <circle
                        r="6"
                        fill={style.color}
                        className="pointer-events-none"
                      />
                    )}

                    {/* Active Selected Badge Tag */}
                    {isSelected && (
                      <g transform={`translate(0, ${-(radius + 24)})`} className="pointer-events-none select-none">
                        <rect
                          x="-26"
                          y="-8"
                          width="52"
                          height="15"
                          rx="4"
                          fill={style.color}
                        />
                        <text
                          y="3.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8"
                          fontWeight="800"
                          fontFamily="Inter, sans-serif"
                          letterSpacing="0.5"
                        >
                          SELECTED
                        </text>
                      </g>
                    )}

                    {/* Primary Label with Solid White Outline Paint-Order Halo Shield */}
                    <text
                      y={isSelected ? -(radius + 8) : -(radius + 7)}
                      textAnchor="middle"
                      fill={isSelected ? style.color : style.text}
                      stroke="#FFFFFF"
                      strokeWidth="5"
                      paintOrder="stroke fill"
                      strokeLinejoin="round"
                      fontSize={isCentral ? 13 : 11}
                      fontWeight={isSelected || isCentral ? 800 : 700}
                      fontFamily="Inter, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {truncatedLabel}
                    </text>

                    {/* Node Relevance Score Pill Badge */}
                    <g transform={`translate(0, ${radius + 14})`} className="pointer-events-none select-none">
                      <rect
                        x="-16"
                        y="-8"
                        width="32"
                        height="14"
                        rx="4"
                        fill="#FFFFFF"
                        stroke="#E4E7EC"
                        strokeWidth="1"
                      />
                      <text
                        y="2.5"
                        textAnchor="middle"
                        fill="#475467"
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="Inter, monospace"
                      >
                        {node.relevance}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Node Hover Tooltip */}
          {hoveredNodeId && positions[hoveredNodeId] && (
            <div
              className="absolute pointer-events-none p-3 rounded-lg bg-white border border-[#E4E7EC] shadow-dropdown text-xs z-30 space-y-1"
              style={{
                left: `${positions[hoveredNodeId].x * zoom + pan.x + 15}px`,
                top: `${positions[hoveredNodeId].y * zoom + pan.y - 15}px`
              }}
            >
              {(() => {
                const n = nodes.find((node) => node.id === hoveredNodeId);
                if (!n) return null;
                const style = CATEGORY_STYLES[n.type] || CATEGORY_STYLES.ENTITY;
                return (
                  <div>
                    <div className="flex items-center gap-2 font-bold text-[#111827]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.color }} />
                      <span>{n.label}</span>
                    </div>
                    <div className="text-[10px] text-[#475467] font-mono mt-0.5 font-semibold">
                      Type: <span className="text-[#111827] font-bold">{n.sublabel || n.type}</span> • Relevance: <span className="text-[#2563EB] font-bold">{n.relevance}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Clean Bottom Legend (Exact Semantic Palette Match) */}
          <div className="absolute bottom-3 left-3 p-2.5 rounded-lg bg-white/95 border border-[#E4E7EC] backdrop-blur-sm flex items-center gap-4 text-[11px] font-mono text-[#111827] font-bold shadow-saas">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" /> Central Theme
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" /> Topic
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" /> Speaker
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" /> Entity
            </span>
          </div>
        </div>

        {/* 3. Right-Side Theme Details Panel (Linked to Selected Graph Node) */}
        {selectedNode && (
          <div className={`lg:col-span-4 xl:col-span-4 saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas border-l-4 transition-all duration-200 ${CATEGORY_STYLES[selectedNode.type]?.accentBorder || 'border-l-[#2563EB]'}`}>
            
            {/* Active Selection Connection Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                <span className="w-2 h-2 rounded-full bg-[#2563EB] -ml-4" />
                <span>Viewing Selected Node in Graph</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
            </div>

            <div className="flex items-start justify-between border-b border-[#EAECF0] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#475467] tracking-wider">
                  Theme Details
                </span>
                <h3 className="text-base font-bold text-[#111827] mt-0.5 break-words">
                  {selectedNode.label}
                </h3>
              </div>

              {(() => {
                const style = CATEGORY_STYLES[selectedNode.type] || CATEGORY_STYLES.ENTITY;
                return (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${style.badgeBg}`}>
                    {selectedNode.sublabel || selectedNode.type}
                  </span>
                );
              })()}
            </div>

            {/* Relevance Score Bar */}
            <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#475467] font-semibold">Relevance Score:</span>
                <span className="font-mono font-bold text-[#2563EB]">{selectedNode.relevance}</span>
              </div>
              <div className="h-2 w-full bg-[#E4E7EC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(selectedNode.relevance * 100)}%` }}
                />
              </div>
            </div>

            {/* Description / Metadata */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#111827]">Context:</span>
              <p className="text-[#344054] leading-relaxed text-xs bg-[#F9FAFB] p-3 rounded-lg border border-[#E4E7EC]">
                {selectedNode.description || 'No additional information available.'}
              </p>
            </div>

            {/* Jump to Raw Transcript */}
            <button
              type="button"
              onClick={() => onNavigateToTranscript && onNavigateToTranscript(selectedNode.label)}
              className="w-full py-2.5 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-saas transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View in Raw Transcript</span>
            </button>

            {/* Connected Themes List */}
            <div className="space-y-2 pt-1 border-t border-[#EAECF0]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827]">
                  Connected Concepts ({selectedNodeEdges.length})
                </h4>
              </div>

              {selectedNodeEdges.length === 0 ? (
                <p className="text-xs text-[#667085] italic">No direct connections.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedNodeEdges.map((item) => {
                    const style = CATEGORY_STYLES[item.otherNode.type] || CATEGORY_STYLES.ENTITY;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedNodeId(item.otherNode.id)}
                        className="w-full p-2.5 rounded-lg bg-[#F9FAFB] hover:bg-[#EFF6FF] border border-[#E4E7EC] text-left flex items-center justify-between text-xs transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: style.color }} />
                          <span className="text-[#111827] font-bold truncate group-hover:text-[#2563EB]">
                            {item.otherNode.label}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#2563EB]">
                          {item.strength}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NarrativeGraph;
