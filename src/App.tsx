import React, { useState } from 'react';
import { Package, FileText, Users, Megaphone, BarChart3 } from 'lucide-react';
import { ProductsView } from './views/ProductsView';
import { ContractsView } from './views/ContractsView';
import { CustomerPriceGroupsView } from './views/CustomerPriceGroupsView';
import { CampaignsView } from './views/CampaignsView';
import { ContextualPriceView } from './views/ContextualPriceView';

type View = 'products' | 'contracts' | 'customer-groups' | 'campaigns' | 'contextual-price';

interface ContextualPriceContext {
  type: 'contract' | 'customer_price_group' | 'campaign';
  id: string;
  name: string;
}

function App() {
  const [activeView, setActiveView] = useState<View>('products');
  const [contextualPrice, setContextualPrice] = useState<ContextualPriceContext | null>(null);

  const navigation = [
    { id: 'products' as View, label: 'Produkter', icon: Package },
    { id: 'contracts' as View, label: 'Avtal', icon: FileText },
    { id: 'customer-groups' as View, label: 'Kundprisgrupper', icon: Users },
    { id: 'campaigns' as View, label: 'Kampanjer', icon: Megaphone },
  ];

  const renderView = () => {
    if (activeView === 'contextual-price' && contextualPrice) {
      return (
        <ContextualPriceView
          contextType={contextualPrice.type}
          contextId={contextualPrice.id}
          contextName={contextualPrice.name}
        />
      );
    }

    switch (activeView) {
      case 'products':
        return <ProductsView />;
      case 'contracts':
        return <ContractsView />;
      case 'customer-groups':
        return <CustomerPriceGroupsView />;
      case 'campaigns':
        return <CampaignsView />;
      default:
        return <ProductsView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Prismodul</h1>
              <p className="text-xs text-slate-400">ERP System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 space-y-1">
            <p>Version 1.0.0</p>
            <p>Prishanteringssystem</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
