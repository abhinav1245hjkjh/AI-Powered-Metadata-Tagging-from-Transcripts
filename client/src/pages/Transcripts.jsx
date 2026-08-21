import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';

const Transcripts = () => {
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
      if (!isPolling) {
        toast.error('Failed to load transcripts.');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

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
        <PageHeader
          title="Transcript Library"
          subtitle="Search, filter, and inspect structured metadata models across all uploaded scripts and dialogue files."
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
          transcripts={filteredTranscripts}
          loading={loading}
          onRetry={handleRetry}
          onDelete={handleDeleteClick}
          hasActiveFilters={hasActiveFilters}
          emptyActionLink="/upload"
        />

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

export default Transcripts;
