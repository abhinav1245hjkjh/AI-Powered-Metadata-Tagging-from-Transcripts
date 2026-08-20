import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line
} from 'recharts';
import {
  Activity,
  TrendingUp,
  Users,
  Tag,
  Target,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import SentimentBadge from './SentimentBadge';

const CustomTimelineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.sentimentScore > 0.15;
    const isNegative = data.sentimentScore < -0.15;

    return (
      <div className="bg-white border border-[#E4E7EC] p-3 rounded-lg shadow-dropdown text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-[#EAECF0] pb-1.5">
          <span className="font-bold text-[#101828]">{data.title}</span>
          <span className="text-[10px] font-mono text-[#475467] font-bold">Seg #{data.index}</span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-[#344054]">
            <span className="text-[#475467] font-semibold">Speaker:</span>
            <span className="font-bold text-[#3157D5]">{data.speaker}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#475467] font-semibold">Sentiment:</span>
            <span className={`font-bold ${isPositive ? 'text-[#067647]' : isNegative ? 'text-[#B42318]' : 'text-[#344054]'}`}>
              {data.polarity} ({data.sentimentScore > 0 ? `+${data.sentimentScore}` : data.sentimentScore})
            </span>
          </div>

          <div className="flex justify-between text-[#344054]">
            <span className="text-[#475467] font-semibold">Emotion:</span>
            <span className="font-bold text-[#175CD3]">{data.dominantEmotion}</span>
          </div>

          <div className="flex justify-between text-[#344054]">
            <span className="text-[#475467] font-semibold">Intensity:</span>
            <span className="font-mono text-[#B54708] font-bold">{data.intensity}%</span>
          </div>
        </div>

        {data.topics && data.topics.length > 0 && (
          <div className="pt-1 text-[10px] text-[#475467] border-t border-[#EAECF0] truncate font-medium">
            Topic: <span className="text-[#101828] font-bold">{data.topics.join(', ')}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ConversationTimeline = ({
  timelineData,
  onNavigateToTranscript
}) => {
  const {
    segments = [],
    summary = {},
    turningPoints = [],
    speakerDistribution = [],
    topicOccurrences = []
  } = timelineData;

  const [selectedSegmentId, setSelectedSegmentId] = useState(
    segments[0] ? segments[0].id : null
  );
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState('ALL');
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState('ALL');
  const [zoomRange, setZoomRange] = useState('ALL');

  // Selected Segment Details
  const selectedSegment = useMemo(() => {
    return segments.find((s) => s.id === selectedSegmentId) || segments[0] || null;
  }, [segments, selectedSegmentId]);

  // Distinct Speakers for Filter
  const distinctSpeakers = useMemo(() => {
    const set = new Set(segments.map((s) => s.speaker));
    return ['ALL', ...Array.from(set)];
  }, [segments]);

  // Apply Range Slice
  const rangedSegments = useMemo(() => {
    if (segments.length <= 4) return segments;
    const mid = Math.floor(segments.length / 2);
    if (zoomRange === 'FIRST_HALF') return segments.slice(0, mid);
    if (zoomRange === 'SECOND_HALF') return segments.slice(mid);
    return segments;
  }, [segments, zoomRange]);

  // Apply Filtering
  const filteredSegments = useMemo(() => {
    return rangedSegments.filter((seg) => {
      const matchesSpeaker =
        selectedSpeakerFilter === 'ALL' ||
        seg.speaker.toLowerCase() === selectedSpeakerFilter.toLowerCase();
      const matchesSentiment =
        selectedSentimentFilter === 'ALL' ||
        seg.polarity.toLowerCase() === selectedSentimentFilter.toLowerCase();
      return matchesSpeaker && matchesSentiment;
    });
  }, [rangedSegments, selectedSpeakerFilter, selectedSentimentFilter]);

  if (!segments || segments.length === 0) {
    return (
      <div className="saas-card p-10 text-center space-y-2 bg-white border border-[#E4E7EC] shadow-saas">
        <Activity className="w-8 h-8 mx-auto text-[#475467]" />
        <h3 className="text-base font-bold text-[#101828]">
          No Timeline Dynamics Available
        </h3>
        <p className="text-xs text-[#344054] max-w-md mx-auto">
          Dialogue segments and sentiment trajectory could not be computed for this transcript.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Dynamics KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="saas-card p-4 bg-white border border-[#E4E7EC] space-y-1 shadow-saas">
          <div className="flex items-center justify-between text-[#475467]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Dialogue Flow
            </span>
            <Activity className="w-4 h-4 text-[#3157D5]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#101828] tabular-nums">
            {segments.length}
          </div>
          <p className="text-[11px] text-[#344054]">Continuous sequence turns</p>
        </div>

        <div className="saas-card p-4 bg-white border border-[#E4E7EC] space-y-1 shadow-saas">
          <div className="flex items-center justify-between text-[#475467]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Peak Positive
            </span>
            <TrendingUp className="w-4 h-4 text-[#067647]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#067647] tabular-nums">
            {summary.peakPositive !== undefined && summary.peakPositive !== null ? `+${summary.peakPositive}` : '0.00'}
          </div>
          <p className="text-[11px] text-[#344054]">Highest valence polarity</p>
        </div>

        <div className="saas-card p-4 bg-white border border-[#E4E7EC] space-y-1 shadow-saas">
          <div className="flex items-center justify-between text-[#475467]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Peak Negative
            </span>
            <TrendingUp className="w-4 h-4 text-[#B42318] rotate-180" />
          </div>
          <div className="text-xl font-bold font-mono text-[#B42318] tabular-nums">
            {summary.peakNegative !== undefined && summary.peakNegative !== null ? summary.peakNegative : '0.00'}
          </div>
          <p className="text-[11px] text-[#344054]">Trough sentiment valence</p>
        </div>

        <div className="saas-card p-4 bg-white border border-[#E4E7EC] space-y-1 shadow-saas">
          <div className="flex items-center justify-between text-[#475467]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Turning Points
            </span>
            <Target className="w-4 h-4 text-[#B54708]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#B54708] tabular-nums">
            {turningPoints.length}
          </div>
          <p className="text-[11px] text-[#344054]">Sentiment polarity shifts</p>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div className="saas-card p-3 sm:p-4 bg-white border border-[#E4E7EC] shadow-saas">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Speaker Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-[#475467] mr-1">Speaker:</span>
            {distinctSpeakers.slice(0, 5).map((spk) => (
              <button
                key={spk}
                type="button"
                onClick={() => setSelectedSpeakerFilter(spk)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedSpeakerFilter.toLowerCase() === spk.toLowerCase()
                    ? 'bg-[#EEF3FF] text-[#3157D5] border border-[#C7D7FE]'
                    : 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#344054] hover:text-[#101828] border border-[#D0D5DD]'
                }`}
              >
                {spk}
              </button>
            ))}
          </div>

          {/* Sentiment & Zoom Range */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#475467] mr-1">Sentiment:</span>
              {['ALL', 'Positive', 'Negative'].map((pol) => (
                <button
                  key={pol}
                  type="button"
                  onClick={() => setSelectedSentimentFilter(pol)}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedSentimentFilter === pol
                      ? 'bg-[#3157D5] text-white shadow-saas'
                      : 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#344054] hover:text-[#101828] border border-[#D0D5DD]'
                  }`}
                >
                  {pol}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 border-l border-[#EAECF0] pl-2">
              <span className="text-xs font-bold text-[#475467]">Range:</span>
              <select
                value={zoomRange}
                onChange={(e) => setZoomRange(e.target.value)}
                className="px-2.5 py-1 rounded-md bg-white border border-[#D0D5DD] text-[#101828] text-xs font-bold focus:outline-none focus:border-[#3157D5] cursor-pointer"
              >
                <option value="ALL">Full Timeline</option>
                <option value="FIRST_HALF">First Half (Act I/II)</option>
                <option value="SECOND_HALF">Second Half (Climax)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Trajectory & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Visual Sentiment Trajectory Curve (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#101828]">
                  Sentiment Valence & Activity Progression
                </h3>
                <p className="text-xs text-[#344054] mt-0.5">
                  Continuous multi-turn emotional polarity curve with interactive segment markers.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-[#3157D5] font-bold">
                  <span className="w-2.5 h-0.5 bg-[#3157D5]" /> Sentiment
                </span>
                <span className="flex items-center gap-1 text-[#B54708] font-bold">
                  <span className="w-2.5 h-0.5 bg-[#B54708] border-t border-dashed" /> Intensity
                </span>
              </div>
            </div>

            {/* Continuous Area Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredSegments}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setSelectedSegmentId(e.activePayload[0].payload.id);
                    }
                  }}
                  margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3157D5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3157D5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="title"
                    stroke="#D0D5DD"
                    fontSize={10}
                    tickLine={false}
                    tick={{ fill: '#475467', fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[-1, 1]}
                    stroke="#D0D5DD"
                    fontSize={10}
                    tickLine={false}
                    tick={{ fill: '#475467', fontWeight: 600 }}
                    ticks={[-1, -0.5, 0, 0.5, 1]}
                  />
                  <ReferenceLine y={0} stroke="#D0D5DD" strokeDasharray="3 3" />
                  <Tooltip content={<CustomTimelineTooltip />} />

                  {/* Sentiment Curve Area */}
                  <Area
                    type="monotone"
                    dataKey="sentimentScore"
                    stroke="#3157D5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sentimentGradient)"
                    activeDot={{ r: 6, fill: '#3157D5', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />

                  {/* Normalized Intensity Line */}
                  <Line
                    type="monotone"
                    dataKey={(d) => (d.intensity / 100) * 1.5 - 0.5}
                    stroke="#B54708"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-[#475467] italic text-center font-medium">
              Click any point on the trajectory to inspect the corresponding dialogue segment.
            </p>
          </div>

          {/* Speaker Dialogue Swimlanes */}
          <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3157D5]" />
                <h3 className="font-bold text-sm text-[#101828]">
                  Speaker Turn Sequence
                </h3>
              </div>
              <span className="text-xs font-mono text-[#475467] font-bold">
                {speakerDistribution.length} Interlocutors
              </span>
            </div>

            <div className="space-y-3">
              {speakerDistribution.slice(0, 5).map((spk) => (
                <div key={spk.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#101828]">{spk.name}</span>
                    <span className="text-[#475467] font-mono text-xs font-bold">
                      {spk.count} turns ({spk.sharePercentage}%)
                    </span>
                  </div>

                  {/* Horizontal Segment Track */}
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {rangedSegments.map((seg) => {
                      const isActiveSpeaker = seg.speaker.toLowerCase() === spk.name.toLowerCase();
                      const isSelected = selectedSegmentId === seg.id;
                      return (
                        <button
                          key={seg.id}
                          onClick={() => setSelectedSegmentId(seg.id)}
                          title={`Segment ${seg.index}: ${seg.speaker} (${seg.polarity})`}
                          className={`h-4 rounded-sm flex-1 min-w-[8px] transition-all cursor-pointer ${
                            isActiveSpeaker
                              ? seg.polarity === 'Positive'
                                ? 'bg-[#067647] hover:bg-[#054f31]'
                                : seg.polarity === 'Negative'
                                ? 'bg-[#B42318] hover:bg-[#912018]'
                                : 'bg-[#3157D5] hover:bg-[#2446B8]'
                              : 'bg-[#F2F4F7] hover:bg-[#E4E7EC] opacity-60'
                          } ${isSelected ? 'ring-2 ring-[#3157D5] scale-110' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic & Entity Progression */}
          {topicOccurrences.length > 0 && (
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#3157D5]" />
                  <h3 className="font-bold text-sm text-[#101828]">
                    Topic Progression Across Dialogue
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {topicOccurrences.slice(0, 5).map((t) => (
                  <div key={t.topic} className="flex items-center gap-3 text-xs">
                    <span className="w-24 truncate font-bold text-[#101828] flex-shrink-0">
                      {t.topic}
                    </span>
                    <div className="flex gap-1 flex-1 overflow-x-auto">
                      {rangedSegments.map((seg) => {
                        const hasTopic = seg.topics.includes(t.topic);
                        return (
                          <div
                            key={seg.id}
                            className={`h-2.5 rounded-sm flex-1 min-w-[6px] ${
                              hasTopic ? 'bg-[#3157D5]' : 'bg-[#F2F4F7]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Segment Inspector & Turning Points Feed */}
        <div className="lg:col-span-4 space-y-5">
          {/* Segment Inspector Card */}
          {selectedSegment && (
            <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas sticky top-4">
              <div className="flex items-start justify-between border-b border-[#EAECF0] pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#475467] font-mono">
                    Segment #{selectedSegment.index} of {segments.length}
                  </span>
                  <h3 className="text-sm font-bold text-[#101828] mt-0.5">
                    {selectedSegment.title}
                  </h3>
                </div>

                <SentimentBadge
                  sentiment={{
                    polarity: selectedSegment.polarity.toLowerCase(),
                    score: selectedSegment.sentimentScore
                  }}
                  size="xs"
                />
              </div>

              {/* Speaker & Emotion Metric */}
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#475467] font-semibold">Speaker:</span>
                  <span className="font-bold text-[#3157D5]">{selectedSegment.speaker}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#475467] font-semibold">Dominant Emotion:</span>
                  <span className="font-bold text-[#175CD3]">{selectedSegment.dominantEmotion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#475467] font-semibold">Activity Intensity:</span>
                  <span className="font-mono font-bold text-[#B54708]">{selectedSegment.intensity}%</span>
                </div>
              </div>

              {/* Dialogue Text Excerpt */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#101828]">Dialogue Excerpt:</div>
                <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] font-mono text-xs text-[#101828] leading-relaxed max-h-32 overflow-y-auto">
                  "{selectedSegment.text}"
                </div>
              </div>

              {/* Extracted Topics in this Segment */}
              {selectedSegment.topics.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#101828]">Topics in Segment:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSegment.topics.map((top) => (
                      <span key={top} className="px-2 py-0.5 rounded-md bg-[#F9FAFB] text-[#344054] border border-[#E4E7EC] text-xs font-semibold">
                        {top}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Jump to Raw Transcript */}
              <button
                type="button"
                onClick={() => onNavigateToTranscript && onNavigateToTranscript(selectedSegment.speaker)}
                className="w-full py-2.5 px-3 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] text-white text-xs font-semibold shadow-saas transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View in Raw Transcript</span>
              </button>
            </div>
          )}

          {/* Turning Points Feed */}
          {turningPoints.length > 0 && (
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#B42318]" />
                  <h3 className="font-bold text-sm text-[#101828]">
                    Key Moments & Turning Points
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#475467] font-bold">
                  {turningPoints.length} detected
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {turningPoints.map((tp) => (
                  <button
                    key={tp.id}
                    onClick={() => setSelectedSegmentId(`seg_${tp.segmentIndex}`)}
                    className="w-full p-3 rounded-lg bg-[#F9FAFB] hover:bg-[#EEF3FF] border border-[#E4E7EC] text-left transition-colors space-y-1 block cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#B42318]">
                        Segment #{tp.segmentIndex}
                      </span>
                      <span className="text-[10px] font-mono text-[#475467] font-bold">
                        {tp.confidence} Confidence
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[#101828]">
                      {tp.summary}
                    </div>

                    <div className="text-[11px] text-[#475467] font-mono">
                      Topic: <span className="text-[#101828] font-bold">{tp.topic}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationTimeline;
