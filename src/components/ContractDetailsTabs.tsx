'use client';

import { useState } from 'react';
import { SpreadsheetGrid, GridColumn } from './SpreadsheetGrid';
import { Plus, X } from 'lucide-react';

interface ContractCustomer {
  id: string;
  customer_name: string;
  customer_number: string;
  contact_person: string;
  email: string;
  added_date: string;
}

interface ContractProduct {
  id: string;
  product_code: string;
  product_name: string;
  product_type: 'single' | 'product_group' | 'department' | 'price_group'; // Type of product entry
  product_group_name?: string; // If it's a group
  department_name?: string; // If it's a department
  contract_price?: number; // Only for single products
  discount_type: '%' | 'KR'; // For categories: type of discount
  discount_value: number; // For single: %, for categories: % or KR based on discount_type
  quantity: number;
  valid_from: string;
  valid_to: string;
  campaign_whitelist: boolean; // True = allow campaigns despite contract exclusion
}

interface ContractDetailsTabsProps {
  contractId: string;
  contractName: string;
  excludeFromCampaigns: boolean;
  onToggleExcludeFromCampaigns: (value: boolean) => void;
}

type TabType = 'customers' | 'products';

export function ContractDetailsTabs({
  contractId,
  contractName,
  excludeFromCampaigns,
  onToggleExcludeFromCampaigns
}: ContractDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProductTab, setModalProductTab] = useState<'single' | 'product_group' | 'department'>('single');

  // Sample data - replace with API calls
  const [customers, setCustomers] = useState<ContractCustomer[]>([
    {
      id: '1',
      customer_name: 'Företag AB',
      customer_number: 'C-1001',
      contact_person: 'Anna Svensson',
      email: 'anna@foretagab.se',
      added_date: '2024-01-15',
    },
    {
      id: '2',
      customer_name: 'Handel & Co',
      customer_number: 'C-1002',
      contact_person: 'Erik Johansson',
      email: 'erik@handelco.se',
      added_date: '2024-02-01',
    },
  ]);

  const [products, setProducts] = useState<ContractProduct[]>([
    {
      id: '1',
      product_code: 'P-001',
      product_name: 'Widget Premium',
      product_type: 'single',
      contract_price: 150.00,
      discount_type: '%',
      discount_value: 10,
      quantity: 100,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
      campaign_whitelist: false,
    },
    {
      id: '2',
      product_code: 'VG-001',
      product_name: 'Elektronik (Varugrupp)',
      product_type: 'product_group',
      product_group_name: 'Elektronik',
      discount_type: '%',
      discount_value: 15,
      quantity: 1,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
      campaign_whitelist: true,
    },
    {
      id: '3',
      product_code: 'AVD-001',
      product_name: 'IT-avdelningen (Avdelning)',
      product_type: 'department',
      department_name: 'IT',
      discount_type: 'KR',
      discount_value: 50,
      quantity: 1,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
      campaign_whitelist: false,
    },
  ]);

  // Autocomplete options for modal
  const availableCustomers = [
    { id: 'c1', name: 'Företag AB', number: 'C-1001' },
    { id: 'c2', name: 'Handel & Co', number: 'C-1002' },
    { id: 'c3', name: 'Tech Solutions', number: 'C-1003' },
    { id: 'c4', name: 'Nordic Trading', number: 'C-1004' },
    { id: 'c5', name: 'Retail Group', number: 'C-1005' },
  ];

  const availableProducts = [
    { id: 'p1', code: 'P-001', name: 'Widget Premium', type: 'single' as const },
    { id: 'p2', code: 'P-002', name: 'Gadget Deluxe', type: 'single' as const },
    { id: 'p3', code: 'P-003', name: 'Tool Professional', type: 'single' as const },
    { id: 'p4', code: 'P-004', name: 'Device Elite', type: 'single' as const },
    { id: 'p5', code: 'P-005', name: 'Component Master', type: 'single' as const },
  ];

  const availableProductGroups = [
    { id: 'pg1', code: 'VG-001', name: 'Elektronik' },
    { id: 'pg2', code: 'VG-002', name: 'Verktyg' },
    { id: 'pg3', code: 'VG-003', name: 'Kontorsmaterial' },
    { id: 'pg4', code: 'VG-004', name: 'Möbler' },
  ];

  const availableDepartments = [
    { id: 'd1', code: 'AVD-001', name: 'IT' },
    { id: 'd2', code: 'AVD-002', name: 'Försäljning' },
    { id: 'd3', code: 'AVD-003', name: 'Produktion' },
    { id: 'd4', code: 'AVD-004', name: 'Administration' },
  ];

  const customerColumns: GridColumn[] = [
    {
      field: 'customer_number',
      headerName: 'Kundnummer',
      width: 140,
      editable: false,
    },
    {
      field: 'customer_name',
      headerName: 'Kundnamn',
      width: 220,
      editable: false,
    },
    {
      field: 'contact_person',
      headerName: 'Kontaktperson',
      width: 180,
      editable: true,
    },
    {
      field: 'email',
      headerName: 'E-post',
      width: 200,
      editable: true,
    },
    {
      field: 'added_date',
      headerName: 'Tillagd datum',
      width: 140,
      editable: false,
    },
  ];

  const handleToggleWhitelist = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, campaign_whitelist: !p.campaign_whitelist } : p
    ));
  };

  const productColumns: GridColumn[] = [
    {
      field: 'product_type',
      headerName: 'Typ',
      width: 120,
      editable: false,
      cellRenderer: (value: string) => {
        const typeLabels = {
          single: 'Produkt',
          product_group: 'Varugrupp',
          department: 'Avdelning',
          price_group: 'Prisgrupp',
        };
        const label = typeLabels[value as keyof typeof typeLabels] || value;
        const colors = {
          single: 'bg-blue-100 text-blue-700',
          product_group: 'bg-green-100 text-green-700',
          department: 'bg-purple-100 text-purple-700',
          price_group: 'bg-orange-100 text-orange-700',
        };
        const color = colors[value as keyof typeof colors] || 'bg-slate-100 text-slate-700';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {label}
          </span>
        );
      },
      filterTextGetter: (value: string) => {
        const typeLabels = {
          single: 'Produkt',
          product_group: 'Varugrupp',
          department: 'Avdelning',
          price_group: 'Prisgrupp',
        };
        return typeLabels[value as keyof typeof typeLabels] || value;
      },
    },
    {
      field: 'product_code',
      headerName: 'Kod',
      width: 120,
      editable: false,
    },
    {
      field: 'product_name',
      headerName: 'Namn',
      width: 220,
      editable: false,
    },
    {
      field: 'contract_price',
      headerName: 'Avtalspris',
      width: 120,
      type: 'number',
      editable: true,
      cellRenderer: (value: any, row: any) => {
        // Only show contract price for single products
        if (row?.product_type !== 'single') {
          return <span className="text-slate-400">-</span>;
        }
        return `${Number(value || 0).toFixed(2)} kr`;
      },
    },
    {
      field: 'discount_type',
      headerName: 'Rabatttyp',
      width: 100,
      editable: true,
      cellRenderer: (value: any, row: any) => {
        // For single products, always show %
        if (row?.product_type === 'single') {
          return <span className="text-slate-600">%</span>;
        }
        // For categories, show editable dropdown
        return (
          <select
            value={value || '%'}
            onChange={(e) => {
              setProducts(prev => prev.map(p =>
                p.id === row?.id ? { ...p, discount_type: e.target.value as '%' | 'KR' } : p
              ));
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="%">%</option>
            <option value="KR">KR</option>
          </select>
        );
      },
    },
    {
      field: 'discount_value',
      headerName: 'Rabatt',
      width: 120,
      type: 'number',
      editable: true,
      cellRenderer: (value: any, row: any) => {
        if (row?.product_type === 'single') {
          return `${value}%`;
        }
        const discountType = row?.discount_type || '%';
        return discountType === '%' ? `${value}%` : `${Number(value).toFixed(2)} kr`;
      },
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
    {
      field: 'campaign_whitelist',
      headerName: 'Tillåt kampanjer',
      width: 140,
      editable: false,
      cellRenderer: (value: any, row: any) => {
        const isDisabled = !excludeFromCampaigns;
        return (
          <div className="flex items-center justify-center h-full">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                disabled={isDisabled}
                onChange={() => handleToggleWhitelist(row.id)}
                onClick={(e) => e.stopPropagation()}
                className={`sr-only peer ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              />
              <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300
                ${isDisabled
                  ? 'bg-slate-200 cursor-not-allowed'
                  : 'bg-slate-200 peer-checked:bg-green-600'
                }
                peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5
                after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}>
              </div>
            </label>
          </div>
        );
      },
      filterTextGetter: (value: any) => value ? 'Ja' : 'Nej',
    },
  ];

  const getFilteredOptions = () => {
    const lowerSearch = searchTerm.toLowerCase();
    if (activeTab === 'customers') {
      return availableCustomers.filter(c =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.number.toLowerCase().includes(lowerSearch)
      );
    } else {
      // For products tab, filter based on selected modal tab
      if (modalProductTab === 'single') {
        return availableProducts.filter(p =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.code.toLowerCase().includes(lowerSearch)
        );
      } else if (modalProductTab === 'product_group') {
        return availableProductGroups.filter(pg =>
          pg.name.toLowerCase().includes(lowerSearch) ||
          pg.code.toLowerCase().includes(lowerSearch)
        );
      } else if (modalProductTab === 'department') {
        return availableDepartments.filter(d =>
          d.name.toLowerCase().includes(lowerSearch) ||
          d.code.toLowerCase().includes(lowerSearch)
        );
      }
      return [];
    }
  };

  const handleAddItem = (item: any) => {
    // Add logic to create new item based on activeTab
    console.log('Adding item to contract:', item);
    setIsModalOpen(false);
    setSearchTerm('');
  };

  const tabs = [
    { id: 'customers' as TabType, label: 'Kunder', count: customers.length },
    { id: 'products' as TabType, label: 'Produkter', count: products.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Campaign Exclusion Toggle */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeFromCampaigns}
                onChange={(e) => onToggleExcludeFromCampaigns(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:bg-red-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all relative"></div>
              <span className="text-sm font-medium text-slate-700">
                Exkludera avtal från kampanjer
              </span>
            </label>
            {excludeFromCampaigns && (
              <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                Kampanjer exkluderade
              </span>
            )}
          </div>
          {excludeFromCampaigns && (
            <div className="text-xs text-slate-500">
              Tips: Aktivera "Tillåt kampanjer" på enskilda produkter för undantag
            </div>
          )}
        </div>
      </div>

      {/* Tab Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-2">
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
            {activeTab === 'customers' ? 'Lägg till kund' : 'Lägg till produkt'}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'customers' && (
          <SpreadsheetGrid
            columns={customerColumns}
            data={customers}
            height="100%"
            showFilter={true}
          />
        )}
        {activeTab === 'products' && (
          <SpreadsheetGrid
            columns={productColumns}
            data={products}
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
                {activeTab === 'customers' ? 'Lägg till kund till avtal' : 'Lägg till produkt till avtal'}
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
              {/* Product Type Tabs (only show for products) */}
              {activeTab === 'products' && (
                <div className="mb-4 flex gap-1 border-b border-slate-200">
                  <button
                    onClick={() => {
                      setModalProductTab('single');
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      modalProductTab === 'single'
                        ? 'text-blue-700 border-b-2 border-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Produkter
                  </button>
                  <button
                    onClick={() => {
                      setModalProductTab('product_group');
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      modalProductTab === 'product_group'
                        ? 'text-blue-700 border-b-2 border-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Varugrupper
                  </button>
                  <button
                    onClick={() => {
                      setModalProductTab('department');
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      modalProductTab === 'department'
                        ? 'text-blue-700 border-b-2 border-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Avdelningar
                  </button>
                </div>
              )}

              <label className="block text-sm font-medium text-slate-700 mb-2">
                {activeTab === 'customers' ? 'Sök kund' :
                  modalProductTab === 'single' ? 'Sök produkt' :
                  modalProductTab === 'product_group' ? 'Sök varugrupp' :
                  'Sök avdelning'}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === 'customers' ? 'Sök på kundnamn eller nummer...' :
                  modalProductTab === 'single' ? 'Sök på produktnamn eller kod...' :
                  modalProductTab === 'product_group' ? 'Sök på varugrupp...' :
                  'Sök på avdelning...'
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />

              {/* Autocomplete Dropdown */}
              {searchTerm && (
                <div className="mt-2 max-h-60 overflow-auto border border-slate-200 rounded-md shadow-lg bg-white">
                  {getFilteredOptions().length > 0 ? (
                    getFilteredOptions().map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => handleAddItem(option)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {activeTab === 'customers' ? option.name : option.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {activeTab === 'customers' ? option.number : option.code}
                          </span>
                        </div>
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
                  Börja skriva för att se förslag på {
                    activeTab === 'customers' ? 'kunder' :
                    modalProductTab === 'single' ? 'produkter' :
                    modalProductTab === 'product_group' ? 'varugrupper' :
                    'avdelningar'
                  }
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
