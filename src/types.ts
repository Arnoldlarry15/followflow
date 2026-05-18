export type LeadStatus = 'pending' | 'active' | 'overdue' | 'contacted' | 'converted';

export type LeadType = 'customer' | 'lead' | 'grant' | 'opportunity';

export interface Lead {
  id: string;
  name: string;
  company: string;
  type: LeadType;
  status: LeadStatus;
  lastContactDate: string;
  nextFollowUpDate: string;
  notes: string;
  aiSuggestion: string;
}

export type ViewMode = 'inbox' | 'pipeline' | 'customers' | 'grants';

export type LLMProvider = 'ollama' | 'openai' | 'anthropic' | 'gemini';

export const LLM_PROVIDER_LABELS: Record<LLMProvider, string> = {
  ollama: 'Ollama (Qwen Local)',
  openai: 'OpenAI (API)',
  anthropic: 'Anthropic (API)',
  gemini: 'Gemini (API)',
};

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalSpend: number;
  lastPurchaseDate: string;
  status: 'active' | 'churned' | 'VIP';
  notes: string;
}

export interface Grant {
  id: string;
  title: string;
  organization: string;
  amount: number;
  deadline: string;
  status: 'current' | 'past' | 'future';
  description: string;
  type: 'grant' | 'loan';
  interestRate?: string;
  term?: string;
}
