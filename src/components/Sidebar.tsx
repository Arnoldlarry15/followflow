import { Inbox, Kanban, Users, FileText } from 'lucide-react';
import { ViewMode } from '../types';
import { cn } from '../utils';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <img
          src="/follow_flow_logo_3x.png"
          alt="FollowFlow logo"
          className="h-20 w-auto max-w-none object-contain"
        />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 text-sm font-medium">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace</p>
          <button
            onClick={() => onViewChange('inbox')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium",
              currentView === 'inbox' ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Inbox className="w-5 h-5" />
            Unified Inbox
          </button>
          <button
            onClick={() => onViewChange('pipeline')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium mt-1",
              currentView === 'pipeline' ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Kanban className="w-5 h-5" />
            Pipeline
          </button>
        </div>

        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</p>
          <button
            onClick={() => onViewChange('customers')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors",
              currentView === 'customers' ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Users className="w-5 h-5" />
            Customers
          </button>
          <button
            onClick={() => onViewChange('grants')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors mt-1",
              currentView === 'grants' ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <FileText className="w-5 h-5" />
            Grants & Loans
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Performance</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Follow-ups Handled</span>
            <span className="text-blue-600 font-bold">142</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
