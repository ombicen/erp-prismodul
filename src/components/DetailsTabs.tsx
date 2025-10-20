'use client';

import { useState } from 'react';
import { SpreadsheetGrid, GridColumn } from './SpreadsheetGrid';
import { Plus, X } from 'lucide-react';

interface CustomerPriceGroup {
  id: string;
  group_name: string;
  price: number;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
}

interface Contract {
  id: string;
  contract_number: string;
  customer_name: string;
  price: number;
  quantity: number;
  valid_from: string;
  valid_to: string;
}

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_price: number;
  discount_percent: number;
  start_date: string;
  end_date: string;
}

interface DetailsTabsProps {
  productId: string;
  productName: string;
}

type TabType = 'price_groups' | 'contracts' | 'campaigns';

export function DetailsTabs({ productId, productName }: DetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('price_groups');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data - replace with API calls
  const [priceGroups, setPriceGroups] = useState<CustomerPriceGroup[]>([
    {
      id: '1',
      group_name: 'VIP Kunder',
      price: 150.00,
      discount_percent: 10,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
    },
    {
      id: '2',
      group_name: 'Återförsäljare',
      price: 130.00,
      discount_percent: 20,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
    },
  ]);

  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: '1',
      contract_number: 'AVT-2024-001',
      customer_name: 'Företag AB',
      price: 140.00,
      quantity: 100,
      valid_from: '2024-01-01',
      valid_to: '2024-06-30',
    },
  ]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      campaign_name: 'Vår REA 2024',
      campaign_price: 99.00,
      discount_percent: 25,
      start_date: '2024-03-01',
      end_date: '2024-03-31',
    },
  ]);

  // Autocomplete options for modal
  const availablePriceGroups = [
    { id: 'pg1', name: 'VIP Kunder' },
    { id: 'pg2', name: 'Återförsäljare' },
    { id: 'pg3', name: 'Standard Kunder' },
    { id: 'pg4', name: 'Företagskunder' },
  ];

  const availableCustomers = [
    { id: 'c1', name: 'Företag AB' },
    { id: 'c2', name: 'Handel & Co' },
    { id: 'c3', name: 'Tech Solutions' },
    { id: 'c4', name: 'Nordic Trading' },
  ];

  const availableCampaigns = [
    { id: 'camp1', name: 'Vår REA 2024' },
    { id: 'camp2', name: 'Black Friday' },
    { id: 'camp3', name: 'Sommarrea' },
    { id: 'camp4', name: 'Julkampanj' },
  ];

  const priceGroupColumns: GridColumn[] = [
    {
      field: 'group_name',
      headerName: 'Prisgrupp',
      width: 200,
      editable: false,
    },
    {
      field: 'price',
      headerName: 'Pris',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
    },
    {
      field: 'discount_percent',
      headerName: 'Rabatt %',
      width: 100,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${value}%`,
    },
    {
      field: 'valid_from',
      headerName: 'Giltig från',
      width: 120,
      editable: true,
    },
    {
      field: 'valid_to',
      headerName: 'Giltig till',
      width: 120,
      editable: true,
    },
  ];

  const contractColumns: GridColumn[] = [
    {
      field: 'contract_number',
      headerName: 'Avtalsnummer',
      width: 140,
      editable: false,
    },
    {
      field: 'customer_name',
      headerName: 'Kund',
      width: 180,
      editable: false,
    },
    {
      field: 'price',
      headerName: 'Pris',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
    },
    {
      field: 'quantity',
      headerName: 'Antal',
      width: 100,
      type: 'number',
      editable: true,
    },
    {
      field: 'valid_from',
      headerName: 'Giltig från',
      width: 120,
      editable: true,
    },
    {
      field: 'valid_to',
      headerName: 'Giltig till',
      width: 120,
      editable: true,
    },
  ];

  const campaignColumns: GridColumn[] = [
    {
      field: 'campaign_name',
      headerName: 'Kampanj',
      width: 200,
      editable: false,
    },
    {
      field: 'campaign_price',
      headerName: 'Kampanjpris',
      width: 140,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
    },
    {
      field: 'discount_percent',
      headerName: 'Rabatt %',
      width: 100,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${value}%`,
    },
    {
      field: 'start_date',
      headerName: 'Startdatum',
      width: 120,
      editable: true,
    },
    {
      field: 'end_date',
      headerName: 'Slutdatum',
      width: 120,
      editable: true,
    },
  ];

  const getFilteredOptions = () => {
    const lowerSearch = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'price_groups':
        return availablePriceGroups.filter(pg =>
          pg.name.toLowerCase().includes(lowerSearch)
        );
      case 'contracts':
        return availableCustomers.filter(c =>
          c.name.toLowerCase().includes(lowerSearch)
        );
      case 'campaigns':
        return availableCampaigns.filter(c =>
          c.name.toLowerCase().includes(lowerSearch)
        );
      default:
        return [];
    }
  };

  const handleAddItem = (item: any) => {
    // Add logic to create new item based on activeTab
    console.log('Adding item:', item);
    setIsModalOpen(false);
    setSearchTerm('');
  };

  const tabs = [
    { id: 'price_groups' as TabType, label: 'Kundprisgrupper', count: priceGroups.length },
    { id: 'contracts' as TabType, label: 'Avtal', count: contracts.length },
    { id: 'campaigns' as TabType, label: 'Kampanjer', count: campaigns.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-0 py-0">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Lägg till
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'price_groups' && (
          <SpreadsheetGrid
            columns={priceGroupColumns}
            data={priceGroups}
            height="100%"
            showFilter={true}
          />
        )}
        {activeTab === 'contracts' && (
          <SpreadsheetGrid
            columns={contractColumns}
            data={contracts}
            height="100%"
            showFilter={true}
          />
        )}
        {activeTab === 'campaigns' && (
          <SpreadsheetGrid
            columns={campaignColumns}
            data={campaigns}
            height="100%"
            showFilter={true}
          />
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Lägg till {
                  activeTab === 'price_groups' ? 'Kundprisgrupp' :
                  activeTab === 'contracts' ? 'Avtal' :
                  'Kampanj'
                }
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm('');
                }}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {activeTab === 'price_groups' ? 'Sök prisgrupp' :
                 activeTab === 'contracts' ? 'Sök kund' :
                 'Sök kampanj'}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Skriv för att söka..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />

              {/* Autocomplete Dropdown */}
              {searchTerm && (
                <div className="mt-2 max-h-60 overflow-auto border border-slate-200 rounded-md shadow-lg bg-white">
                  {getFilteredOptions().length > 0 ? (
                    getFilteredOptions().map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleAddItem(option)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        {option.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      Inga resultat hittades
                    </div>
                  )}
                </div>
              )}

              {!searchTerm && (
                <div className="mt-4 p-3 bg-slate-50 rounded text-sm text-slate-600">
                  Börja skriva för att se förslag
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
