import { X, Sparkles, Send, CalendarPlus, CheckCircle2, ChevronRight, Mail } from 'lucide-react';
import { useState } from 'react';
import { Lead, LLMProvider, LLM_PROVIDER_LABELS } from '../types';
import { cn } from '../utils';

interface LeadDetailProps {
  lead: Lead;
  llmProvider: LLMProvider;
  onClose: () => void;
}

const UNKNOWN_MODEL_LABEL = 'Unknown model';

export default function LeadDetail({ lead, llmProvider, onClose }: LeadDetailProps) {
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProvider, setGeneratedProvider] = useState<LLMProvider | null>(null);
  const [generatedModel, setGeneratedModel] = useState<string | null>(null);

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    setDraft('');
    setGeneratedProvider(null);
    setGeneratedModel(null);
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadContext: lead, provider: llmProvider }),
      });
      const data = (await response.json()) as {
        draft?: string;
        error?: string;
        provider?: LLMProvider;
        model?: string;
      };
      if (response.ok && data.draft) {
        setDraft(data.draft);
        setGeneratedProvider(data.provider ?? llmProvider);
        setGeneratedModel(data.model ?? UNKNOWN_MODEL_LABEL);
      } else {
        setDraft(data.error || 'Failed to generate draft.');
      }
    } catch (err) {
      setDraft('An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen shadow-xl z-10">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white pt-6">
        <h2 className="font-semibold text-lg text-gray-900">Lead Details</h2>
        <button onClick={onClose} title="Close lead details" aria-label="Close lead details" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Header Info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{lead.name}</h1>
          <p className="text-gray-500 font-medium">{lead.company}</p>
          
          <div className="flex gap-2 mt-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-200">
              {lead.type.toUpperCase()}
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {lead.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-[#111827] text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold uppercase tracking-widest">AI Intelligence</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-blue-400 font-bold mb-1">ACTION SUGGESTED</p>
              <p className="text-sm leading-relaxed text-gray-300">"{lead.aiSuggestion}"</p>
              <p className="mt-3 text-[11px] text-gray-400">Provider: {LLM_PROVIDER_LABELS[llmProvider]}</p>
              {!draft && !isGenerating && (
                <button 
                  onClick={handleGenerateDraft}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Generate Follow-up Email
                </button>
              )}
              {isGenerating && (
                <div className="mt-4 w-full flex items-center justify-center gap-2 bg-white/10 text-gray-300 text-xs font-bold py-2 rounded-lg animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  Generating draft...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <div className="text-gray-900 font-semibold text-sm">Context & Notes</div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-600 text-sm leading-relaxed">
            {lead.notes}
          </div>
        </div>

        {/* Activity Timeline Mini */}
        <div className="space-y-4">
          <div className="text-gray-900 font-semibold text-sm">Timeline</div>
          <div className="relative pl-4 border-l-2 border-gray-100 space-y-5 pb-2">
            <div className="relative">
              <div className="absolute -left-[21px] mt-1 w-2.5 h-2.5 bg-gray-300 rounded-full border-2 border-white"></div>
              <p className="text-xs text-gray-400 mb-0.5">{new Date(lead.lastContactDate).toLocaleDateString()}</p>
              <p className="text-sm text-gray-700">Last contact made</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[21px] mt-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
              <p className="text-xs text-blue-500 font-medium mb-0.5">{new Date(lead.nextFollowUpDate).toLocaleDateString()}</p>
              <p className="text-sm text-gray-900 font-medium">Scheduled follow-up</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        {!draft && !isGenerating && (
          <div className="space-y-3">
            <button
              onClick={handleGenerateDraft}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors text-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Follow-up Email
            </button>
            <p className="text-xs text-gray-500 text-center">Provider selected: {LLM_PROVIDER_LABELS[llmProvider]}</p>
          </div>
        )}

        {draft && !isGenerating && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
            {generatedProvider && generatedModel && (
              <p className="text-[11px] text-gray-500">
                Generated by {LLM_PROVIDER_LABELS[generatedProvider]} · {generatedModel}
              </p>
            )}
            <div className="bg-white border text-sm text-gray-700 border-gray-100 shadow-sm rounded-xl p-4 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {draft}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleGenerateDraft}
                className="flex-[1] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-xs"
              >
                Regenerate
              </button>
              <button className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors text-xs">
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
