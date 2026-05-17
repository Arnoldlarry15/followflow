import { Customer } from '../types';
import { cn } from '../utils';

interface CustomersListProps {
  customers: Customer[];
}

export default function CustomersList({ customers }: CustomersListProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Customer Directory</h3>
      </div>

      <div className="space-y-4 overflow-hidden">
        {customers.map(customer => (
          <div 
            key={customer.id}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase shrink-0 text-sm bg-gray-100 text-gray-600">
                {customer.company.substring(0, 2)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-base">
                  {customer.company}
                </h4>
                <p className="text-sm text-gray-500">
                  {customer.name} &bull; {customer.email} &bull; {customer.phone}
                </p>
              </div>
            </div>

            <div className="w-1/4 px-4 border-l border-gray-100">
               <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total Spend</p>
               <p className="text-gray-900 font-semibold">${customer.totalSpend.toLocaleString()}</p>
            </div>

            <div className="text-right shrink-0">
              <span className={cn(
                "px-2 py-1 rounded text-xs font-bold uppercase",
                customer.status === 'VIP' ? "bg-purple-50 text-purple-600" :
                customer.status === 'active' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              )}>
                {customer.status}
              </span>
              <p className="text-xs text-gray-400 mt-1">Last: {new Date(customer.lastPurchaseDate).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
