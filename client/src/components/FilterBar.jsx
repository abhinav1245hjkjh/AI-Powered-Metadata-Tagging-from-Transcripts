import React from 'react';
import { Search, RotateCcw, X } from 'lucide-react';

const CATEGORIES = [
  'entertainment',
  'interview',
  'meeting',
  'education',
  'news',
  'technology',
  'finance',
  'healthcare',
  'legal',
  'podcast'
];

const FilterBar = ({
  searchTerm = '',
  onSearchChange,
  statusFilter = '',
  onStatusChange,
  categoryFilter = '',
  onCategoryChange,
  sentimentFilter = '',
  onSentimentChange,
  sortBy = 'newest',
  onSortChange,
  onReset
}) => {
  const hasActiveFilters = Boolean(
    searchTerm || statusFilter || categoryFilter || sentimentFilter || sortBy !== 'newest'
  );

  return (
    <div className="saas-card p-3 sm:p-4 bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search transcripts by title or keyword..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:border-[#94A3B8] text-[#0F172A] placeholder-[#94A3B8] text-xs sm:text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:border-[#94A3B8] text-[#0F172A] font-medium text-xs sm:text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer transition-all flex-1 sm:flex-initial"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:border-[#94A3B8] text-[#0F172A] font-medium text-xs sm:text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer transition-all flex-1 sm:flex-initial capitalize"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => onSentimentChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:border-[#94A3B8] text-[#0F172A] font-medium text-xs sm:text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer transition-all flex-1 sm:flex-initial"
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:border-[#94A3B8] text-[#0F172A] font-medium text-xs sm:text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer transition-all flex-1 sm:flex-initial"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="words_desc">Longest Word Count</option>
          </select>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#334155] hover:text-[#2563EB] border border-[#DCE5F2] hover:border-[#BFDBFE] text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
