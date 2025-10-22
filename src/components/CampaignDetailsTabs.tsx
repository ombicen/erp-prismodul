'use client';

import { useState } from 'react';
import { SpreadsheetGrid, GridColumn } from './SpreadsheetGrid';
import { Plus, X } from 'lucide-react';

interface CampaignCustomer {
  id: string;
  customer_name: string;
  customer_number: string;
  contact_person: string;
  email: string;
  added_date: string;
}

interface CampaignProduct {
  id: string;
  product_code: string;
  product_name: string;
  product_type: 'single' | 'product_group' | 'department';
  product_group_name?: string;
  department_name?: string;
  campaign_price?: number; // Only for single products
  discount_type: '%' | 'KR'; // For categories: type of discount
  discount_value: number; // For single: %, for categories: % or KR based on discount_type
  valid_from: string;
  valid_to: string;
}

interface CampaignDetailsTabsProps {
  campaignId: string;
  campaignName: string;
}

type TabType = 'customers' | 'products';

export function CampaignDetailsTabs({
  campaignId,
  campaignName,
}: CampaignDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProductTab, setModalProductTab] = useState<'single' | 'product_group' | 'department'>('single');

  // Sample data - replace with API calls
  const [customers, setCustomers] = useState<CampaignCustomer[]>([
    {
      id: '1',
      customer_name: 'Premium Store AB',
      customer_number: 'C-3001',
      contact_person: 'Maria Svensson',
      email: 'maria@premiumstore.se',
      added_date: '2024-02-15',
    },
    {
      id: '2',
      customer_name: 'Discount Retail',
      customer_number: 'C-3002',
      contact_person: 'Anders Berg',
      email: 'anders@discount.se',
      added_date: '2024-03-20',
    },
  ]);

  const [products, setProducts] = useState<CampaignProduct[]>([
    {
      id: '1',
      product_code: 'P-001',
      product_name: 'Widget Premium',
      product_type: 'single',
      campaign_price: 99.00,
      discount_type: '%',
      discount_value: 20,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
    },
    {
      id: '2',
      product_code: 'VG-001',
      product_name: 'Elektronik (Varugrupp)',
      product_type: 'product_group',
      product_group_name: 'Elektronik',
      discount_type: '%',
      discount_value: 25,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
    },
  ]);

  // Autocomplete options
  const availableCustomers = [
    { id: 'c1', name: 'Premium Store AB', number: 'C-3001' },
    { id: 'c2', name: 'Discount Retail', number: 'C-3002' },
    { id: 'c3', name: 'Budget Shop', number: 'C-3003' },
    { id: 'c4', name: 'Luxury Boutique', number: 'C-3004' },
  ];

  const availableProducts = [
    { id: 'p1', code: 'P-001', name: 'Widget Premium', type: 'single' as const },
    { id: 'p2', code: 'P-002', name: 'Gadget Deluxe', type: 'single' as const },
    { id: 'p3', code: 'P-003', name: 'Tool Professional', type: 'single' as const },
  ];

  const availableProductGroups = [
    { id: 'pg1', code: 'VG-001', name: 'Elektronik' },
    { id: 'pg2', code: 'VG-002', name: 'Verktyg' },
    { id: 'pg3', code: 'VG-003', name: 'Kontorsmaterial' },
  ];

  const availableDepartments = [
    { id: 'd1', code: 'AVD-001', name: 'IT' },
    { id: 'd2', code: 'AVD-002', name: 'Försäljning' },
    { id: 'd3', code: 'AVD-003', name: 'Produktion' },
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
        };
        const label = typeLabels[value as keyof typeof typeLabels] || value;
        const colors = {
          single: 'bg-blue-100 text-blue-700',
          product_group: 'bg-green-100 text-green-700',
          department: 'bg-purple-100 text-purple-700',
        };
        const color = colors[value as keyof typeof colors] || 'bg-slate-100 text-slate-700';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {label}
          </span>
        );
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
      field: 'campaign_price',
      headerName: 'Kampanjpris',
      width: 120,
      type: 'number',
      editable: true,
      cellRenderer: (value: any, row: any) => {
        // Only show campaign price for single products
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
      field: 'sum',
      headerName: 'Summa',
      width: 120,
      type: 'number',
      editable: false,
      cellRenderer: (value: any, row: any) => {
        // Only calculate sum for single products
        if (row?.product_type !== 'single') {
          return <span className="text-slate-400">-</span>;
        }
        const campaignPrice = Number(row?.campaign_price || 0);
        const discountValue = Number(row?.discount_value || 0);
        // Apply percentage discount
        const sum = campaignPrice * (1 - discountValue / 100);
        return `${sum.toFixed(2)} kr`;
      },
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

  const getFilteredOptions = () => {
    const lowerSearch = searchTerm.toLowerCase();
    if (activeTab === 'customers') {
      return availableCustomers.filter(c =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.number.toLowerCase().includes(lowerSearch)
      );
    } else {
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
    console.log('Adding item to campaign:', item);
    setIsModalOpen(false);
    setSearchTerm('');
  };

  const tabs = [
    { id: 'customers' as TabType, label: 'Kunder', count: customers.length },
    { id: 'products' as TabType, label: 'Produkter', count: products.length },
  ];

  return (
    <div className="flex flex-col h-full">
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
                {activeTab === 'customers' ? 'Lägg till kund till kampanj' : 'Lägg till produkt till kampanj'}
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
