import React from 'react';
import { Building2, Calendar, Clock, User, Zap } from 'lucide-react';
import { Lead, LeadStatus, LeadType } from '../types';
import { cn } from '../utils';

interface LeadCardProps {
  key?: string | number;
  lead: Lead;
  onClick: (lead: Lead) => void;
  viewMode?: 'list' | 'board';
}

const statusColors: Record<LeadStatus, string> = {
  pending: 'bg-blue-50 text-blue-600',
  active: 'bg-green-50 text-green-600',
  overdue: 'bg-red-50 text-red-600',
  contacted: 'bg-purple-50 text-purple-600',
  converted: 'bg-emerald-50 text-emerald-600',
};

const typeColors: Record<LeadType, string> = {
  customer: 'bg-gray-100 text-gray-600',
  lead: 'bg-orange-100 text-orange-600',
  grant: 'bg-purple-100 text-purple-600',
  opportunity: 'bg-blue-100 text-blue-600',
};

export default function LeadCard({ lead, onClick, viewMode = 'list' }: LeadCardProps) {
  const isBoard = viewMode === 'board';

  return (
    <div 
      onClick={() => onClick(lead)}
      className={cn(
        "bg-white p-4 rounded-xl border shadow-sm transition-all cursor-pointer group",
        isBoard ? "border-gray-200 hover:border-gray-300 hover:shadow-md" : "border-gray-100 flex items-center justify-between hover:shadow-md hover:border-gray-200"
      )}
    >
      <div className={cn(isBoard ? "flex flex-col gap-3" : "flex items-center justify-between w-full")}>
        
        {/* Main Info */}
        <div className={cn(isBoard ? "flex justify-between items-start" : "flex items-center gap-4 flex-1")}>
          {!isBoard && (
             <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase shrink-0 text-sm", typeColors[lead.type])}>
               {lead.company.substring(0, 2)}
             </div>
          )}
          <div>
            <h4 className={cn("font-semibold text-gray-900", isBoard ? "text-sm" : "text-base")}>
              {lead.company}
            </h4>
            <p className="text-sm text-gray-500">
              {lead.name} • {lead.type.charAt(0).toUpperCase() + lead.type.slice(1)}
            </p>
          </div>
          {isBoard && (
            <span className={cn("px-2 py-1 rounded text-[10px] uppercase font-bold", statusColors[lead.status])}>
              {lead.status}
            </span>
          )}
        </div>

        {/* AI Insight Snippet (Only visible on board view for compactness, or short snippet) */}
        {isBoard && (
          <div className="mt-1 flex-1">
            <p className="text-xs text-gray-500 line-clamp-2">{lead.notes}</p>
          </div>
        )}

        {/* Status / Dates */}
        <div className={cn(isBoard ? "flex items-center justify-between mt-2 pt-3 border-t border-gray-100 text-xs text-gray-400" : "text-right shrink-0")}>
          {!isBoard ? (
            <>
              <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", statusColors[lead.status])}>
                {lead.status}: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
              </span>
              <p className="text-xs text-gray-400 mt-1">Contacted: {new Date(lead.lastContactDate).toLocaleDateString()}</p>
            </>
          ) : (
            <>
               <div className="flex items-center gap-1">
                 <Clock className="w-3.5 h-3.5" />
                 <span>{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
               </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
