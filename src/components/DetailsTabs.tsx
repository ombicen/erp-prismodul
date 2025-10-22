'use client';

import { useState, useMemo } from 'react';
import { SpreadsheetGrid, GridColumn } from './SpreadsheetGrid';
import { Plus, X } from 'lucide-react';

interface CustomerPriceGroup {
  id: string;
  group_name: string;
  price: number;
  discount_type: '%' | 'KR';
  discount_percent: number;
  valid_from: string;
  valid_to: string;
}

interface Contract {
  id: string;
  contract_number: string;
  customer_name: string;
  price: number;
  discount_type: '%' | 'KR';
  discount_percent: number;
  quantity: number;
  valid_from: string;
  valid_to: string;
}

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_price: number;
  discount_type: '%' | 'KR';
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
      discount_type: '%',
      discount_percent: 10,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
    },
    {
      id: '2',
      group_name: 'Återförsäljare',
      price: 130.00,
      discount_type: '%',
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
      discount_type: '%',
      discount_percent: 15,
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
      discount_type: '%',
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

  // Compute price groups with sum values
  const priceGroupsWithSum = useMemo(() => {
    const result = priceGroups.map(pg => {
      let sum: number;
      if (pg.discount_type === '%') {
        sum = pg.price * (1 - pg.discount_percent / 100);
      } else {
        // KR - fixed amount discount
        sum = pg.price - pg.discount_percent;
      }
      return {
        ...pg,
        sum: sum,
      };
    });
    console.log('priceGroupsWithSum recalculated:', result);
    return result;
  }, [priceGroups]);

  const handlePriceGroupCellChange = (rowId: string, field: string, value: any) => {
    setPriceGroups(prev => prev.map(pg => {
      if (pg.id !== rowId) return pg;

      // If sum is edited, recalculate discount based on discount type
      if (field === 'sum') {
        const newSum = Number(value);
        const price = pg.price;

        if (pg.discount_type === '%') {
          // sum = price * (1 - discount/100)
          // discount = (1 - sum/price) * 100
          const newDiscount = price > 0 ? ((1 - newSum / price) * 100) : 0;
          return { ...pg, discount_percent: Math.max(0, Math.min(100, newDiscount)) };
        } else {
          // KR - fixed amount discount
          // sum = price - discount
          // discount = price - sum
          const newDiscount = price - newSum;
          return { ...pg, discount_percent: Math.max(0, newDiscount) };
        }
      }

      return { ...pg, [field]: value };
    }));
  };

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
      field: 'discount_type',
      headerName: 'Rabattyp',
      width: 100,
      editable: false,
      cellRenderer: (value: any, row: any) => {
        return (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full flex items-center"
          >
            <select
              value={value || '%'}
              onChange={(e) => {
                const newType = e.target.value as '%' | 'KR';
                setPriceGroups(prev => prev.map(p => {
                  if (p.id === row?.id) {
                    return { ...p, discount_type: newType };
                  }
                  return p;
                }));
              }}
              className="w-full h-full px-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="%">%</option>
              <option value="KR">KR</option>
            </select>
          </div>
        );
      },
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',
    },
    {
      field: 'discount_percent',
      headerName: 'Rabatt',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)}`,
    },
    {
      field: 'sum',
      headerName: 'Summa',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
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

  // Compute contracts with sum values
  const contractsWithSum = useMemo(() => {
    const result = contracts.map(c => {
      let sum: number;
      if (c.discount_type === '%') {
        sum = c.price * (1 - c.discount_percent / 100);
      } else {
        // KR - fixed amount discount
        sum = c.price - c.discount_percent;
      }
      return {
        ...c,
        sum: sum,
      };
    });
    console.log('contractsWithSum recalculated:', result);
    return result;
  }, [contracts]);

  const handleContractCellChange = (rowId: string, field: string, value: any) => {
    setContracts(prev => prev.map(c => {
      if (c.id !== rowId) return c;

      // If sum is edited, recalculate discount based on discount type
      if (field === 'sum') {
        const newSum = Number(value);
        const price = c.price;

        if (c.discount_type === '%') {
          // sum = price * (1 - discount/100)
          // discount = (1 - sum/price) * 100
          const newDiscount = price > 0 ? ((1 - newSum / price) * 100) : 0;
          return { ...c, discount_percent: Math.max(0, Math.min(100, newDiscount)) };
        } else {
          // KR - fixed amount discount
          // sum = price - discount
          // discount = price - sum
          const newDiscount = price - newSum;
          return { ...c, discount_percent: Math.max(0, newDiscount) };
        }
      }

      return { ...c, [field]: value };
    }));
  };

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
      field: 'discount_type',
      headerName: 'Rabattyp',
      width: 100,
      editable: false,
      cellRenderer: (value: any, row: any) => {
        return (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full flex items-center"
          >
            <select
              value={value || '%'}
              onChange={(e) => {
                const newType = e.target.value as '%' | 'KR';
                setContracts(prev => prev.map(c => {
                  if (c.id === row?.id) {
                    return { ...c, discount_type: newType };
                  }
                  return c;
                }));
              }}
              className="w-full h-full px-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="%">%</option>
              <option value="KR">KR</option>
            </select>
          </div>
        );
      },
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',
    },
    {
      field: 'discount_percent',
      headerName: 'Rabatt',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)}`,
    },
    {
      field: 'sum',
      headerName: 'Summa',
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

  // Compute campaigns with sum values
  const campaignsWithSum = useMemo(() => {
    const result = campaigns.map(c => {
      let sum: number;
      if (c.discount_type === '%') {
        sum = c.campaign_price * (1 - c.discount_percent / 100);
      } else {
        // KR - fixed amount discount
        sum = c.campaign_price - c.discount_percent;
      }
      return {
        ...c,
        sum: sum,
      };
    });
    console.log('campaignsWithSum recalculated:', result);
    return result;
  }, [campaigns]);

  const handleCampaignCellChange = (rowId: string, field: string, value: any) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== rowId) return c;

      // If sum is edited, recalculate discount based on discount type
      if (field === 'sum') {
        const newSum = Number(value);
        const campaignPrice = c.campaign_price;

        if (c.discount_type === '%') {
          // sum = campaignPrice * (1 - discount/100)
          // discount = (1 - sum/campaignPrice) * 100
          const newDiscount = campaignPrice > 0 ? ((1 - newSum / campaignPrice) * 100) : 0;
          return { ...c, discount_percent: Math.max(0, Math.min(100, newDiscount)) };
        } else {
          // KR - fixed amount discount
          // sum = campaignPrice - discount
          // discount = campaignPrice - sum
          const newDiscount = campaignPrice - newSum;
          return { ...c, discount_percent: Math.max(0, newDiscount) };
        }
      }

      return { ...c, [field]: value };
    }));
  };

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
      field: 'discount_type',
      headerName: 'Rabattyp',
      width: 100,
      editable: false,
      cellRenderer: (value: any, row: any) => {
        return (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full flex items-center"
          >
            <select
              value={value || '%'}
              onChange={(e) => {
                const newType = e.target.value as '%' | 'KR';
                setCampaigns(prev => prev.map(c => {
                  if (c.id === row?.id) {
                    return { ...c, discount_type: newType };
                  }
                  return c;
                }));
              }}
              className="w-full h-full px-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="%">%</option>
              <option value="KR">KR</option>
            </select>
          </div>
        );
      },
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',
    },
    {
      field: 'discount_percent',
      headerName: 'Rabatt',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)}`,
    },
    {
      field: 'sum',
      headerName: 'Summa',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
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
        <div className="flex items-center justify-between">
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
            data={priceGroupsWithSum}
            height="100%"
            showFilter={true}
            onCellValueChanged={handlePriceGroupCellChange}
          />
        )}
        {activeTab === 'contracts' && (
          <SpreadsheetGrid
            columns={contractColumns}
            data={contractsWithSum}
            height="100%"
            showFilter={true}
            onCellValueChanged={handleContractCellChange}
          />
        )}
        {activeTab === 'campaigns' && (
          <SpreadsheetGrid
            columns={campaignColumns}
            data={campaignsWithSum}
            height="100%"
            showFilter={true}
            onCellValueChanged={handleCampaignCellChange}
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
