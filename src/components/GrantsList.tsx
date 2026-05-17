import { Grant } from '../types';
import { cn } from '../utils';

interface GrantsListProps {
  grants: Grant[];
}

export default function GrantsList({ grants }: GrantsListProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Grants & Loans</h3>
      </div>

      <div className="space-y-4 overflow-hidden">
        {grants.map(grant => (
          <div 
            key={grant.id}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase shrink-0 text-sm", grant.type === 'loan' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}>
                  {grant.organization.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-base flex items-center">
                    {grant.title}
                    <span className={cn(
                      "ml-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      grant.type === 'loan' ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                    )}>
                      {grant.type}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {grant.organization} &bull; ${grant.amount.toLocaleString()}
                    {grant.type === 'loan' && grant.interestRate ? ` \u2022 ${grant.interestRate}` : ''}
                    {grant.type === 'loan' && grant.term ? ` \u2022 ${grant.term}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-bold uppercase",
                  grant.status === 'current' ? "bg-green-50 text-green-600" :
                  grant.status === 'past' ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600"
                )}>
                  {grant.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {grant.deadline === 'Rolling' || grant.deadline === 'Open' ? grant.deadline : `Deadline: ${new Date(grant.deadline).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            <div className="pl-14">
               <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{grant.description}</p>
            </div>
          </div>
        ))}
        {grants.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            No active opportunities found.
          </div>
        )}
      </div>
    </div>
  );
}
