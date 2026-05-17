import { Lead, LeadStatus } from '../types';
import LeadCard from './LeadCard';

interface LeadBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const COLUMNS: { id: LeadStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'overdue', label: 'Needs Attention' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'converted', label: 'Converted' },
];

export default function LeadBoard({ leads, onSelectLead }: LeadBoardProps) {
  return (
    <div className="p-8 h-full flex flex-col w-full">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Pipeline</h3>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map(column => {
          const columnLeads = leads.filter(l => l.status === column.id);
          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 p-4 snap-center">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-gray-700 text-sm">{column.label}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {columnLeads.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {columnLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} onClick={onSelectLead} viewMode="board" />
                ))}
                {columnLeads.length === 0 && (
                  <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm bg-white/50">
                    <span className="font-medium text-gray-400">0 Items</span>
                    <span className="text-xs mt-1 text-gray-400">All clear</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
