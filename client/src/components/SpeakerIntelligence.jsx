import React, { useState, useMemo } from 'react';
import {
  Users,
  Mic
} from 'lucide-react';
import SpeakerCard from './SpeakerCard';
import SpeakerDetailPanel from './SpeakerDetailPanel';
import { buildSpeakerAnalytics } from '../utils/speakerAnalytics';

const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString();
};

const SpeakerIntelligence = ({
  transcript,
  onNavigateToTranscript
}) => {
  const analytics = useMemo(() => {
    return buildSpeakerAnalytics(transcript);
  }, [transcript]);

  const {
    speakers = [],
    totalSpeakerWords = 0,
    totalTurns = 0,
    isSingleSpeaker = false,
    interactions = []
  } = analytics;

  const [selectedSpeakerId, setSelectedSpeakerId] = useState(
    speakers.length > 0 ? speakers[0].id : null
  );

  const selectedSpeaker = useMemo(() => {
    return speakers.find((s) => s.id === selectedSpeakerId) || speakers[0] || null;
  }, [selectedSpeakerId, speakers]);

  if (speakers.length === 0) {
    return (
      <div className="saas-card p-10 text-center space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
        <div className="w-10 h-10 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] flex items-center justify-center mx-auto text-[#475467]">
          <Mic className="w-5 h-5 text-[#7C3AED]" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">
          No Speaker Information Detected
        </h3>
        <p className="text-xs text-[#344054] max-w-md mx-auto">
          No explicit speaker names or dialogue labels were identified in the transcript body. Re-run analysis or check transcript formatting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header & Aggregate Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-[#E4E7EC] text-center shadow-saas">
          <div className="text-[11px] uppercase font-bold text-[#475467] tracking-wider">Speakers Identified</div>
          <div className="text-lg font-bold text-[#7C3AED] font-mono tabular-nums mt-0.5">
            {speakers.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#E4E7EC] text-center shadow-saas">
          <div className="text-[11px] uppercase font-bold text-[#475467] tracking-wider">Dialogue Turns</div>
          <div className="text-lg font-bold text-[#111827] font-mono tabular-nums mt-0.5">
            {totalTurns}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#E4E7EC] text-center shadow-saas">
          <div className="text-[11px] uppercase font-bold text-[#475467] tracking-wider">Total Words Spoken</div>
          <div className="text-lg font-bold text-[#111827] font-mono tabular-nums mt-0.5">
            {formatNumber(totalSpeakerWords)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#E4E7EC] text-center shadow-saas">
          <div className="text-[11px] uppercase font-bold text-[#475467] tracking-wider">Speaking Balance</div>
          <div className="text-base font-bold text-[#15803D] font-mono tabular-nums mt-0.5">
            {isSingleSpeaker ? 'Monologue' : 'Interactive Dialogue'}
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Speaker Cards (Left) + Detail Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Speaker Cards & Turn Matrix */}
        <div className={`${selectedSpeaker ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {speakers.map((spk) => (
              <SpeakerCard
                key={spk.id}
                speaker={spk}
                isSelected={selectedSpeakerId === spk.id}
                onClick={() => setSelectedSpeakerId(spk.id)}
              />
            ))}
          </div>

          {/* Interaction Matrix if multi-speaker */}
          {interactions.length > 0 && (
            <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
              <div className="flex items-center gap-2 border-b border-[#EAECF0] pb-2.5">
                <Users className="w-4 h-4 text-[#7C3AED]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#475467]">
                  Dialogue Handoff Sequence
                </h4>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {interactions.map((int, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex items-center justify-between text-xs text-[#111827]"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-[#7C3AED]">{int.from}</span>
                      <span className="text-[#667085]">→</span>
                      <span className="text-[#111827]">{int.to}</span>
                    </div>
                    <span className="font-mono text-[#475467] font-semibold">
                      {int.count} {int.count === 1 ? 'handoff' : 'handoffs'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Speaker Detail Panel */}
        {selectedSpeaker && (
          <div className="lg:col-span-4">
            <SpeakerDetailPanel
              speaker={selectedSpeaker}
              onNavigateToTranscript={onNavigateToTranscript}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerIntelligence;
