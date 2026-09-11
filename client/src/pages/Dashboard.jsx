import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
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

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get('/transcripts', { params });
      setTranscripts(res.data?.data?.transcripts || res.data?.transcripts || []);
    } catch (err) {
      console.error('Failed to fetch transcripts:', err);
      if (!isPolling) toast.error('Failed to load dashboard metrics.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

  // Polling for processing/queued status updates
  useEffect(() => {
    const hasPending = transcripts.some(
      (t) => t.status === 'processing' || t.status === 'queued'
    );

    let intervalId;
    if (hasPending) {
      intervalId = setInterval(() => {
        fetchTranscripts(true);
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transcripts, fetchTranscripts]);

  const handleDeleteClick = (id, title) => {
    setDeleteTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await api.delete(`/transcripts/${deleteTarget.id}`);
      toast.success('Transcript deleted successfully.');
      setTranscripts((prev) => prev.filter((t) => t._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete transcript error:', err);
      toast.error(err.response?.data?.message || 'Unable to delete transcript. Please try again.');
    } finally {
      setIsDeleting(false);
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

  // Client-side Sorting & Filtering
  const filteredTranscripts = useMemo(() => {
    let result = [...transcripts];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.fileName?.toLowerCase().includes(q) ||
          t.rawText?.toLowerCase().includes(q) ||
          t.metadata?.topics?.some((topic) => topic.name?.toLowerCase().includes(q))
      );
    }

    if (sentimentFilter) {
      result = result.filter((t) => t.metadata?.sentiment === sentimentFilter);
    }

    if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'title_asc') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'words_desc') {
      result.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [transcripts, searchTerm, sentimentFilter, sortBy]);

  const hasActiveFilters = Boolean(
    searchTerm || statusFilter || categoryFilter || sentimentFilter || sortBy !== 'newest'
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          subtitle="Real-time transcript processing summary and NLP metadata extraction metrics"
        />

        {/* 4 Primary KPI Summary Cards */}
        {loading ? (
          <CardSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label="Total Transcripts"
              value={kpiMetrics.total}
              description={
                kpiMetrics.total === 0
                  ? 'No transcripts in workspace'
                  : `${kpiMetrics.processed} completed, ${kpiMetrics.processing} in progress`
              }
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed Analysis"
              value={kpiMetrics.processed}
              description={
                kpiMetrics.total === 0
                  ? 'No analyses performed'
                  : `${kpiMetrics.completionPercentage}% processing success rate`
              }
            />
            <StatCard
              icon={Layers}
              label="Entities Extracted"
              value={kpiMetrics.processed === 0 ? 'N/A' : kpiMetrics.totalEntities}
              description={
                kpiMetrics.processed === 0
                  ? 'Awaiting completed AI analysis'
                  : `Across ${kpiMetrics.uniqueCategoriesCount} domain categories`
              }
            />
            <StatCard
              icon={Users}
              label="Speakers Identified"
              value={kpiMetrics.processed === 0 ? 'N/A' : kpiMetrics.distinctSpeakers}
              description={
                kpiMetrics.processed === 0
                  ? 'Awaiting completed AI analysis'
                  : 'Diarized conversational participants'
              }
            />
          </div>
        )}

        {/* Search & Filter Toolbar */}
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

        {/* Recent Transcripts Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0F172A]">Recent Transcripts</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                {filteredTranscripts.length}
              </span>
            </div>
            <Link
              to="/transcripts"
              className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All Transcripts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            transcripts={filteredTranscripts}
            loading={loading}
            onRetry={handleRetry}
            onDelete={handleDeleteClick}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={Boolean(deleteTarget)}
          transcriptTitle={deleteTarget?.title || ''}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </AppShell>
  );
};

export default Dashboard;
