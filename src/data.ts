import { Lead, Customer, Grant } from './types';

export const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Sarah Jenkins',
    company: 'Jenkins Plumbing',
    email: 'sarah@jenkinsplumbing.com',
    phone: '(555) 123-4567',
    totalSpend: 12500,
    lastPurchaseDate: '2026-03-15T10:00:00Z',
    status: 'VIP',
    notes: 'Long-term client. Prefers quarterly check-ins.'
  },
  {
    id: 'c2',
    name: 'Jessica Walsh',
    company: 'Walsh Consulting',
    email: 'j.walsh@walshconsulting.com',
    phone: '(555) 987-6543',
    totalSpend: 4200,
    lastPurchaseDate: '2026-05-15T16:00:00Z',
    status: 'active',
    notes: 'Recently signed a 6-month retainer.'
  },
  {
    id: 'c3',
    name: 'Robert Miller',
    company: 'Miller Tech Solutions',
    email: 'rmiller@millertech.io',
    phone: '(555) 456-7890',
    totalSpend: 850,
    lastPurchaseDate: '2025-11-20T14:30:00Z',
    status: 'churned',
    notes: 'Switched to a competitor due to pricing. Reach out in Q3.'
  }
];

export const initialGrants: Grant[] = [
  {
    id: 'g1',
    title: 'Downtown Arts Revitalization',
    organization: 'City Arts Council',
    amount: 15000,
    deadline: '2026-06-30T23:59:59Z',
    status: 'current',
    description: 'Funding for local artists to create public murals in the downtown district. Requires portfolio and project proposal.',
    type: 'grant'
  },
  {
    id: 'g2',
    title: 'Small Business Tech Upgrade',
    organization: 'State Economic Development',
    amount: 5000,
    deadline: '2026-04-15T17:00:00Z',
    status: 'past',
    description: 'Grant to help small businesses upgrade their POS and inventory software. Awaiting decision.',
    type: 'grant'
  },
  {
    id: 'g3',
    title: 'Green Energy Initiative',
    organization: 'National Sustainability Fund',
    amount: 25000,
    deadline: '2026-09-01T12:00:00Z',
    status: 'future',
    description: 'Upcoming grant for businesses implementing solar or wind energy solutions. Application opens in July.',
    type: 'grant'
  },
  {
    id: 'l1',
    title: 'Small Business Expansion Loan',
    organization: 'First National Bank',
    amount: 50000,
    deadline: 'Rolling',
    status: 'current',
    description: 'Low-interest loan for expanding storefronts or purchasing new equipment.',
    type: 'loan',
    interestRate: '4.5% APR',
    term: '60 Months'
  },
  {
    id: 'l2',
    title: 'Inventory Financing Line',
    organization: 'Capital Partners',
    amount: 100000,
    deadline: 'Rolling',
    status: 'future',
    description: 'Revolving line of credit to manage seasonal inventory fluctuations.',
    type: 'loan',
    interestRate: '6.2% APR',
    term: 'Revolving'
  }
];

export const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    company: 'Jenkins Plumbing',
    type: 'customer',
    status: 'pending',
    lastContactDate: '2026-05-14T10:00:00Z',
    nextFollowUpDate: '2026-05-17T14:00:00Z',
    notes: 'Requested a quote for commercial pipes. Said she was comparing vendors.',
    aiSuggestion: 'Follow up today. Customer asked pricing question last week, likely ready to decide.',
  },
  {
    id: '2',
    name: 'Michael Chen',
    company: 'Urban Artists Collective',
    type: 'grant',
    status: 'active',
    lastContactDate: '2026-05-10T09:30:00Z',
    nextFollowUpDate: '2026-05-18T10:00:00Z',
    notes: 'Submitted initial application for the Downtown Arts Grant. Waiting on financial documents.',
    aiSuggestion: 'Send a gentle reminder tomorrow for the outstanding financial documents before the deadline.',
  },
  {
    id: '3',
    name: 'Amanda Torres',
    company: 'Torres E-commerce',
    type: 'opportunity',
    status: 'overdue',
    lastContactDate: '2026-05-01T15:20:00Z',
    nextFollowUpDate: '2026-05-08T09:00:00Z',
    notes: 'Abandoned conversation after discussing bulk shipping discounts.',
    aiSuggestion: 'Lead appears cold. Try reaching out with a new personalized discount offer to re-engage.',
  },
  {
    id: '4',
    name: 'David Kim',
    company: 'Kim Contracting',
    type: 'lead',
    status: 'contacted',
    lastContactDate: '2026-05-16T11:45:00Z',
    nextFollowUpDate: '2026-05-23T11:00:00Z',
    notes: 'Had a great intro call. Sent the proposal.',
    aiSuggestion: 'Recommend check-in next week to discuss the proposal details.',
  },
  {
    id: '5',
    name: 'Jessica Walsh',
    company: 'Walsh Consulting',
    type: 'customer',
    status: 'converted',
    lastContactDate: '2026-05-15T16:00:00Z',
    nextFollowUpDate: '2026-06-15T09:00:00Z',
    notes: 'Signed the 6-month retainer agreement.',
    aiSuggestion: 'Schedule a quarterly review in one month to ensure satisfaction.',
  }
];
