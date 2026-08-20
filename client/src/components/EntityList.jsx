import React, { useState, useMemo } from 'react';
import EntityChip from './EntityChip';
import { Search } from 'lucide-react';

const normalizeEntity = (ent) => {
  if (!ent) return null;
  if (typeof ent === 'string') {
    return { text: ent.trim(), label: 'ENTITY' };
  }
  const text = ent.text || ent.entity || ent.name || '';
  const label = ent.label || ent.type || 'ENTITY';
  if (!text || !text.trim()) return null;
  return { text: text.trim(), label: label.toUpperCase() };
};

const categorizeLabel = (label) => {
  const upper = (label || 'OTHER').toUpperCase();
  if (upper === 'PERSON') return 'People';
  if (upper === 'ORG' || upper === 'ORGANIZATION') return 'Organizations';
  if (upper === 'GPE' || upper === 'LOC' || upper === 'LOCATION' || upper === 'FAC') return 'Locations';
  if (upper === 'DATE' || upper === 'TIME') return 'Dates & Times';
  if (upper === 'PRODUCT' || upper === 'WORK_OF_ART' || upper === 'EVENT') return 'Products & Events';
  return 'Other Entities';
};

const EntityList = ({ entities = [], grouped = false }) => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize, deduplicate, and count occurrences
  const consolidatedEntities = useMemo(() => {
    if (!entities || !Array.isArray(entities) || entities.length === 0) return [];

    const map = new Map();
    entities.forEach((raw) => {
      const ent = normalizeEntity(raw);
      if (!ent) return;

      const key = `${ent.text.toLowerCase()}___${ent.label}`;
      if (map.has(key)) {
        const existing = map.get(key);
        map.set(key, { ...existing, count: existing.count + 1 });
      } else {
        map.set(key, { text: ent.text, label: ent.label, count: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
  }, [entities]);

  // Extract distinct entity labels for tab filtering
  const distinctLabels = useMemo(() => {
    const set = new Set(consolidatedEntities.map((e) => e.label));
    return ['ALL', ...Array.from(set)];
  }, [consolidatedEntities]);

  // Filter based on type tab and search query
  const filteredList = useMemo(() => {
    return consolidatedEntities.filter((ent) => {
      const matchesType = selectedType === 'ALL' || ent.label === selectedType;
      const matchesSearch =
        !searchQuery.trim() || ent.text.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesType && matchesSearch;
    });
  }, [consolidatedEntities, selectedType, searchQuery]);

  // Group entities by semantic category if grouped layout requested
  const categorizedGroups = useMemo(() => {
    const groups = {
      'People': [],
      'Organizations': [],
      'Locations': [],
      'Dates & Times': [],
      'Products & Events': [],
      'Other Entities': []
    };

    filteredList.forEach((ent) => {
      const cat = categorizeLabel(ent.label);
      if (groups[cat]) {
        groups[cat].push(ent);
      } else {
        groups['Other Entities'].push(ent);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredList]);

  if (!entities || !Array.isArray(entities) || consolidatedEntities.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[#475467] italic bg-[#F9FAFB] rounded-xl border border-[#E4E7EC]">
        No named entities detected in this transcript.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Header controls: Search & Type Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#EAECF0]">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1.5">
          {distinctLabels.map((lbl) => {
            const count =
              lbl === 'ALL'
                ? consolidatedEntities.length
                : consolidatedEntities.filter((e) => e.label === lbl).length;

            return (
              <button
                key={lbl}
                type="button"
                onClick={() => setSelectedType(lbl)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer font-bold ${
                  selectedType === lbl
                    ? 'bg-[#3157D5] text-white shadow-saas'
                    : 'bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] border border-[#D0D5DD]'
                }`}
              >
                <span>{lbl}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* In-list search */}
        <div className="relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-[#475467] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter entities..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#D0D5DD] text-[#101828] text-xs placeholder-[#667085] focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] transition-all"
          />
        </div>
      </div>

      {/* Entity Display: Grouped or Flat Chips */}
      {filteredList.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#475467] italic">
          No entities matching criteria.
        </div>
      ) : grouped && selectedType === 'ALL' ? (
        <div className="space-y-4">
          {categorizedGroups.map(([groupName, groupItems]) => (
            <div key={groupName} className="space-y-1.5">
              <div className="text-xs font-bold text-[#475467] uppercase tracking-wider flex items-center gap-1.5">
                <span>{groupName}</span>
                <span className="text-[#475467] font-mono font-medium">({groupItems.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupItems.map((ent, idx) => (
                  <EntityChip
                    key={`${ent.text}_${ent.label}_${idx}`}
                    text={ent.text}
                    label={ent.label}
                    count={ent.count}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-1">
          {filteredList.map((ent, idx) => (
            <EntityChip
              key={`${ent.text}_${ent.label}_${idx}`}
              text={ent.text}
              label={ent.label}
              count={ent.count}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityList;
