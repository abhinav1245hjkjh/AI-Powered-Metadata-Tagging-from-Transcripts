import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
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
  Smile,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const DOMAIN_COLOR_PALETTE = ['#2563EB', '#1D4ED8', '#0284C7', '#0D9488', '#14B8A6', '#64748B'];

const CustomTooltip = ({ active, payload, label, unit = 'count' }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-[#DCE5F2] shadow-xl rounded-xl p-3 text-xs space-y-1">
        <p className="font-extrabold text-[#0F172A] capitalize">{data.payload?.fullName || label || data.name}</p>
        <div className="flex items-center gap-2 text-[#64748B]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color || '#2563EB' }} />
          <span className="font-semibold">{unit}:</span>
          <span className="font-extrabold font-mono text-[#0F172A]">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/transcripts');
      setTranscripts(res.data?.data?.transcripts || res.data?.transcripts || []);
      if (isSilent) {
        toast.success('Analytics refreshed.');
      }
    } catch (err) {
      console.error('Analytics load error:', err);
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
    let totalSentimentCount = 0;
    const emotionSums = {};
    const speakerMap = new Map(); // name -> lineCount

    transcripts.forEach((t) => {
      // Only completed transcripts with valid metadata contribute to NLP metrics
      if (t.status !== 'completed' || !t.metadata) return;
      const meta = t.metadata;

      // 1. Domain Category
      const catLabel = typeof meta.category === 'object' ? meta.category?.label : meta.category;
      if (catLabel) {
        const cat = String(catLabel).toLowerCase().trim();
        if (cat) {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }

      // 2. Sentiment Valence
      const polLabel = typeof meta.sentiment === 'object' ? meta.sentiment?.polarity : meta.sentiment;
      if (polLabel) {
        const pol = String(polLabel).toLowerCase().trim();
        if (sentimentCounts[pol] !== undefined) {
          sentimentCounts[pol] += 1;
          totalSentimentCount += 1;
        }
      }

      // 3. Emotion Distributions
      if (Array.isArray(meta.emotions)) {
        meta.emotions.forEach((emo) => {
          const lbl = typeof emo === 'object' ? emo?.label : emo;
          const score = typeof emo === 'object' ? (emo?.score || 1) : 1;
          if (lbl) {
            const cleanLbl = String(lbl).toLowerCase().trim();
            emotionSums[cleanLbl] = (emotionSums[cleanLbl] || 0) + score;
          }
        });
      }

      // 4. Named Entities Total Count (for KPI Card)
      if (Array.isArray(meta.entities)) {
        totalEntities += meta.entities.length;
      }

      // 5. Speaker Activity
      if (Array.isArray(meta.speakers)) {
        meta.speakers.forEach((s) => {
          const name = typeof s === 'object' ? (s.speaker || s.name || '') : String(s);
          const cleanName = String(name).trim();
          if (cleanName) {
            const lineCount = (typeof s === 'object' && s.lineCount) ? s.lineCount : 1;
            speakerMap.set(cleanName, (speakerMap.get(cleanName) || 0) + lineCount);
          }
        });
      }

      // 6. Segments Count
      if (Array.isArray(meta.segments)) {
        totalSegments += meta.segments.length;
      }
    });

    // Compute Dominant Sentiment
    let dominantSentiment = 'N/A';
    let maxSentCount = 0;
    Object.entries(sentimentCounts).forEach(([pol, count]) => {
      if (count > maxSentCount) {
        maxSentCount = count;
        dominantSentiment = pol.charAt(0).toUpperCase() + pol.slice(1);
      }
    });

    // Format Domain Categories sorted descending
    const categoryChartData = Object.entries(categoryCounts)
      .map(([label, count]) => ({
        name: label.charAt(0).toUpperCase() + label.slice(1),
        fullName: label.charAt(0).toUpperCase() + label.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .map((item, idx) => ({
        ...item,
        color: DOMAIN_COLOR_PALETTE[idx % DOMAIN_COLOR_PALETTE.length]
      }));

    // Format Sentiment breakdown
    const sentimentList = [
      { name: 'Positive', key: 'positive', count: sentimentCounts.positive, color: '#16A34A', bg: 'bg-[#DCFCE7]', border: 'border-[#86EFAC]', text: 'text-[#15803D]' },
      { name: 'Neutral', key: 'neutral', count: sentimentCounts.neutral, color: '#64748B', bg: 'bg-[#F1F5F9]', border: 'border-[#CBD5E1]', text: 'text-[#475467]' },
      { name: 'Negative', key: 'negative', count: sentimentCounts.negative, color: '#DC2626', bg: 'bg-[#FEF2F2]', border: 'border-[#FCA5A5]', text: 'text-[#B42318]' }
    ].map((s) => ({
      ...s,
      percentage: totalSentimentCount > 0 ? Math.round((s.count / totalSentimentCount) * 100) : 0
    }));

    // Format Emotions sorted descending
    const maxEmotionSum = Math.max(...Object.values(emotionSums), 1);
    const emotionChartData = Object.entries(emotionSums)
      .map(([label, sum]) => ({
        name: label.charAt(0).toUpperCase() + label.slice(1),
        score: Math.round(sum),
        percentage: Math.round((sum / maxEmotionSum) * 100)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // Format Top Speakers Activity
    const totalSpeakerLines = Array.from(speakerMap.values()).reduce((sum, v) => sum + v, 0);
    const topSpeakersData = Array.from(speakerMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSpeakerLines > 0 ? Math.round((count / totalSpeakerLines) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const completedTranscripts = transcripts.filter((t) => t.status === 'completed');

    return {
      totalTranscripts: transcripts.length,
      analyzedTranscriptsCount: completedTranscripts.length,
      totalSegments,
      totalEntities,
      distinctSpeakers: speakerMap.size,
      dominantSentiment,
      activeDomainsCount: Object.keys(categoryCounts).length,
      categoryChartData,
      sentimentList,
      totalSentimentCount,
      emotionChartData,
      topSpeakersData
    };
  }, [transcripts]);

  const hasSecondaryInsights = analyticsData.emotionChartData.length > 0 || analyticsData.topSpeakersData.length > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 1. Analytics Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE5F2] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Analytics</h1>
              <span className="px-3 py-1 rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold text-xs border border-[#BFDBFE] inline-flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{analyticsData.analyzedTranscriptsCount} Analyzed Transcripts</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl">
              Understand patterns, sentiment, entities, and content categories across your transcript library.
            </p>
          </div>
        </div>

        {/* 2. KPI Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={FileText}
                label="Transcripts"
                value={analyticsData.totalTranscripts}
                description="Total in library"
              />
              <StatCard
                icon={Layers}
                label="Scenes / Segments"
                value={analyticsData.totalSegments}
                description="Dialogue blocks"
              />
              <StatCard
                icon={Sparkles}
                label="Named Entities"
                value={analyticsData.totalEntities}
                description="Tagged mentions"
              />
              <StatCard
                icon={Users}
                label="Speakers"
                value={analyticsData.distinctSpeakers}
                description="Distinct voices"
              />
              <StatCard
                icon={HeartHandshake}
                label="Dominant Tone"
                value={analyticsData.dominantSentiment}
                description="Overall sentiment"
              />
              <StatCard
                icon={Compass}
                label="Domains"
                value={analyticsData.activeDomainsCount}
                description="Content categories"
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
          <div className="saas-card p-8 bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
            <EmptyState
              title="No Analytics Data Available"
              description="Analyze transcripts to generate domain breakdowns, sentiment distribution, and conversational metrics."
              actionLink="/upload"
              actionText="Upload First Transcript"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Domain Category Breakdown & Sentiment Valence Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Domain Category Breakdown */}
              <div className="saas-card p-5 space-y-4 bg-white border border-[#DCE5F2] shadow-saas rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0F172A]">Domain Category Breakdown</h3>
                      <p className="text-[11px] text-[#64748B]">Distribution of analyzed transcripts by content domain</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE]">
                    {analyticsData.categoryChartData.length} Domains
                  </span>
                </div>

                {analyticsData.categoryChartData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#64748B] italic">
                    No domain category data available yet.
                  </div>
                ) : (
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.categoryChartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 75, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#CBD5E1" fontSize={10} allowDecimals={false} tick={{ fill: '#64748B' }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#CBD5E1"
                          fontSize={11}
                          tick={{ fill: '#0F172A', fontWeight: 600 }}
                          width={70}
                        />
                        <Tooltip content={<CustomTooltip unit="Transcripts" />} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                          {analyticsData.categoryChartData.map((entry, index) => (
                            <Cell key={`cell-cat-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Sentiment Valence Distribution */}
              <div className="saas-card p-5 space-y-4 bg-white border border-[#DCE5F2] shadow-saas rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0F172A]">Sentiment Valence Distribution</h3>
                      <p className="text-[11px] text-[#64748B]">Overall conversational tone and emotional polarity</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A] bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                    Dominant: <span className="text-[#2563EB]">{analyticsData.dominantSentiment}</span>
                  </span>
                </div>

                {analyticsData.totalSentimentCount === 0 ? (
                  <div className="py-12 text-center text-xs text-[#64748B] italic">
                    No sentiment polarity data available yet.
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    {analyticsData.sentimentList.map((sent) => (
                      <div key={sent.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${sent.bg} ${sent.border} border`} style={{ backgroundColor: sent.color }} />
                            <span className="text-[#0F172A]">{sent.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#64748B]">{sent.count} transcripts</span>
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold ${sent.bg} ${sent.text} border ${sent.border}`}>
                              {sent.percentage}%
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden border border-[#E2E8F0]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${sent.percentage}%`,
                              backgroundColor: sent.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Emotion Distribution & Speaker Insights (Only when real data exists) */}
            {hasSecondaryInsights && (
              <div className={`grid grid-cols-1 ${analyticsData.emotionChartData.length > 0 && analyticsData.topSpeakersData.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-5`}>
                {/* Emotion Distribution */}
                {analyticsData.emotionChartData.length > 0 && (
                  <div className="saas-card p-5 space-y-4 bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                          <Smile className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#0F172A]">Emotion Distribution</h3>
                          <p className="text-[11px] text-[#64748B]">Aggregated emotional tone signatures across transcripts</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {analyticsData.emotionChartData.map((emo) => (
                        <div key={emo.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#0F172A]">{emo.name}</span>
                            <span className="font-mono text-[#2563EB]">{emo.score} pts</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden border border-[#E2E8F0]">
                            <div
                              className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                              style={{ width: `${emo.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speaker Activity */}
                {analyticsData.topSpeakersData.length > 0 && (
                  <div className="saas-card p-5 space-y-4 bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#0F172A]">Speaker Activity</h3>
                          <p className="text-[11px] text-[#64748B]">Utterance frequency and dialogue participation by speaker</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {analyticsData.topSpeakersData.map((spk, idx) => (
                        <div key={spk.name} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </div>
                            <span className="font-bold text-xs text-[#0F172A] truncate">
                              {spk.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-20 sm:w-28 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                              <div
                                className="h-full bg-[#2563EB] rounded-full"
                                style={{ width: `${spk.percentage}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-extrabold text-[#0F172A] min-w-[50px] text-right">
                              {spk.count} lines ({spk.percentage}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Analytics;
