import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import SentimentBadge from '../components/SentimentBadge';
import CategoryBadge from '../components/CategoryBadge';
import { DetailHeaderSkeleton, CardSkeleton } from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EntityList from '../components/EntityList';
import TopicList from '../components/TopicList';
import SpeakerList from '../components/SpeakerList';
import SpeakerIntelligence from '../components/SpeakerIntelligence';
import TranscriptViewer from '../components/TranscriptViewer';
import SceneTimeline from '../components/SceneTimeline';
import SentimentChart from '../components/SentimentChart';
import EmotionChart from '../components/EmotionChart';
import NarrativeGraph from '../components/NarrativeGraph';
import ConversationTimeline from '../components/ConversationTimeline';
import { ProcessingStepper } from '../components/ProcessingStatus';
import { buildIntelligenceGraph } from '../utils/graphBuilder';
import { buildConversationTimeline } from '../utils/timelineBuilder';
import { exportToJson, exportToCsv } from '../utils/exportUtils';
import {
  ArrowLeft,
  FileJson,
  FileSpreadsheet,
  Trash2,
  Tag,
  Users,
  Film,
  HeartHandshake,
  Compass,
  FileText,
  Layers,
  LayoutList,
  Network,
  Activity,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

const TranscriptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [transcriptViewerSearch, setTranscriptViewerSearch] = useState('');

  const fetchTranscript = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get(`/transcripts/${id}`);
      setTranscript(res.data.transcript);
    } catch (err) {
      if (!isSilent) {
        toast.error('Failed to load transcript details.');
        navigate('/transcripts');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscript();
  }, [id]);

  // Auto-poll if transcript is currently queued or processing
  useEffect(() => {
    let interval = null;
    if (transcript && (transcript.status === 'queued' || transcript.status === 'processing')) {
      interval = setInterval(() => {
        fetchTranscript(true);
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [transcript]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${transcript.title}"?`)) return;

    try {
      await api.delete(`/transcripts/${id}`);
      toast.success('Transcript deleted.');
      navigate('/transcripts');
    } catch (err) {
      toast.error('Failed to delete transcript.');
    }
  };

  const handleRetry = async () => {
    try {
      await api.post(`/transcripts/${id}/retry`);
      toast.success('Transcript analysis re-queued.');
      fetchTranscript();
    } catch (err) {
      toast.error('Failed to retry transcript processing.');
    }
  };

  // Build Narrative Intelligence Graph from Real Analysis Data
  const graphData = useMemo(() => {
    return buildIntelligenceGraph(transcript);
  }, [transcript]);

  // Build Conversation Dynamics Timeline from Real Analysis Data
  const timelineData = useMemo(() => {
    return buildConversationTimeline(transcript);
  }, [transcript]);

  const handleNavigateToTranscript = (searchTerm) => {
    setTranscriptViewerSearch(searchTerm || '');
    setActiveTab('raw');
  };

  if (loading) {
    return (
      <AppShell>
        <DetailHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </AppShell>
    );
  }

  if (!transcript) {
    return (
      <AppShell>
        <ErrorState
          title="Transcript Not Found"
          message="The requested transcript could not be found or has been removed."
          onRetry={() => navigate('/transcripts')}
          retryLabel="Back to Transcripts"
        />
      </AppShell>
    );
  }

  const meta = transcript.metadata || {};
  const isCompleted = transcript.status === 'completed';

  const raw = typeof transcript.rawText === 'string' ? transcript.rawText.trim() : '';
  const wordCount = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
  const lineCount = raw.split(/\r\n|\r|\n/).length;

  const entityCount = meta.entities ? meta.entities.length : 0;
  const speakerCount = meta.speakers ? meta.speakers.length : 0;
  const segmentCount = meta.segments ? meta.segments.length : 0;
  const graphNodeCount = graphData.nodes?.length || 0;
  const timelineSegmentsCount = timelineData.segments?.length || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutList },
    { id: 'dynamics', label: `Dynamics (${timelineSegmentsCount})`, icon: Activity },
    { id: 'graph', label: `Intelligence Graph (${graphNodeCount})`, icon: Network },
    { id: 'entities', label: `Entities (${entityCount})`, icon: Layers },
    { id: 'topics', label: `Topics (${meta.keywords?.length || 0})`, icon: Tag },
    { id: 'sentiment', label: 'Sentiment & Emotion', icon: HeartHandshake },
    { id: 'speakers', label: `Speakers (${speakerCount})`, icon: Users },
    { id: 'segments', label: `Segments (${segmentCount})`, icon: Film },
    { id: 'raw', label: 'Raw Transcript', icon: FileText }
  ];

  return (
    <AppShell>
      {/* Navigation and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/transcripts"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#475467] hover:text-[#101828] transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transcripts</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Analyze / Re-analyze CTA */}
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] text-white text-xs sm:text-sm font-semibold shadow-saas transition-all cursor-pointer"
            title="Re-run Multi-Model NLP Pipeline"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isCompleted ? 'Re-Analyze Transcript' : 'Analyze Transcript'}</span>
          </button>

          {isCompleted && (
            <>
              <button
                onClick={() => exportToJson(transcript)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#101828] border border-[#D0D5DD] text-xs sm:text-sm font-semibold transition-all shadow-saas cursor-pointer"
                title="Export complete metadata in JSON format"
              >
                <FileJson className="w-4 h-4 text-[#3157D5]" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => exportToCsv(transcript)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#101828] border border-[#D0D5DD] text-xs sm:text-sm font-semibold transition-all shadow-saas cursor-pointer"
                title="Export structured metadata in CSV format"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#067647]" />
                <span>Export CSV</span>
              </button>
            </>
          )}

          <button
            onClick={handleDelete}
            className="p-2 rounded-lg text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] transition-colors cursor-pointer"
            title="Delete transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Overview Banner */}
      <div className="saas-card p-6 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={transcript.status} size="xs" />
              {meta.category && (
                <CategoryBadge category={meta.category} size="xs" />
              )}
              {meta.sentiment && (
                <SentimentBadge sentiment={meta.sentiment} size="xs" />
              )}
              <span className="text-xs font-mono text-[#344054] px-2 py-0.5 rounded-md bg-[#F2F4F7] border border-[#EAECF0] font-medium">
                {transcript.fileName || 'Pasted Script'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#101828] tracking-tight">
              {transcript.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#475467] font-mono">
              <span>
                Uploaded{' '}
                {new Date(transcript.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Quick Metric Pills */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-[#475467]">Words</div>
              <div className="text-sm font-bold text-[#111827] font-mono tabular-nums">{wordCount.toLocaleString()}</div>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-[#475467]">Lines</div>
              <div className="text-sm font-bold text-[#111827] font-mono tabular-nums">{lineCount.toLocaleString()}</div>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-[#475467]">Entities</div>
              <div className="text-sm font-bold text-[#15803D] font-mono tabular-nums">{entityCount}</div>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-[#475467]">Speakers</div>
              <div className="text-sm font-bold text-[#7C3AED] font-mono tabular-nums">{speakerCount}</div>
            </div>
          </div>
        </div>

        {/* Processing Stepper if in progress or failed */}
        {!isCompleted && (
          <div className="pt-2">
            <ProcessingStepper status={transcript.status} />
          </div>
        )}
      </div>

      {/* Tab Navigation Workspace */}
      <div className="flex border-b border-[#E4E7EC] overflow-x-auto bg-white rounded-xl px-2 shadow-saas">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'border-[#3157D5] text-[#3157D5]'
                  : 'border-transparent text-[#475467] hover:text-[#101828]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: Keyphrases & Named Entities Grouped */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Key Topics & Keyphrases */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#3157D5]" />
                  <h3 className="font-bold text-sm text-[#101828]">
                    Topic & Keyphrase Intelligence
                  </h3>
                </div>
                <span className="text-xs text-[#475467] font-mono font-medium">
                  {meta.keywords?.length || 0} terms
                </span>
              </div>

              <TopicList keywords={meta.keywords} />
            </div>

            {/* Named Entities Summary (Grouped) */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#3157D5]" />
                  <h3 className="font-bold text-sm text-[#101828]">
                    Named Entities
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('entities')}
                  className="text-xs text-[#3157D5] hover:text-[#2446B8] font-bold cursor-pointer"
                >
                  View All ({entityCount})
                </button>
              </div>

              <EntityList entities={meta.entities || []} grouped={true} />
            </div>
          </div>

          {/* Row 2: Sentiment Valence & Emotion Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sentiment Valence */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#3157D5]" />
                  <h3 className="font-bold text-sm text-[#101828]">
                    Sentiment Valence
                  </h3>
                </div>
                <SentimentBadge sentiment={meta.sentiment} size="xs" />
              </div>

              <SentimentChart sentiment={meta.sentiment} />
            </div>

            {/* Emotion Spectrum */}
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3157D5]" />
                  <h3 className="font-bold text-sm text-[#101828]">
                    Emotional Tone Distribution
                  </h3>
                </div>
              </div>

              <EmotionChart emotions={meta.emotions || []} />
            </div>
          </div>

          {/* Row 3: Speakers Identified */}
          <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3157D5]" />
                <h3 className="font-bold text-sm text-[#101828]">
                  Speakers Identified
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('speakers')}
                className="text-xs text-[#3157D5] hover:text-[#2446B8] font-bold cursor-pointer"
              >
                Deep-Dive Analytics ({speakerCount})
              </button>
            </div>

            <SpeakerList speakers={meta.speakers || []} status={transcript.status} />
          </div>

          {/* Row 4: Segments & Scene Timeline */}
          <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#3157D5]" />
                <h3 className="font-bold text-sm text-[#101828]">
                  Segments & Scene Timeline
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('segments')}
                className="text-xs text-[#3157D5] hover:text-[#2446B8] font-bold cursor-pointer"
              >
                View All Segments ({segmentCount})
              </button>
            </div>

            <SceneTimeline segments={meta.segments || []} />
          </div>

          {/* Row 5: Domain Classification */}
          <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#3157D5]" />
                <h3 className="font-bold text-sm text-[#101828]">
                  Domain Classification
                </h3>
              </div>
              {meta.category && (
                <span className="text-xs text-[#3157D5] font-mono font-bold">
                  {Math.round((meta.category.confidence || 0) * 100)}% Confidence
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC]">
              <div>
                <div className="text-xs text-[#475467] font-semibold">Classified Domain</div>
                <div className="text-base font-bold text-[#101828] capitalize mt-0.5">
                  {meta.category?.label || 'Processing...'}
                </div>
              </div>
              <CategoryBadge category={meta.category} size="md" />
            </div>
          </div>
        </div>
      )}

      {/* CONVERSATION DYNAMICS TIMELINE TAB */}
      {activeTab === 'dynamics' && (
        <ConversationTimeline
          timelineData={timelineData}
          onNavigateToTranscript={handleNavigateToTranscript}
          title={transcript.title}
        />
      )}

      {/* INTELLIGENCE GRAPH TAB */}
      {activeTab === 'graph' && (
        <NarrativeGraph
          graphData={graphData}
          onNavigateToTranscript={handleNavigateToTranscript}
          title={transcript.title}
        />
      )}

      {activeTab === 'entities' && (
        <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
          <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#101828]">
                Named Entity Extraction
              </h3>
              <p className="text-xs text-[#344054] mt-0.5">
                Categorized persons, organizations, locations, products, dates, and domain entities.
              </p>
            </div>
            <span className="text-xs font-mono text-[#475467] font-bold">
              {entityCount} total entities
            </span>
          </div>

          <EntityList entities={meta.entities || []} grouped={true} />
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
          <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#101828]">
                Topic & Keyphrase Intelligence
              </h3>
              <p className="text-xs text-[#344054] mt-0.5">
                High-relevance multi-word keyphrases and core concepts identified across the transcript.
              </p>
            </div>
            <span className="text-xs font-mono text-[#475467] font-bold">
              {meta.keywords?.length || 0} terms
            </span>
          </div>

          <TopicList keywords={meta.keywords || []} />
        </div>
      )}

      {activeTab === 'sentiment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sentiment Gauge */}
          <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="border-b border-[#EAECF0] pb-3">
              <h3 className="font-bold text-sm text-[#101828]">
                Utterance Sentiment Valence
              </h3>
              <p className="text-xs text-[#344054] mt-0.5">
                Document-calibrated polarity scoring with lexical intensity tracking.
              </p>
            </div>
            <SentimentChart sentiment={meta.sentiment} />
          </div>

          {/* Emotion Spectrum */}
          <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="border-b border-[#EAECF0] pb-3">
              <h3 className="font-bold text-sm text-[#101828]">
                Emotional Tone Distribution
              </h3>
              <p className="text-xs text-[#344054] mt-0.5">
                Multi-dimensional emotional intensity across affective states.
              </p>
            </div>
            <EmotionChart emotions={meta.emotions || []} />
          </div>
        </div>
      )}

      {activeTab === 'speakers' && (
        <SpeakerIntelligence
          transcript={transcript}
          onNavigateToTranscript={handleNavigateToTranscript}
        />
      )}

      {activeTab === 'segments' && (
        <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
          <div className="border-b border-[#EAECF0] pb-3">
            <h3 className="font-bold text-sm text-[#101828]">
              Scene & Dialogue Segmentation Timeline
            </h3>
            <p className="text-xs text-[#344054] mt-0.5">
              Structured scene boundary detection (INT./EXT., timestamps, or dialogue blocks).
            </p>
          </div>

          <SceneTimeline segments={meta.segments || []} />
        </div>
      )}

      {activeTab === 'raw' && (
        <TranscriptViewer
          rawText={transcript.rawText}
          title={transcript.title}
          initialSearchQuery={transcriptViewerSearch}
        />
      )}
    </AppShell>
  );
};

export default TranscriptDetail;
