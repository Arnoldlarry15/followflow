import { Lead } from '../types';
import LeadCard from './LeadCard';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export default function LeadList({ leads, onSelectLead }: LeadListProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Priority Conversations</h3>
        <div className="flex gap-2">
          {/* Action icons placeholders if needed */}
        </div>
      </div>

      <div className="space-y-4 overflow-hidden">
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={onSelectLead} viewMode="list" />
        ))}
        {leads.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            You're all caught up! No active leads in your inbox.
          </div>
        )}
      </div>
    </div>
  );
}
