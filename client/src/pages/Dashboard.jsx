import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import { CardSkeleton } from '../components/SkeletonLoader';
import { computeLibraryMetrics } from '../utils/metadataMetrics';
import {
  FileText,
  CheckCircle2,
  Layers,
  Sparkles,
  Users,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchTranscripts = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const params = {};
      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (sentimentFilter) params.sentiment = sentimentFilter;

      const res = await api.get('/transcripts', { params });
      setTranscripts(res.data.transcripts || []);
    } catch (err) {
      if (!isPolling) {
        toast.error('Failed to load transcripts.');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [searchTerm, statusFilter, categoryFilter, sentimentFilter]);

  // Initial fetch
  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

  // Auto-polling for active background processing jobs
  useEffect(() => {
    const hasActiveJobs = transcripts.some(
      (t) => t.status === 'queued' || t.status === 'processing'
    );

    let intervalId = null;
    if (hasActiveJobs) {
      intervalId = setInterval(() => {
        fetchTranscripts(true);
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transcripts, fetchTranscripts]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete transcript "${title}"?`)) return;

    try {
      await api.delete(`/transcripts/${id}`);
      toast.success('Transcript deleted.');
      setTranscripts((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error('Failed to delete transcript.');
    }
  };

  const handleRetry = async (id) => {
    try {
      await api.post(`/transcripts/${id}/retry`);
      toast.success('Transcript analysis re-queued.');
      fetchTranscripts();
    } catch (err) {
      toast.error('Failed to retry transcript processing.');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setSentimentFilter('');
    setSortBy('newest');
  };

  // Compute Real Aggregate Metrics from Actual API Data
  const kpiMetrics = useMemo(() => {
    return computeLibraryMetrics(transcripts);
  }, [transcripts]);

  // Client-side Sorting
  const sortedTranscripts = useMemo(() => {
    const list = [...transcripts];
    if (sortBy === 'oldest') {
      return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (sortBy === 'title_asc') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    if (sortBy === 'words_desc') {
      const getWordCount = (item) => {
        const raw = typeof item.rawText === 'string' ? item.rawText.trim() : '';
        return raw ? raw.split(/\s+/).filter(Boolean).length : 0;
      };
      return list.sort((a, b) => getWordCount(b) - getWordCount(a));
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transcripts, sortBy]);

  const hasActiveFilters = Boolean(searchTerm || statusFilter || categoryFilter || sentimentFilter);

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        title="Metadata Intelligence Overview"
        subtitle="Real-time transcript metadata and structured intelligence across your transcript library."
      />

      {/* 5 Real Aggregate KPI Cards with Equal Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading ? (
          <>
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
              label="Total Transcripts"
              value={kpiMetrics.total}
              description="Across your library"
            />
            <StatCard
              icon={CheckCircle2}
              label="Processed Transcripts"
              value={kpiMetrics.processed}
              description="Ready for search & export"
            />
            <StatCard
              icon={Layers}
              label="Total Segments"
              value={kpiMetrics.totalSegments}
              description="Scene & dialogue blocks"
            />
            <StatCard
              icon={Sparkles}
              label="Named Entities"
              value={kpiMetrics.totalEntities}
              description="Extracted mentions"
            />
            <StatCard
              icon={Users}
              label="Speakers Identified"
              value={kpiMetrics.distinctSpeakers}
              description="Distinct interlocutors"
            />
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        sentimentFilter={sentimentFilter}
        onSentimentChange={setSentimentFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleResetFilters}
      />

      {/* Recent Transcripts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base text-[#101828]">
              Recent Transcripts
            </h2>
            <span className="text-xs text-[#475467] font-mono tabular-nums font-bold">
              ({sortedTranscripts.length})
            </span>
          </div>
          <Link
            to="/transcripts"
            className="text-xs sm:text-sm text-[#3157D5] hover:text-[#2446B8] font-bold inline-flex items-center gap-1 transition-colors"
          >
            <span>View Full Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          transcripts={sortedTranscripts}
          loading={loading}
          onRetry={handleRetry}
          onDelete={handleDelete}
          hasActiveFilters={hasActiveFilters}
          emptyActionLink="/upload"
        />
      </div>
    </AppShell>
  );
};

export default Dashboard;
