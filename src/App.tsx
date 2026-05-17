/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import LeadList from './components/LeadList';
import LeadBoard from './components/LeadBoard';
import CustomersList from './components/CustomersList';
import GrantsList from './components/GrantsList';
import LeadDetail from './components/LeadDetail';
import { initialLeads, initialCustomers, initialGrants } from './data';
import { Lead, Customer, Grant, ViewMode } from './types';

export default function App() {
  const [view, setView] = useState<ViewMode>('inbox');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads] = useState<Lead[]>(initialLeads);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [grants] = useState<Grant[]>(initialGrants);

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#111827] font-sans overflow-hidden">
      <Sidebar currentView={view} onViewChange={(v) => {
        setView(v);
        setSelectedLead(null); 
      }} />
      
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
            <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />
          )}
        </div>
      </main>
    </div>
  );
}
