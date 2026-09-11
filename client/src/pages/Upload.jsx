import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import PageHeader from '../components/PageHeader';
import UploadZone from '../components/UploadZone';
import { ProcessingStepper } from '../components/ProcessingStatus';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Users,
  Activity,
  Network,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Upload = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState(null);

  const [isRetrying, setIsRetrying] = useState(false);

  // Poll for completion of currently uploaded transcript
  useEffect(() => {
    let intervalId = null;

    if (
      activeTranscript &&
      (activeTranscript.status === 'queued' || activeTranscript.status === 'processing')
    ) {
      intervalId = setInterval(async () => {
        try {
          const res = await api.get(`/transcripts/${activeTranscript._id}`);
          if (res.data && res.data.transcript) {
            const updated = res.data.transcript;
            setActiveTranscript(updated);
            if (updated.status === 'completed') {
              toast.success('Metadata extraction complete!');
              clearInterval(intervalId);
            } else if (updated.status === 'temporarily_rate_limited') {
              toast.error('AI provider is temporarily rate limited. Your transcript is safe.');
              clearInterval(intervalId);
            } else if (updated.status === 'failed') {
              toast.error(updated.error || 'Processing failed.');
              clearInterval(intervalId);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTranscript]);

  const handleRetry = async () => {
    if (!activeTranscript || isRetrying) return;
    setIsRetrying(true);
    try {
      await api.post(`/transcripts/${activeTranscript._id}/retry`);
      toast.success('Transcript analysis re-queued.');
      setActiveTranscript({
        ...activeTranscript,
        status: 'queued',
        error: null
      });
    } catch (err) {
      toast.error('Failed to retry transcript processing.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleUploadSubmit = async ({ isFile, payload }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let res;
      if (isFile) {
        res = await api.post('/transcripts', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/transcripts', payload);
      }

      const created = res.data.transcript;
      setActiveTranscript(created);
      toast.success('Transcript queued for analysis.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please check file format.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Upload Transcript"
        subtitle="Upload a dialogue script, interview, or meeting transcript to extract structured metadata and analytics."
      />

      {/* Active Processing Stepper */}
      {activeTranscript && (
        <div className="space-y-3">
          <ProcessingStepper
            status={activeTranscript.status}
            error={activeTranscript.error}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />

          {activeTranscript.status === 'completed' && (
            <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#D1FADF] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#067647] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#101828]">
                    {activeTranscript.title}
                  </h4>
                  <p className="text-xs text-[#067647] font-medium">
                    Metadata extraction and analysis completed successfully.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/transcripts/${activeTranscript._id}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#067647] hover:bg-[#054f31] text-white text-xs font-semibold shadow-saas transition-all cursor-pointer"
              >
                <span>Inspect Metadata</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTranscript.status === 'temporarily_rate_limited' && (
            <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#D97706] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#92400E]">AI analysis temporarily busy</h4>
                  <p className="text-xs text-[#B45309] font-medium">
                    {activeTranscript.error || 'The AI provider is currently rate limiting requests. Your transcript is safe. Please retry analysis in a moment.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="px-3.5 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] disabled:bg-[#94A3B8] text-white text-xs font-semibold shadow-saas transition-all cursor-pointer"
                >
                  {isRetrying ? 'Re-Queueing...' : 'Retry Analysis'}
                </button>
                <button
                  onClick={() => navigate(`/transcripts/${activeTranscript._id}`)}
                  className="px-3 py-2 rounded-lg bg-white hover:bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-semibold cursor-pointer"
                >
                  View Transcript
                </button>
                <button
                  onClick={() => setActiveTranscript(null)}
                  className="px-3 py-2 rounded-lg bg-white hover:bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-semibold cursor-pointer"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}

          {activeTranscript.status === 'failed' && (
            <div className="p-4 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#B42318] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#101828]">Analysis Failed</h4>
                  <p className="text-xs text-[#B42318] font-medium">
                    {activeTranscript.error || 'Metadata processing failed. Please retry.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="px-3.5 py-2 rounded-lg bg-[#B42318] hover:bg-[#912018] disabled:bg-[#94A3B8] text-white text-xs font-semibold shadow-saas transition-all cursor-pointer"
                >
                  {isRetrying ? 'Re-Queueing...' : 'Retry Analysis'}
                </button>
                <button
                  onClick={() => setActiveTranscript(null)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] border border-[#D0D5DD] text-[#344054] text-xs font-semibold cursor-pointer"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid: Upload Form (Left 8 cols) + Feature Highlights & Guidelines (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload Form Card */}
        <div className="lg:col-span-8 saas-card p-6 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
          <div className="border-b border-[#EAECF0] pb-3">
            <h2 className="text-base font-bold text-[#101828]">
              Submit Transcript
            </h2>
            <p className="text-xs text-[#344054] mt-0.5">
              Select a local file or paste raw text to start the extraction pipeline.
            </p>
          </div>

          <UploadZone
            onUploadSubmit={handleUploadSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Column: Capabilities & Format Guide */}
        <div className="lg:col-span-4 space-y-4">
          {/* Output Intelligence Overview */}
          <div className="saas-card p-5 space-y-3.5 bg-white border border-[#E4E7EC] shadow-saas">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475467] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#3157D5]" />
              <span>Extracted Metadata Features</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-[#3157D5] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#101828] block">Topics & Keyphrases</span>
                  <span className="text-xs text-[#344054]">Multi-word semantic key concepts with MMR diversity.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-[#3157D5] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#101828] block">Named Entities</span>
                  <span className="text-xs text-[#344054]">Persons, organizations, locations, dates, and products.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-[#3157D5] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#101828] block">Speaker Intelligence</span>
                  <span className="text-xs text-[#344054]">Dialogue turns, word counts, and participation shares.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Activity className="w-4 h-4 text-[#3157D5] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#101828] block">Conversation Dynamics</span>
                  <span className="text-xs text-[#344054]">Chronological sentiment shifts and conversation intensity index.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Network className="w-4 h-4 text-[#3157D5] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#101828] block">Narrative Graph</span>
                  <span className="text-xs text-[#344054]">Interactive knowledge graph with relationship strengths.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Format Reference */}
          <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] shadow-saas">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475467] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#475467]" />
              <span>Formatting Tips</span>
            </h3>

            <p className="text-xs text-[#344054] leading-relaxed">
              For best speaker and scene extraction, format dialogue with uppercase speaker tags or scene headings:
            </p>

            <pre className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-xs text-[#101828] font-mono overflow-x-auto leading-relaxed">
{`INT. ROOM - DAY

SEAN:
What is the primary concept?

WILL:
We should automate data analysis.`}
            </pre>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Upload;
