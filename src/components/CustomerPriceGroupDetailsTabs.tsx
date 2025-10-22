'use client';

import { useState, useEffect } from 'react';
import { SpreadsheetGrid, GridColumn } from './SpreadsheetGrid';
import { Plus, X } from 'lucide-react';
import { api } from '../services/api';

interface PriceGroupCustomer {
  id: string;
  customer_name: string;
  customer_number: string;
  contact_person: string;
  email: string;
  added_date: string;
}

interface PriceGroupProduct {
  id: string;
  product_id?: string;
  product_code: string;
  product_name: string;
  product_type: 'single' | 'product_group' | 'department' | 'all';
  product_group_name?: string;
  department_name?: string;
  purchase_price?: number;
  price_group_price?: number; // Only for single products
  discount_type: '%' | 'KR'; // For categories: type of discount
  discount_value: number; // For single: %, for categories: % or KR based on discount_type
  margin_percentage?: number; // TG (täckningsgrad) value
  net_price?: number; // Summa (net price after discount)
  valid_from: string;
  valid_to: string;
}

interface CustomerPriceGroupDetailsTabsProps {
  priceGroupId: string;
  priceGroupName: string;
}

type TabType = 'customers' | 'products';

export function CustomerPriceGroupDetailsTabs({
  priceGroupId,
  priceGroupName,
}: CustomerPriceGroupDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProductTab, setModalProductTab] = useState<'single' | 'product_group' | 'department'>('single');

  // Sample data - replace with API calls
  const [customers, setCustomers] = useState<PriceGroupCustomer[]>([
    {
      id: '1',
      customer_name: 'Retail Store AB',
      customer_number: 'C-2001',
      contact_person: 'Lisa Andersson',
      email: 'lisa@retailstore.se',
      added_date: '2024-02-01',
    },
    {
      id: '2',
      customer_name: 'Wholesale Partners',
      customer_number: 'C-2002',
      contact_person: 'John Smith',
      email: 'john@wholesale.se',
      added_date: '2024-03-15',
    },
  ]);

  const toNumber = (value: any, fallback = 0) => {
    if (value == null || value === '') return fallback;
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(num) ? num : fallback;
  };

  const roundTo = (value: number, decimals: number) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  };

  const hydrateProduct = (product: PriceGroupProduct): PriceGroupProduct => {
    if (product.product_type !== 'single') {
      return product;
    }

    const purchasePrice = toNumber(product.purchase_price, 0);
    const priceGroupPrice = toNumber(product.price_group_price, 0);

    // For customer price groups, Summa = Utpris (no discount)
    const calculatedNet = priceGroupPrice;
    const calculatedMargin = priceGroupPrice > 0
      ? ((priceGroupPrice - purchasePrice) / priceGroupPrice) * 100
      : 0;

    return {
      ...product,
      purchase_price: roundTo(purchasePrice, 2),
      price_group_price: roundTo(priceGroupPrice, 2),
      net_price: product.net_price != null
        ? roundTo(product.net_price, 2)
        : roundTo(calculatedNet, 2),
      margin_percentage: product.margin_percentage != null
        ? roundTo(product.margin_percentage, 1)
        : roundTo(calculatedMargin, 1),
    };
  };

  const [products, setProducts] = useState<PriceGroupProduct[]>([]);

  useEffect(() => {
    console.log('CustomerPriceGroupDetailsTabs mounted, priceGroupId:', priceGroupId);
    if (priceGroupId) {
      loadProducts();
    }
  }, [priceGroupId]);

  const loadProducts = async () => {
    try {
      console.log('Loading products for price group:', priceGroupId);
      const data = await api.customerPriceGroups.getProducts(priceGroupId);
      console.log('Loaded products:', data);
      setProducts(data.map(hydrateProduct));
    } catch (error) {
      console.error('Error loading price group products:', error);
    }
  };

  const handleProductCellValueChange = async (rowId: string, field: string, rawValue: any) => {
    setProducts(prev =>
      prev.map(product => {
        if (product.id !== rowId) {
          return product;
        }

        // Allow direct updates for non-single product rows without recalculation.
        if (product.product_type !== 'single') {
          const updated = {
            ...product,
            [field]: rawValue,
          };
          // Save to API asynchronously
          api.customerPriceGroups.updateProduct(priceGroupId, rowId, { [field]: rawValue })
            .catch(error => console.error('Error updating price group product:', error));
          return updated;
        }

        const purchasePrice = toNumber(product.purchase_price, 0);

        let priceGroupPrice = toNumber(product.price_group_price, 0);
        let marginPercentage = toNumber(product.margin_percentage, 0);
        let netPrice = toNumber(product.net_price, 0);

        // For customer price groups: Summa = Utpris (no discount)
        if (field === 'price_group_price') {
          priceGroupPrice = toNumber(rawValue, priceGroupPrice);
          netPrice = priceGroupPrice; // Summa = Utpris
          marginPercentage = priceGroupPrice > 0
            ? ((priceGroupPrice - purchasePrice) / priceGroupPrice) * 100
            : 0;
        } else if (field === 'margin_percentage') {
          marginPercentage = toNumber(rawValue, marginPercentage);
          const clampedMargin = Math.min(marginPercentage, 99.9);
          const marginDenominator = 1 - clampedMargin / 100;
          priceGroupPrice = marginDenominator <= 0
            ? purchasePrice
            : purchasePrice / marginDenominator;
          netPrice = priceGroupPrice; // Summa = Utpris
          marginPercentage = clampedMargin;
        } else if (field === 'net_price') {
          netPrice = toNumber(rawValue, netPrice);
          priceGroupPrice = netPrice; // Utpris = Summa
          marginPercentage = priceGroupPrice > 0
            ? ((priceGroupPrice - purchasePrice) / priceGroupPrice) * 100
            : 0;
        } else {
          // For other fields like valid_from, valid_to
          const updated = { ...product, [field]: rawValue };
          api.customerPriceGroups.updateProduct(priceGroupId, rowId, { [field]: rawValue })
            .catch(error => console.error('Error updating price group product:', error));
          return updated;
        }

        const normalizedPrice = roundTo(priceGroupPrice, 2);
        const normalizedNet = roundTo(netPrice, 2);
        const normalizedMargin = roundTo(marginPercentage, 1);

        const updated = {
          ...product,
          price_group_price: normalizedPrice,
          margin_percentage: normalizedMargin,
          net_price: normalizedNet,
        };

        // Save to API
        api.customerPriceGroups.updateProduct(priceGroupId, rowId, {
          price_group_price: normalizedPrice,
          margin_percentage: normalizedMargin,
          net_price: normalizedNet,
        }).catch(error => console.error('Error updating price group product:', error));

        return updated;
      })
    );
  };

  // Autocomplete options - load real data
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableProductGroups, setAvailableProductGroups] = useState<any[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);

  const availableCustomers = [
    { id: 'c1', name: 'Retail Store AB', number: 'C-2001' },
    { id: 'c2', name: 'Wholesale Partners', number: 'C-2002' },
    { id: 'c3', name: 'Corporate Client', number: 'C-2003' },
    { id: 'c4', name: 'VIP Customer', number: 'C-2004' },
  ];

  useEffect(() => {
    // Load products, product groups, and departments
    const loadAutocompleteData = async () => {
      try {
        const [productsData, productGroupsData, departmentsData] = await Promise.all([
          api.products.getAll(),
          api.productGroups.getAll(),
          api.departments.getAll(),
        ]);
        setAvailableProducts(productsData);
        setAvailableProductGroups(productGroupsData);
        setAvailableDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading autocomplete data:', error);
      }
    };
    loadAutocompleteData();
  }, []);

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
      valueGetter: (row: PriceGroupProduct) => row.product_type || 'single',
      cellRenderer: (value: string) => {
        const typeLabels = {
          single: 'Produkt',
          product_group: 'Varugrupp',
          department: 'Avdelning',
          all: 'Hela sortimentet',
        };
        const label = typeLabels[value as keyof typeof typeLabels] || value;
        const colors = {
          single: 'bg-blue-100 text-blue-700',
          product_group: 'bg-green-100 text-green-700',
          department: 'bg-purple-100 text-purple-700',
          all: 'bg-amber-100 text-amber-700',
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
          all: 'Hela sortimentet',
        };
        return typeLabels[value as keyof typeof typeLabels] || 'Produkt';
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
      field: 'purchase_price',
      headerName: 'Inköpspris',
      width: 120,
      type: 'number',
      editable: false,
      cellRenderer: (value: any, row: any) => {
        if (row?.product_type !== 'single' || value == null) {
          return <span className="text-slate-400">-</span>;
        }
        return `${Number(value || 0).toFixed(2)} kr`;
      },
    },
    {
      field: 'price_group_price',
      headerName: 'Utpris',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value: any) =>
        value == null ? '-' : `${Number(value).toFixed(2)} kr`,
    },
    {
      field: 'margin_percentage',
      headerName: 'TG',
      width: 90,
      type: 'number',
      editable: true,
      valueFormatter: (value: any) =>
        value == null ? '-' : `${Number(value).toFixed(1)} %`,
    },
    {
      field: 'net_price',
      headerName: 'Summa',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value: any) =>
        value == null ? '-' : `${Number(value).toFixed(2)} kr`,
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

  const handleAddItem = async (type: 'single' | 'product_group' | 'department', item: any) => {
    console.log('Adding item to price group:', { type, item });

    if (activeTab === 'products') {
      try {
        const payload: any = {
          product_type: type,
          discount_type: '%',
          discount_value: 0,
          valid_from: new Date().toISOString().split('T')[0],
          valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        };

        if (type === 'single') {
          payload.product_id = item.id;
          payload.price_group_price = item.purchase_price || 0;
          payload.margin_percentage = 0;
          payload.net_price = item.purchase_price || 0;
        } else if (type === 'product_group') {
          payload.product_group_id = item.id;
        } else if (type === 'department') {
          payload.department_id = item.id;
        }

        await api.customerPriceGroups.addProduct(priceGroupId, payload);
        await loadProducts();
      } catch (error) {
        console.error('Error adding product to price group:', error);
      }
    }

    setIsModalOpen(false);
    setSearchTerm('');
  };

  const handleAddEntireAssortment = async () => {
    try {
      const payload = {
        product_type: 'all',
        discount_type: '%',
        discount_value: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      };

      await api.customerPriceGroups.addProduct(priceGroupId, payload);
      await loadProducts();
    } catch (error) {
      console.error('Error adding entire assortment:', error);
    }

    setIsModalOpen(false);
    setSearchTerm('');
  };

  const tabs = [
    { id: 'products' as TabType, label: 'Produkter', count: products.length },
    { id: 'customers' as TabType, label: 'Kunder', count: customers.length },
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
            onCellValueChanged={handleProductCellValueChange}
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
                {activeTab === 'customers' ? 'Lägg till kund till prisgrupp' : 'Lägg till produkt till prisgrupp'}
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
                <>
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

                  {/* Add entire assortment button */}
                  <button
                    onClick={handleAddEntireAssortment}
                    className="w-full mb-4 px-4 py-3 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Lägg till hela sortimentet
                  </button>
                </>
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
                        onClick={() => handleAddItem(modalProductTab, option)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {option.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {option.code || option.number}
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
