'use client';

import { useState } from 'react';
import { Package, FileText, Users, Megaphone, BarChart3, DollarSign } from 'lucide-react';
import { ProductsView } from '@/views/ProductsView';
import { ContractsView } from '@/views/ContractsView';
import { CustomerPriceGroupsView } from '@/views/CustomerPriceGroupsView';
import { CampaignsView } from '@/views/CampaignsView';
import { ContextualPriceView } from '@/views/ContextualPriceView';
import { SurchargesView } from '@/views/SurchargesView';

type View = 'products' | 'contracts' | 'customer-groups' | 'campaigns' | 'surcharges' | 'contextual-price';

interface ContextualPriceContext {
  type: 'contract' | 'customer_price_group' | 'campaign';
  id: string;
  name: string;
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>('products');
  const [contextualPrice, setContextualPrice] = useState<ContextualPriceContext | null>(null);

  const navigation = [
    { id: 'products' as View, label: 'Produkter', icon: Package },
    { id: 'customer-groups' as View, label: 'Kundprisgrupper', icon: Users },
    { id: 'contracts' as View, label: 'Avtal', icon: FileText },
    { id: 'campaigns' as View, label: 'Kampanjer', icon: Megaphone },
    { id: 'surcharges' as View, label: 'Påslag', icon: DollarSign },
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
      case 'surcharges':
        return <SurchargesView />;
      default:
        return <ProductsView />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="px-6">
          <div className="h-16 flex items-center gap-6">
           

            <nav className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="hidden md:block text-xs text-slate-400">
              Version 1.0.0
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}
