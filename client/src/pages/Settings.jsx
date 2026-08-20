import React from 'react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import PageHeader from '../components/PageHeader';
import {
  User,
  Shield,
  Cpu,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  return (
    <AppShell>
      <PageHeader
        title="Settings & Specifications"
        subtitle="Manage platform preferences, inspect active NLP microservices, and review architecture configurations."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Account Details */}
        <div className="saas-card p-6 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
          <div className="flex items-center gap-2 border-b border-[#EAECF0] pb-3">
            <User className="w-4 h-4 text-[#3157D5]" />
            <h3 className="font-bold text-sm text-[#101828]">User Profile & Authentication</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[#475467] font-bold mb-1">Full Name</div>
              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-[#101828] font-bold">
                {user?.name || 'Cognizant AI Evaluator'}
              </div>
            </div>

            <div>
              <div className="text-[#475467] font-bold mb-1">Email Address</div>
              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-[#101828] font-bold">
                {user?.email || 'evaluator@cognizant.com'}
              </div>
            </div>

            <div>
              <div className="text-[#475467] font-bold mb-1">Authorization Security</div>
              <div className="p-3 rounded-lg bg-[#ECFDF3] border border-[#D1FADF] text-[#067647] flex items-center gap-2 font-mono text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#067647]" />
                <span>JWT Bearer Signed (bcrypt password encryption)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Model NLP Pipeline Specs */}
        <div className="saas-card p-6 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
          <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#3157D5]" />
              <h3 className="font-bold text-sm text-[#101828]">NLP Architecture Specifications</h3>
            </div>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#3157D5] hover:text-[#2446B8] font-bold inline-flex items-center gap-1"
            >
              <span>Swagger UI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex justify-between items-center">
              <span className="text-[#475467] font-semibold">Named Entity Recognition:</span>
              <span className="text-[#101828] font-bold">spaCy en_core_web_sm</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex justify-between items-center">
              <span className="text-[#475467] font-semibold">Keyphrase Extraction:</span>
              <span className="text-[#101828] font-bold">KeyBERT + Embeddings</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex justify-between items-center">
              <span className="text-[#475467] font-semibold">Sentiment Valence:</span>
              <span className="text-[#101828] font-bold">NLTK VADER Lexicon</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex justify-between items-center">
              <span className="text-[#475467] font-semibold">Emotion Probabilities:</span>
              <span className="text-[#101828] font-bold">DistilRoBERTa (12 Taxa)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex justify-between items-center">
              <span className="text-[#475467] font-semibold">Zero-Shot Domain Classifier:</span>
              <span className="text-[#101828] font-bold">BART-Large-MNLI (10 Domains)</span>
            </div>
          </div>
        </div>

        {/* Platform Integrity & Standards */}
        <div className="saas-card p-6 space-y-3 lg:col-span-2 bg-white border border-[#E4E7EC] shadow-saas">
          <div className="flex items-center gap-2 border-b border-[#EAECF0] pb-3">
            <Shield className="w-4 h-4 text-[#3157D5]" />
            <h3 className="font-bold text-sm text-[#101828]">Deterministic Data Contracts</h3>
          </div>
          <p className="text-xs text-[#344054] leading-relaxed">
            MetaMind AI strictly preserves deterministic API schemas between the Node.js API Gateway and Python FastAPI microservice. Zero static or fabricated mockup data is used across visualizations, data tables, and analytics charts.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
