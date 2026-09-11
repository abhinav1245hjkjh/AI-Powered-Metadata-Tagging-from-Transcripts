import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import SentimentBadge from '../components/SentimentBadge';
import CategoryBadge from '../components/CategoryBadge';
import { DetailHeaderSkeleton, CardSkeleton } from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EntityList from '../components/EntityList';
import TopicList from '../components/TopicList';
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
  Play,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
  Clock,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const TranscriptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  const [transcriptViewerSearch, setTranscriptViewerSearch] = useState('');
  const dropdownRef = useRef(null);

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

  // Close dropdown menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMoreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/transcripts/${id}`);
      toast.success('Transcript deleted successfully.');
      navigate('/transcripts');
    } catch (err) {
      console.error('Delete transcript error:', err);
      toast.error(err.response?.data?.message || 'Unable to delete transcript. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await api.post(`/transcripts/${id}/retry`);
      toast.success('Transcript analysis re-queued.');
      fetchTranscript();
    } catch (err) {
      toast.error('Failed to retry transcript processing.');
    } finally {
      setIsRetrying(false);
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
  const isRateLimited = transcript.status === 'temporarily_rate_limited';
  const isPending = transcript.status === 'queued' || transcript.status === 'processing';

  const raw = typeof transcript.rawText === 'string' ? transcript.rawText.trim() : '';
  const wordCount = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
  const lineCount = raw.split(/\r\n|\r|\n/).length;

  const entityCount = meta.entities ? meta.entities.length : 0;
  const speakerCount = meta.speakers ? meta.speakers.length : 0;
  const segmentCount = meta.segments ? meta.segments.length : 0;
  const graphNodeCount = graphData.nodes?.length || 0;
  const timelineSegmentsCount = timelineData.segments?.length || 0;

  // Primary Tabs visible on the tab bar
  const primaryTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutList, requiresAnalysis: false },
    { id: 'dynamics', label: `Dynamics${isCompleted ? ` (${timelineSegmentsCount})` : ''}`, icon: Activity, requiresAnalysis: true },
    { id: 'topics', label: `Topics${isCompleted ? ` (${meta.keywords?.length || 0})` : ''}`, icon: Tag, requiresAnalysis: true },
    { id: 'sentiment', label: 'Sentiment & Tone', icon: HeartHandshake, requiresAnalysis: true },
    { id: 'speakers', label: `Speakers${isCompleted ? ` (${speakerCount})` : ''}`, icon: Users, requiresAnalysis: true },
    { id: 'raw', label: 'Raw Transcript', icon: FileText, requiresAnalysis: false }
  ];

  // Secondary Tabs collapsed into the "More" dropdown
  const moreTabs = [
    { id: 'graph', label: `Intelligence Graph${isCompleted ? ` (${graphNodeCount})` : ''}`, icon: Network, requiresAnalysis: true },
    { id: 'entities', label: `Entities${isCompleted ? ` (${entityCount})` : ''}`, icon: Layers, requiresAnalysis: true },
    { id: 'segments', label: `Segments${isCompleted ? ` (${segmentCount})` : ''}`, icon: Film, requiresAnalysis: true }
  ];

  const activeMoreTab = moreTabs.find((t) => t.id === activeTab);

  // Helper to render polished empty states for analysis-dependent sections when incomplete
  const renderTabContent = (tabId, contentComponent) => {
    const isAnalysisTab = tabId !== 'overview' && tabId !== 'raw';
    if (isAnalysisTab && !isCompleted) {
      return (
        <div className="saas-card p-8 text-center space-y-4 bg-white border border-[#E4E7EC] rounded-xl shadow-saas max-w-xl mx-auto my-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] flex items-center justify-center shadow-saas">
            {isRateLimited ? (
              <Clock className="w-6 h-6 text-[#D97706] animate-pulse" />
            ) : (
              <Sparkles className="w-6 h-6 text-[#3157D5]" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#101828]">
              {isRateLimited ? 'AI Analysis Temporarily Busy' : 'Awaiting AI Analysis'}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
              {isRateLimited
                ? 'The AI provider is currently rate limiting requests. Your transcript is safe. Please retry analysis in a moment.'
                : 'Analysis results and extracted metadata will appear here once transcript processing is complete.'}
            </p>
          </div>
          {isRateLimited && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold shadow-saas transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Re-Queueing...' : 'Retry Analysis'}</span>
              </button>
            </div>
          )}
        </div>
      );
    }
    return contentComponent;
  };

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
          {/* State-Aware Primary Action Button */}
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying || isPending}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-saas transition-all cursor-pointer ${
              isRateLimited
                ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
                : isCompleted
                ? 'bg-[#3157D5] hover:bg-[#2446B8] text-white'
                : 'bg-[#3157D5] hover:bg-[#2446B8] disabled:bg-[#94A3B8] disabled:cursor-not-allowed text-white'
            }`}
            title={
              isRateLimited
                ? 'Retry AI Analysis'
                : isCompleted
                ? 'Re-run Multi-Model NLP Pipeline'
                : 'AI Analysis In Progress'
            }
          >
            {isRateLimited ? (
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            ) : isRetrying || isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>
              {isRetrying
                ? 'Re-Queueing...'
                : transcript.status === 'queued'
                ? 'Queued for Analysis'
                : transcript.status === 'processing'
                ? 'Analyzing...'
                : isRateLimited
                ? 'Retry Analysis'
                : 'Re-Analyze Transcript'}
            </span>
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
            onClick={handleDeleteClick}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
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
              {/* Single Status Badge beside transcript title area */}
              <StatusBadge status={transcript.status} size="xs" />
              {isCompleted && meta.category && (
                <CategoryBadge category={meta.category} size="xs" />
              )}
              {isCompleted && meta.sentiment && (
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
              <div className="text-sm font-bold text-[#15803D] font-mono tabular-nums">
                {isCompleted ? entityCount : 'N/A'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-[#475467]">Speakers</div>
              <div className="text-sm font-bold text-[#7C3AED] font-mono tabular-nums">
                {isCompleted ? speakerCount : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Processing Stepper Card if in progress, rate limited, or failed */}
        {!isCompleted && (
          <div className="pt-2">
            <ProcessingStepper
              status={transcript.status}
              error={transcript.error}
              onRetry={handleRetry}
              isRetrying={isRetrying}
            />
          </div>
        )}
      </div>

      {/* Tab Navigation Workspace with Primary Tabs + "More" Dropdown */}
      <div className="sticky top-16 z-30 flex items-center justify-between border-b border-[#E4E7EC] bg-white rounded-xl px-2 shadow-saas no-scrollbar space-x-1 overflow-x-auto flex-nowrap">
        <div className="flex items-center space-x-1 flex-nowrap overflow-x-auto no-scrollbar w-full">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSubdued = tab.requiresAnalysis && !isCompleted;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-2 flex-shrink-0 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#3157D5] text-[#3157D5] bg-[#EEF3FF]/60 rounded-t-lg'
                    : isSubdued
                    ? 'border-transparent text-[#94A3B8] hover:text-[#475467] hover:bg-[#F8FAFC] rounded-t-lg'
                    : 'border-transparent text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFB] rounded-t-lg'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#3157D5]' : isSubdued ? 'text-[#94A3B8]' : 'text-[#64748B]'}`} />
                <span>{tab.label}</span>
                {isSubdued && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#94A3B8]">
                    Awaiting
                  </span>
                )}
              </button>
            );
          })}

          {/* More Dropdown Menu */}
          <div className="relative flex-shrink-0 ml-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              className={`px-3.5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap rounded-t-lg ${
                activeMoreTab
                  ? 'border-[#3157D5] text-[#3157D5] bg-[#EEF3FF]/60 font-bold'
                  : 'border-transparent text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFB]'
              }`}
            >
              {activeMoreTab ? (
                <>
                  <activeMoreTab.icon className="w-4 h-4 text-[#3157D5]" />
                  <span>{activeMoreTab.label}</span>
                </>
              ) : (
                <>
                  <MoreHorizontal className="w-4 h-4 text-[#64748B]" />
                  <span>More</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMoreDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showMoreDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-[#E4E7EC] py-1.5 z-50 animate-fadeIn transition-all duration-150">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] border-b border-[#F1F5F9] mb-1">
                  Additional Insights
                </div>
                {moreTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isSubdued = tab.requiresAnalysis && !isCompleted;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowMoreDropdown(false);
                      }}
                      className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#EEF3FF] text-[#3157D5] font-bold'
                          : 'text-[#475467] hover:bg-[#F8FAFB] hover:text-[#101828]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#3157D5]' : isSubdued ? 'text-[#94A3B8]' : 'text-[#64748B]'}`} />
                        <span>{tab.label}</span>
                      </div>
                      {isSubdued && (
                        <span className="text-[9px] uppercase font-mono px-1 rounded bg-[#F1F5F9] text-[#94A3B8]">
                          Awaiting
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Overview & Metadata Card */}
          <div className="saas-card p-6 space-y-5 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="flex items-center justify-between border-b border-[#EAECF0] pb-4">
              <div className="flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-[#3157D5]" />
                <div>
                  <h3 className="font-bold text-base text-[#101828]">
                    Transcript Metadata Summary
                  </h3>
                  <p className="text-xs text-[#475467] mt-0.5">
                    High-level document properties and multi-model analysis summary.
                  </p>
                </div>
              </div>
              {/* Removed duplicate StatusBadge to satisfy Requirement 1 */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-1">
                <div className="text-xs font-semibold text-[#475467]">Source File</div>
                <div className="text-sm font-bold text-[#101828] font-mono truncate">
                  {transcript.fileName || 'Pasted Script'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-1">
                <div className="text-xs font-semibold text-[#475467]">Document Length</div>
                <div className="text-sm font-bold text-[#101828] font-mono">
                  {wordCount.toLocaleString()} words ({lineCount.toLocaleString()} lines)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-1">
                <div className="text-xs font-semibold text-[#475467]">Primary Sentiment</div>
                <div className="pt-0.5">
                  {isCompleted && meta.sentiment ? (
                    <SentimentBadge sentiment={meta.sentiment} size="sm" />
                  ) : (
                    <span className="text-xs text-[#94A3B8] font-mono">N/A</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-1">
                <div className="text-xs font-semibold text-[#475467]">Classified Domain</div>
                <div className="pt-0.5">
                  {isCompleted && meta.category ? (
                    <CategoryBadge category={meta.category} size="sm" />
                  ) : (
                    <span className="text-xs text-[#94A3B8] font-mono">Unclassified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Tab Intelligence Navigation Grid */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#475467] mb-3">
                Analysis Deep-Dives Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('topics')}
                  className="p-3.5 rounded-xl border border-[#E4E7EC] hover:border-[#3157D5] hover:bg-[#EEF3FF]/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Tag className="w-4 h-4 text-[#3157D5]" />
                    <span className="text-xs font-mono font-bold text-[#3157D5]">
                      {isCompleted ? (meta.keywords?.length || 0) : '-'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#101828] group-hover:text-[#3157D5] transition-colors">
                    Topics & Keywords
                  </div>
                  <div className="text-[11px] text-[#475467] mt-0.5">
                    {isCompleted ? 'Explore key terms' : 'Awaiting analysis'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('entities')}
                  className="p-3.5 rounded-xl border border-[#E4E7EC] hover:border-[#3157D5] hover:bg-[#EEF3FF]/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Layers className="w-4 h-4 text-[#15803D]" />
                    <span className="text-xs font-mono font-bold text-[#15803D]">
                      {isCompleted ? entityCount : '-'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#101828] group-hover:text-[#3157D5] transition-colors">
                    Named Entities
                  </div>
                  <div className="text-[11px] text-[#475467] mt-0.5">
                    {isCompleted ? 'Persons, orgs & places' : 'Awaiting analysis'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('sentiment')}
                  className="p-3.5 rounded-xl border border-[#E4E7EC] hover:border-[#3157D5] hover:bg-[#EEF3FF]/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <HeartHandshake className="w-4 h-4 text-[#D97706]" />
                    <span className="text-xs font-mono font-bold text-[#D97706]">
                      {isCompleted ? (meta.emotions?.length || 0) : '-'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#101828] group-hover:text-[#3157D5] transition-colors">
                    Sentiment & Tone
                  </div>
                  <div className="text-[11px] text-[#475467] mt-0.5">
                    {isCompleted ? 'Polarity & emotions' : 'Awaiting analysis'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('speakers')}
                  className="p-3.5 rounded-xl border border-[#E4E7EC] hover:border-[#3157D5] hover:bg-[#EEF3FF]/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Users className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-xs font-mono font-bold text-[#7C3AED]">
                      {isCompleted ? speakerCount : '-'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#101828] group-hover:text-[#3157D5] transition-colors">
                    Speakers
                  </div>
                  <div className="text-[11px] text-[#475467] mt-0.5">
                    {isCompleted ? 'Diarization & turns' : 'Awaiting analysis'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('segments')}
                  className="p-3.5 rounded-xl border border-[#E4E7EC] hover:border-[#3157D5] hover:bg-[#EEF3FF]/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Film className="w-4 h-4 text-[#0891B2]" />
                    <span className="text-xs font-mono font-bold text-[#0891B2]">
                      {isCompleted ? segmentCount : '-'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#101828] group-hover:text-[#3157D5] transition-colors">
                    Scene Segments
                  </div>
                  <div className="text-[11px] text-[#475467] mt-0.5">
                    {isCompleted ? 'Timeline & structure' : 'Awaiting analysis'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Domain Classification */}
          <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
            <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#3157D5]" />
                <h3 className="font-bold text-sm text-[#101828]">
                  Domain Classification
                </h3>
              </div>
              {isCompleted && meta.category ? (
                <span className="text-xs text-[#3157D5] font-mono font-bold">
                  {Math.round((meta.category.confidence || 0) * 100)}% Confidence
                </span>
              ) : (
                <span className="text-xs text-[#94A3B8] font-mono">
                  Awaiting Analysis
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC]">
              <div>
                <div className="text-xs text-[#475467] font-semibold">Classified Domain</div>
                <div className="text-base font-bold text-[#101828] capitalize mt-0.5">
                  {isCompleted && meta.category?.label ? meta.category.label : 'Awaiting AI analysis...'}
                </div>
              </div>
              {isCompleted && meta.category ? (
                <CategoryBadge category={meta.category} size="md" />
              ) : (
                <span className="text-xs text-[#94A3B8] font-mono font-medium px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0]">
                  N/A
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONVERSATION DYNAMICS TIMELINE TAB */}
      {activeTab === 'dynamics' && renderTabContent('dynamics', (
        <ConversationTimeline
          timelineData={timelineData}
          onNavigateToTranscript={handleNavigateToTranscript}
          title={transcript.title}
        />
      ))}

      {/* INTELLIGENCE GRAPH TAB */}
      {activeTab === 'graph' && renderTabContent('graph', (
        <NarrativeGraph
          graphData={graphData}
          onNavigateToTranscript={handleNavigateToTranscript}
          title={transcript.title}
        />
      ))}

      {activeTab === 'entities' && renderTabContent('entities', (
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
      ))}

      {activeTab === 'topics' && renderTabContent('topics', (
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
      ))}

      {activeTab === 'sentiment' && renderTabContent('sentiment', (
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
      ))}

      {activeTab === 'speakers' && renderTabContent('speakers', (
        <SpeakerIntelligence
          transcript={transcript}
          onNavigateToTranscript={handleNavigateToTranscript}
        />
      ))}

      {activeTab === 'segments' && renderTabContent('segments', (
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
      ))}

      {activeTab === 'raw' && (
        <TranscriptViewer
          rawText={transcript.rawText}
          title={transcript.title}
          initialSearchQuery={transcriptViewerSearch}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        transcriptTitle={transcript?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </AppShell>
  );
};

export default TranscriptDetail;
