/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import LeadList from './components/LeadList';
import LeadBoard from './components/LeadBoard';
import CustomersList from './components/CustomersList';
import GrantsList from './components/GrantsList';
import LeadDetail from './components/LeadDetail';
import { initialLeads, initialCustomers, initialGrants } from './data';
import { Lead, Customer, Grant, ViewMode, LLMProvider, LLM_PROVIDER_LABELS } from './types';

interface LlmStatus {
  defaultProvider: LLMProvider;
  ollama: {
    model: string;
    reachable: boolean;
    modelAvailable: boolean;
  };
  openai: {
    model: string;
    configured: boolean;
  };
  anthropic: {
    model: string;
    configured: boolean;
  };
  gemini: {
    model: string;
    configured: boolean;
  };
}

interface ProviderHealthState {
  label: string;
  tone: string;
}

function getProviderHealthState(provider: LLMProvider, status: LlmStatus | null): ProviderHealthState {
  switch (provider) {
    case 'ollama':
      if (!status?.ollama.reachable) {
        return {
          label: 'Offline',
          tone: 'text-red-700 bg-red-50 border-red-100',
        };
      }

      return {
        label: status.ollama.modelAvailable
          ? `Connected: ${status.ollama.model}`
          : `Connected (model missing): ${status.ollama.model}`,
        tone: status.ollama.modelAvailable
          ? 'text-green-700 bg-green-50 border-green-100'
          : 'text-amber-700 bg-amber-50 border-amber-100',
      };

    case 'openai':
      return status?.openai.configured
        ? {
            label: `Configured: ${status.openai.model}`,
            tone: 'text-green-700 bg-green-50 border-green-100',
          }
        : {
            label: 'API key missing',
            tone: 'text-amber-700 bg-amber-50 border-amber-100',
          };

    case 'anthropic':
      return status?.anthropic.configured
        ? {
            label: `Configured: ${status.anthropic.model}`,
            tone: 'text-green-700 bg-green-50 border-green-100',
          }
        : {
            label: 'API key missing',
            tone: 'text-amber-700 bg-amber-50 border-amber-100',
          };

    case 'gemini':
      return status?.gemini.configured
        ? {
            label: `Configured: ${status.gemini.model}`,
            tone: 'text-green-700 bg-green-50 border-green-100',
          }
        : {
            label: 'API key missing',
            tone: 'text-amber-700 bg-amber-50 border-amber-100',
          };

    default:
      return {
        label: 'API key missing',
        tone: 'text-amber-700 bg-amber-50 border-amber-100',
      };
  }
}

export default function App() {
  const STATUS_POLL_INTERVAL_MS = 30000;
  const [view, setView] = useState<ViewMode>('inbox');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('ollama');
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [leads] = useState<Lead[]>(initialLeads);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [grants] = useState<Grant[]>(initialGrants);
  const hasSyncedDefaultProvider = useRef(false);

  const refreshLlmStatus = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsStatusLoading(true);
    }

    try {
      const response = await fetch('/api/llm-status');
      if (!response.ok) {
        throw new Error('Status check failed');
      }
      const data = (await response.json()) as LlmStatus;
      setLlmStatus(data);
      if (!hasSyncedDefaultProvider.current) {
        setLlmProvider(data.defaultProvider);
        hasSyncedDefaultProvider.current = true;
      }
    } catch {
      setLlmStatus(null);
    } finally {
      if (showLoading) {
        setIsStatusLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshLlmStatus();
  }, [refreshLlmStatus]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshLlmStatus(false);
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshLlmStatus]);

  const providerHealth = getProviderHealthState(llmProvider, llmStatus);

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#111827] font-sans overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={(v) => {
          setView(v);
          setSelectedLead(null);
        }}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Global App Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Lead Command Center</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              AI Active: Monitoring Channels
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
              <label htmlFor="llm-provider" className="text-xs font-medium text-gray-500">LLM</label>
              <select
                id="llm-provider"
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value as LLMProvider)}
                className="text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
              >
                <option value="ollama">{LLM_PROVIDER_LABELS.ollama}</option>
                <option value="openai">{LLM_PROVIDER_LABELS.openai}</option>
                <option value="anthropic">{LLM_PROVIDER_LABELS.anthropic}</option>
                <option value="gemini">{LLM_PROVIDER_LABELS.gemini}</option>
              </select>
            </div>
            <button
              onClick={() => void refreshLlmStatus()}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${providerHealth.tone}`}
              title="Refresh LLM status"
            >
              {isStatusLoading ? 'Checking...' : providerHealth.label}
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer">+ Add Lead Source</button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 border border-gray-300"></div>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${selectedLead ? 'pr-96' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === 'inbox' && (
                <LeadList leads={leads} onSelectLead={setSelectedLead} />
              )}
              {view === 'pipeline' && (
                <LeadBoard leads={leads} onSelectLead={setSelectedLead} />
              )}
              {view === 'customers' && (
                <CustomersList customers={customers} />
              )}
              {view === 'grants' && (
                <GrantsList grants={grants} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide-over panel */}
        <div
          className={`absolute top-0 right-0 h-full shadow-2xl transform transition-transform duration-300 ease-in-out ${
            selectedLead ? 'translate-x-0' : 'translate-x-[110%]'
          }`}
        >
          {selectedLead && (
            <LeadDetail
              lead={selectedLead}
              llmProvider={llmProvider}
              onClose={() => setSelectedLead(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
