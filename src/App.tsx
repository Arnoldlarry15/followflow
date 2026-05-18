/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, Mail, MessageSquare, Phone, Link2 } from 'lucide-react';
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

interface NewContactFormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  type: Lead['type'];
  status: Lead['status'];
  totalSpend: string;
  notes: string;
}

interface SignInFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

const DEFAULT_NEW_CONTACT: NewContactFormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  type: 'lead',
  status: 'pending',
  totalSpend: '',
  notes: '',
};

const DEFAULT_SIGN_IN: SignInFormState = {
  email: '',
  password: '',
  rememberMe: true,
};

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
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [grants] = useState<Grant[]>(initialGrants);
  const hasSyncedDefaultProvider = useRef(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newContact, setNewContact] = useState<NewContactFormState>(DEFAULT_NEW_CONTACT);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [signInForm, setSignInForm] = useState<SignInFormState>(DEFAULT_SIGN_IN);
  const [linkedAccounts, setLinkedAccounts] = useState({
    googleGmail: false,
    slack: false,
    twilio: false,
  });
  const [sessionUser, setSessionUser] = useState({
    name: 'Demo User',
    email: 'demo@followflow.local',
  });

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

  const closeAddLeadModal = useCallback(() => {
    setIsAddLeadOpen(false);
    setNewContact(DEFAULT_NEW_CONTACT);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const closeSignInModal = useCallback(() => {
    setIsSignInOpen(false);
    setSignInForm(DEFAULT_SIGN_IN);
  }, []);

  const toggleLinkedAccount = useCallback((account: 'googleGmail' | 'slack' | 'twilio') => {
    setLinkedAccounts((current) => ({
      ...current,
      [account]: !current[account],
    }));
  }, []);

  const handleSignInSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const enteredEmail = signInForm.email.trim().toLowerCase();
    if (!enteredEmail) {
      return;
    }

    const displayName = enteredEmail.split('@')[0]?.replace(/[._-]/g, ' ') || 'Demo User';
    const normalizedName = displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    setSessionUser({
      name: normalizedName || 'Demo User',
      email: enteredEmail,
    });
    closeSignInModal();
  }, [closeSignInModal, signInForm.email]);

  const handleAddLeadSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const contactId = `c-${Date.now()}`;
    const leadId = `l-${Date.now()}`;
    const spendValue = Number(newContact.totalSpend || 0);
    const todayIso = new Date().toISOString();
    const followUpIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const customerName = newContact.name.trim() || 'New Contact';
    const companyName = newContact.company.trim() || 'New Company';

    setCustomers((current) => [
      ...current,
      {
        id: contactId,
        name: customerName,
        company: companyName,
        email: newContact.email.trim() || 'unknown@example.com',
        phone: newContact.phone.trim() || '(555) 000-0000',
        totalSpend: spendValue,
        lastPurchaseDate: todayIso,
        status: newContact.status === 'converted' ? 'VIP' : 'active',
        notes: newContact.notes.trim() || 'Entry added from the lead form.',
      },
    ]);

    setLeads((current) => [
      {
        id: leadId,
        name: customerName,
        company: companyName,
        type: newContact.type,
        status: newContact.status,
        lastContactDate: todayIso,
        nextFollowUpDate: followUpIso,
        notes: newContact.notes.trim() || 'Lead created from the entry form.',
        aiSuggestion: 'Record created. Follow up to verify contact details and next steps.',
      },
      ...current,
    ]);

    setSelectedLead({
      id: leadId,
      name: customerName,
      company: companyName,
      type: newContact.type,
      status: newContact.status,
      lastContactDate: todayIso,
      nextFollowUpDate: followUpIso,
      notes: newContact.notes.trim() || 'Lead created from the entry form.',
      aiSuggestion: 'Record created. Follow up to verify contact details and next steps.',
    });

    closeAddLeadModal();
    setView('inbox');
  }, [closeAddLeadModal, newContact]);

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsProfileOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileOpen]);

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
            <div className="hidden xl:flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Connected Apps</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
                  linkedAccounts.googleGmail
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Google/Gmail {linkedAccounts.googleGmail ? 'Linked' : 'Not linked'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
                  linkedAccounts.slack
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Slack {linkedAccounts.slack ? 'Linked' : 'Not linked'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
                  linkedAccounts.twilio
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Twilio {linkedAccounts.twilio ? 'Linked' : 'Not linked'}
              </span>
            </div>
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
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
            >
              + Add Lead
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen((s) => !s)}
                aria-haspopup="true"
                className="w-9 h-9 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center focus:outline-none bg-gray-100"
                title="Profile menu"
              >
                <img src="/profilePic.jpg" alt="Current user profile" className="h-full w-full object-cover" />
                <span className="sr-only">Open profile menu</span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    ref={profileRef}
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 2, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <img src="/profilePic.jpg" alt="User avatar" className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{sessionUser.name}</p>
                        <p className="text-xs text-gray-400">{sessionUser.email}</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4 text-gray-500" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsSignInOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Link2 className="w-4 h-4 text-gray-500" />
                        Sign in
                      </button>
                    </div>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSessionUser({
                            name: 'Demo User',
                            email: 'demo@followflow.local',
                          });
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

        <AnimatePresence>
          {isAddLeadOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={closeAddLeadModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add Lead</h3>
                    <p className="text-sm text-gray-500">Create a temporary customer/lead record for testing the UI.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddLeadModal}
                    className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    aria-label="Close add lead form"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddLeadSubmit} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Name</span>
                      <input
                        value={newContact.name}
                        onChange={(event) => setNewContact((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Taylor Reed"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Company</span>
                      <input
                        value={newContact.company}
                        onChange={(event) => setNewContact((current) => ({ ...current, company: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Northstar Services"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Email</span>
                      <input
                        type="email"
                        value={newContact.email}
                        onChange={(event) => setNewContact((current) => ({ ...current, email: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="taylor@northstar.com"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Phone</span>
                      <input
                        value={newContact.phone}
                        onChange={(event) => setNewContact((current) => ({ ...current, phone: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="(555) 222-3344"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Type</span>
                      <select
                        value={newContact.type}
                        onChange={(event) => setNewContact((current) => ({ ...current, type: event.target.value as Lead['type'] }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="lead">Lead</option>
                        <option value="customer">Customer</option>
                        <option value="grant">Grant</option>
                        <option value="opportunity">Opportunity</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <select
                        value={newContact.status}
                        onChange={(event) => setNewContact((current) => ({ ...current, status: event.target.value as Lead['status'] }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="overdue">Overdue</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                      </select>
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-gray-700">Total Spend (sample data)</span>
                      <input
                        type="number"
                        min="0"
                        value={newContact.totalSpend}
                        onChange={(event) => setNewContact((current) => ({ ...current, totalSpend: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="2500"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-gray-700">Notes</span>
                      <textarea
                        value={newContact.notes}
                        onChange={(event) => setNewContact((current) => ({ ...current, notes: event.target.value }))}
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                        placeholder="Add any details you want to test with."
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeAddLeadModal}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save Record
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/35 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={closeSettingsModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                    <p className="text-sm text-gray-500">Manage connected tools for this demo workspace.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSettingsModal}
                    className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    aria-label="Close settings"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Google + Gmail</p>
                        <p className="text-xs text-gray-500">Sync inbox threads and follow-up reminders.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLinkedAccount('googleGmail')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        linkedAccounts.googleGmail
                          ? 'text-green-700 bg-green-50 border-green-200'
                          : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {linkedAccounts.googleGmail ? 'Linked' : 'Link Account'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Slack</p>
                        <p className="text-xs text-gray-500">Post daily follow-up summaries to your channel.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLinkedAccount('slack')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        linkedAccounts.slack
                          ? 'text-green-700 bg-green-50 border-green-200'
                          : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {linkedAccounts.slack ? 'Linked' : 'Link Account'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Twilio</p>
                        <p className="text-xs text-gray-500">Enable SMS follow-up reminders and call logs.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLinkedAccount('twilio')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        linkedAccounts.twilio
                          ? 'text-green-700 bg-green-50 border-green-200'
                          : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {linkedAccounts.twilio ? 'Linked' : 'Link Account'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSignInOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/35 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={closeSignInModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sign In</h3>
                    <p className="text-sm text-gray-500">Simulated auth for demo flows.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSignInModal}
                    className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    aria-label="Close sign in"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSignInSubmit} className="p-6 space-y-4">
                  <label className="space-y-2 block">
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <input
                      type="email"
                      required
                      value={signInForm.email}
                      onChange={(event) => setSignInForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-sm font-medium text-gray-700">Password</span>
                    <input
                      type="password"
                      required
                      value={signInForm.password}
                      onChange={(event) => setSignInForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={signInForm.rememberMe}
                      onChange={(event) => setSignInForm((current) => ({ ...current, rememberMe: event.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Keep me signed in on this device
                  </label>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeSignInModal}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
