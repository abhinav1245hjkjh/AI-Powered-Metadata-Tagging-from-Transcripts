import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { CardSkeleton, ChartSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  FileText,
  Layers,
  Sparkles,
  Users,
  Compass,
  HeartHandshake,
  Tag,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  entertainment: '#C11574',
  interview: '#7C3AED',
  meeting: '#15803D',
  education: '#B54708',
  news: '#2563EB',
  technology: '#1D4ED8',
  finance: '#15803D',
  healthcare: '#15803D',
  legal: '#5925DC',
  podcast: '#C11574',
  default: '#344054'
};

const SENTIMENT_COLORS = {
  positive: '#15803D',
  neutral: '#344054',
  negative: '#B42318'
};

const Analytics = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/transcripts');
      setTranscripts(res.data.transcripts || []);
      if (isSilent) {
        toast.success('Analytics refreshed.');
      }
    } catch (err) {
      toast.error('Failed to load analytics data.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Aggregated Real Data Metrics
  const analyticsData = useMemo(() => {
    let totalSegments = 0;
    let totalEntities = 0;
    const categoryCounts = {};
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const emotionSums = {};
    const topicMap = new Map(); // key -> { name, count }
    const entityMap = new Map(); // key -> { name, label, count }
    const speakerCounts = {};
    const statusCounts = { completed: 0, processing: 0, queued: 0, failed: 0 };

    transcripts.forEach((t) => {
      // Status Tracking
      const status = t.status || 'queued';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Only completed transcripts with valid metadata contribute to NLP metrics
      if (status !== 'completed' || !t.metadata) return;
      const meta = t.metadata;

      // 1. Domain Category Breakdown
      if (meta.category?.label) {
        const cat = meta.category.label.toLowerCase().trim();
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }

      // 2. Sentiment Valence Breakdown
      if (meta.sentiment?.polarity) {
        const pol = meta.sentiment.polarity.toLowerCase().trim();
        if (sentimentCounts[pol] !== undefined) {
          sentimentCounts[pol] += 1;
        }
      }

      // 3. Emotion Distributions
      if (Array.isArray(meta.emotions)) {
        meta.emotions.forEach((emo) => {
          if (emo?.label) {
            const lbl = emo.label.toLowerCase().trim();
            emotionSums[lbl] = (emotionSums[lbl] || 0) + (emo.score || 0);
          }
        });
      }

      // 4. Top Recurring Topics (Document Frequency across transcript library)
      if (Array.isArray(meta.keywords)) {
        const seenKeywordsInDoc = new Set();
        meta.keywords.forEach((kw) => {
          const raw = typeof kw === 'string' ? kw : String(kw || '');
          const clean = raw.trim();
          if (clean.length < 2) return;
          const key = clean.toLowerCase();

          // Count once per transcript for recurring topics
          if (!seenKeywordsInDoc.has(key)) {
            seenKeywordsInDoc.add(key);
            if (!topicMap.has(key)) {
              topicMap.set(key, {
                name: clean.charAt(0).toUpperCase() + clean.slice(1),
                count: 1
              });
            } else {
              const current = topicMap.get(key);
              current.count += 1;
            }
          }
        });
      }

      // 5. Most Frequent Named Entities (Total Mentions & Categorized)
      if (Array.isArray(meta.entities)) {
        totalEntities += meta.entities.length;
        meta.entities.forEach((ent) => {
          const rawText = (typeof ent === 'string' ? ent : ent?.text || ent?.name || '').trim();
          if (rawText.length < 2) return;
          const label = (typeof ent === 'object' && ent?.label) ? ent.label.toUpperCase() : 'ENTITY';
          const key = `${rawText.toLowerCase()}_${label}`;

          if (!entityMap.has(key)) {
            entityMap.set(key, {
              name: rawText,
              label,
              count: 1
            });
          } else {
            const current = entityMap.get(key);
            current.count += 1;
          }
        });
      }

      // 6. Distinct Speakers Identification
      if (Array.isArray(meta.speakers)) {
        meta.speakers.forEach((s) => {
          const name = s.speaker?.trim();
          if (name) {
            const normalizedName = name.toUpperCase();
            speakerCounts[normalizedName] = (speakerCounts[normalizedName] || 0) + (s.lineCount || 1);
          }
        });
      }

      // 7. Segments Analyzed
      if (Array.isArray(meta.segments)) {
        totalSegments += meta.segments.length;
      }
    });

    // Format for charts
    const categoryChartData = Object.entries(categoryCounts).map(([label, count]) => ({
      name: label,
      count,
      color: CATEGORY_COLORS[label] || CATEGORY_COLORS.default
    }));

    const sentimentChartData = Object.entries(sentimentCounts)
      .filter(([_, count]) => count > 0)
      .map(([label, count]) => ({
        name: label.charAt(0).toUpperCase() + label.slice(1),
        count,
        color: SENTIMENT_COLORS[label]
      }));

    const emotionChartData = Object.entries(emotionSums)
      .map(([label, sum]) => ({
        name: label.charAt(0).toUpperCase() + label.slice(1),
        score: Number(((sum / (transcripts.length || 1)) * 100).toFixed(1))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // Top Recurring Topics sorted descending by recurrence frequency
    const topTopicsData = Array.from(topicMap.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8);

    // Most Frequent Named Entities sorted descending by mention count
    const topEntitiesData = Array.from(entityMap.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8);

    return {
      totalTranscripts: transcripts.length,
      totalSegments,
      totalEntities,
      distinctSpeakers: Object.keys(speakerCounts).length,
      categoryChartData,
      sentimentChartData,
      emotionChartData,
      topTopicsData,
      topEntitiesData,
      statusCounts
    };
  }, [transcripts]);

  return (
    <AppShell>
      <PageHeader
        title="Metadata Intelligence Analytics"
        subtitle="Explore aggregated NLP insights, domain distributions, and sentiment trends across your transcript library."
        actions={
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#111827] border border-[#D0D5DD] text-xs sm:text-sm font-semibold transition-colors shadow-saas cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#475467]" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={FileText}
              label="Total Transcripts"
              value={analyticsData.totalTranscripts}
              description="Indexed in workspace"
            />
            <StatCard
              icon={Layers}
              label="Segments Analyzed"
              value={analyticsData.totalSegments}
              description="Extracted scene & dialogue blocks"
            />
            <StatCard
              icon={Sparkles}
              label="Named Entities"
              value={analyticsData.totalEntities}
              description="Total tagged mentions"
            />
            <StatCard
              icon={Users}
              label="Speakers Identified"
              value={analyticsData.distinctSpeakers}
              description="Distinct interlocutors"
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartSkeleton height="h-72" />
          <ChartSkeleton height="h-72" />
        </div>
      ) : transcripts.length === 0 ? (
        <div className="saas-card p-8 bg-white border border-[#E4E7EC] shadow-saas">
          <EmptyState
            title="No Analytics Data Available"
            description="Upload transcripts to begin populating metadata distributions and multi-model insights."
            actionLink="/upload"
            actionText="Upload First Transcript"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Domain Classification & Sentiment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Category Distribution */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="font-bold text-sm text-[#111827]">
                    Domain Category Breakdown
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#475467] font-semibold">
                  {analyticsData.categoryChartData.length} active domains
                </span>
              </div>

              {analyticsData.categoryChartData.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#475467] italic">
                  Category analysis pending for current transcripts.
                </div>
              ) : (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.categoryChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 25, left: 60, bottom: 5 }}
                    >
                      <XAxis type="number" stroke="#D0D5DD" fontSize={10} allowDecimals={false} tick={{ fill: '#475467' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#D0D5DD"
                        fontSize={11}
                        tick={{ fill: '#111827', textTransform: 'capitalize', fontWeight: 600 }}
                        width={75}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E7EC',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                        {analyticsData.categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Sentiment Breakdown */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="font-bold text-sm text-[#111827]">
                    Sentiment Valence Distribution
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#475467] font-semibold">
                  Polarity
                </span>
              </div>

              {analyticsData.sentimentChartData.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#475467] italic">
                  Sentiment data pending.
                </div>
              ) : (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.sentimentChartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="#D0D5DD" fontSize={11} tick={{ fill: '#111827', fontWeight: 600 }} />
                      <YAxis stroke="#D0D5DD" fontSize={10} allowDecimals={false} tick={{ fill: '#475467' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E7EC',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                        {analyticsData.sentimentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Top Topics & Frequent Entities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Topics */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="font-bold text-sm text-[#111827]">
                    Top Recurring Topics
                  </h3>
                </div>
                {analyticsData.topTopicsData.length > 0 && (
                  <span className="text-xs font-mono text-[#475467] font-semibold">
                    {analyticsData.topTopicsData.length} topics
                  </span>
                )}
              </div>

              {analyticsData.topTopicsData.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#475467] italic">
                  No topic keywords detected yet.
                </div>
              ) : (
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.topTopicsData}
                      layout="vertical"
                      margin={{ top: 5, right: 25, left: 95, bottom: 5 }}
                    >
                      <XAxis type="number" stroke="#D0D5DD" fontSize={10} allowDecimals={false} tick={{ fill: '#475467' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#D0D5DD"
                        fontSize={11}
                        tick={{ fill: '#111827', textTransform: 'capitalize', fontWeight: 600 }}
                        width={95}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E7EC',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                        }}
                        formatter={(value) => [`${value} ${value === 1 ? 'transcript' : 'transcripts'}`, 'Recurrence']}
                      />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Entities */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#15803D]" />
                  <h3 className="font-bold text-sm text-[#111827]">
                    Most Frequent Named Entities
                  </h3>
                </div>
                {analyticsData.topEntitiesData.length > 0 && (
                  <span className="text-xs font-mono text-[#475467] font-semibold">
                    {analyticsData.topEntitiesData.length} entities
                  </span>
                )}
              </div>

              {analyticsData.topEntitiesData.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#475467] italic">
                  No entity occurrences recorded yet.
                </div>
              ) : (
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.topEntitiesData}
                      layout="vertical"
                      margin={{ top: 5, right: 25, left: 95, bottom: 5 }}
                    >
                      <XAxis type="number" stroke="#D0D5DD" fontSize={10} allowDecimals={false} tick={{ fill: '#475467' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#D0D5DD"
                        fontSize={11}
                        tick={{ fill: '#111827', fontWeight: 600 }}
                        width={95}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E7EC',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                        }}
                        formatter={(value, _, item) => [
                          `${value} ${value === 1 ? 'mention' : 'mentions'} (${item.payload.label || 'Entity'})`,
                          'Occurrences'
                        ]}
                      />
                      <Bar dataKey="count" fill="#15803D" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Analytics;
