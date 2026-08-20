import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import { Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Transcripts = () => {
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

  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

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
      <PageHeader
        title="Transcript Library"
        subtitle="Search, filter, and inspect structured metadata models across all uploaded scripts and dialogue files."
        actions={
          <>
            <button
              onClick={() => fetchTranscripts()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#101828] border border-[#D0D5DD] text-xs sm:text-sm font-semibold transition-colors shadow-saas cursor-pointer"
              title="Refresh transcripts"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#475467]" />
              <span>Refresh</span>
            </button>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] text-white text-xs sm:text-sm font-semibold shadow-saas transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Transcript</span>
            </Link>
          </>
        }
      />

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

      <DataTable
        transcripts={sortedTranscripts}
        loading={loading}
        onRetry={handleRetry}
        onDelete={handleDelete}
        hasActiveFilters={hasActiveFilters}
        emptyActionLink="/upload"
      />
    </AppShell>
  );
};

export default Transcripts;
