'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { SpreadsheetGrid, GridColumn } from './SpreadsheetGrid';
import { api } from '../services/api';

interface Product {
  id: string;
  code: string;
  name: string;
  product_group: {
    name: string;
    department: {
      name: string;
    };
  };
  purchase_price: number;
}

interface SurchargeProduct {
  id: string;
  product_id?: string;
  surcharge_id: string;
  is_active: boolean;
  product?: Product;
  // For group/department rows
  product_type?: 'single' | 'product_group' | 'department';
  product_code?: string;
  product_name?: string;
  product_group_name?: string;
  department_name?: string;
}

interface SurchargeDetailPanelProps {
  surchargeId: string;
  surchargeName: string;
}

export function SurchargeDetailPanel({ surchargeId, surchargeName }: SurchargeDetailPanelProps) {
  const [surchargeProducts, setSurchargeProducts] = useState<SurchargeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState<'single' | 'product_group' | 'department'>('single');

  // Available options for autocomplete
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allProductGroups, setAllProductGroups] = useState<any[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);

  useEffect(() => {
    loadSurchargeProducts();
    loadAvailableOptions();
  }, [surchargeId]);

  const loadSurchargeProducts = async () => {
    setLoading(true);
    try {
      const data = await api.surcharges.getProducts(surchargeId);
      setSurchargeProducts(data);
    } catch (error) {
      console.error('Error loading surcharge products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (rowId: string) => {
    try {
      // Check if it's a group/department row (they have IDs like "product_group-xxx-timestamp")
      if (rowId.startsWith('product_group-') || rowId.startsWith('department-')) {
        // Just remove from local state (no API call needed for group rows)
        setSurchargeProducts(surchargeProducts.filter(pp => pp.id !== rowId));
      } else {
        // It's a real product assignment, call API
        await api.surcharges.removeProduct(surchargeId, rowId);
        setSurchargeProducts(surchargeProducts.filter(pp => pp.product_id !== rowId));
      }
    } catch (error) {
      console.error('Error removing product from surcharge:', error);
    }
  };

  const loadAvailableOptions = async () => {
    try {
      // Load all products, product groups, and departments for the modal
      console.log('Loading available options...');
      const productsData = await api.products.getAll();
      console.log('Loaded products:', productsData.length);
      setAllProducts(productsData);

      // Extract unique product groups and departments from products
      const productGroupsMap = new Map();
      const departmentsMap = new Map();

      productsData.forEach((p: any) => {
        if (p.product_group) {
          productGroupsMap.set(p.product_group.id, {
            id: p.product_group.id,
            name: p.product_group.name,
            code: p.product_group.code,
          });

          if (p.product_group.department) {
            departmentsMap.set(p.product_group.department.id, {
              id: p.product_group.department.id,
              name: p.product_group.department.name,
              code: p.product_group.department.code,
            });
          }
        }
      });

      const productGroups = Array.from(productGroupsMap.values());
      const departments = Array.from(departmentsMap.values());

      console.log('Product groups:', productGroups.length);
      console.log('Departments:', departments.length);

      setAllProductGroups(productGroups);
      setAllDepartments(departments);
    } catch (error) {
      console.error('Error loading available options:', error);
    }
  };

  const handleAddProducts = async (type: 'single' | 'product_group' | 'department', item: any) => {
    try {
      console.log('handleAddProducts called with:', { type, item, surchargeId });

      if (type === 'single') {
        // Add single product
        const existingProductIds = surchargeProducts.map(pp => pp.product_id).filter(Boolean);
        if (existingProductIds.includes(item.id)) {
          alert('This product is already added to this surcharge');
          return;
        }

        const newAssignment = await api.surcharges.addProduct(surchargeId, item.id);
        setSurchargeProducts(prev => [...prev, newAssignment]);
      } else {
        // Add group/department as a single row (not individual products)
        const newGroupRow: SurchargeProduct = {
          id: `${type}-${item.id}-${Date.now()}`,
          surcharge_id: surchargeId,
          is_active: true,
          product_type: type,
          product_code: item.code,
          product_name: item.name,
          product_group_name: type === 'product_group' ? item.name : undefined,
          department_name: type === 'department' ? item.name : undefined,
        };

        setSurchargeProducts(prev => [...prev, newGroupRow]);
      }

      setIsModalOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding products to surcharge:', error);
      alert('Failed to add product: ' + (error as Error).message);
    }
  };

  const getFilteredItems = () => {
    const lowerSearch = searchTerm.toLowerCase();

    if (modalTab === 'single') {
      return allProducts.filter((p: any) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.code.toLowerCase().includes(lowerSearch)
      );
    } else if (modalTab === 'product_group') {
      return allProductGroups.filter((pg: any) =>
        pg.name.toLowerCase().includes(lowerSearch) ||
        pg.code.toLowerCase().includes(lowerSearch)
      );
    } else if (modalTab === 'department') {
      return allDepartments.filter((d: any) =>
        d.name.toLowerCase().includes(lowerSearch) ||
        d.code.toLowerCase().includes(lowerSearch)
      );
    }
    return [];
  };

  const columns = useMemo<GridColumn[]>(() => [
    {
      field: 'product_type',
      headerName: 'Typ',
      width: 120,
      editable: false,
      valueGetter: (row: SurchargeProduct) => row.product_type || 'single',
      cellRenderer: (value: string) => {
        const typeLabels = {
          single: 'Produkt',
          product_group: 'Varugrupp',
          department: 'Avdelning',
        };
        const label = typeLabels[value as keyof typeof typeLabels] || 'Produkt';
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
      filterTextGetter: (value: string) => {
        const typeLabels = {
          single: 'Produkt',
          product_group: 'Varugrupp',
          department: 'Avdelning',
        };
        return typeLabels[value as keyof typeof typeLabels] || 'Produkt';
      },
    },
    {
      field: 'code',
      headerName: 'Produktkod',
      width: 140,
      editable: false,
      valueGetter: (row: SurchargeProduct) => {
        if (row.product_type && row.product_type !== 'single') {
          return row.product_code || '';
        }
        return row.product?.code || '';
      },
    },
    {
      field: 'name',
      headerName: 'Namn',
      width: 250,
      editable: false,
      valueGetter: (row: SurchargeProduct) => {
        if (row.product_type && row.product_type !== 'single') {
          return row.product_name || '';
        }
        return row.product?.name || '';
      },
    },
    {
      field: 'product_group',
      headerName: 'Varugrupp',
      width: 150,
      editable: false,
      valueGetter: (row: SurchargeProduct) => {
        if (row.product_type === 'product_group') {
          return row.product_group_name || '';
        }
        return row.product?.product_group?.name || '';
      },
    },
    {
      field: 'department',
      headerName: 'Avdelning',
      width: 150,
      editable: false,
      valueGetter: (row: SurchargeProduct) => {
        if (row.product_type === 'department') {
          return row.department_name || '';
        }
        return row.product?.product_group?.department?.name || '';
      },
    },
    {
      field: 'purchase_price',
      headerName: 'Inköpspris',
      width: 120,
      type: 'number',
      editable: false,
      valueGetter: (row: SurchargeProduct) => {
        // Groups/departments don't have a single purchase price
        if (row.product_type && row.product_type !== 'single') {
          return '-';
        }
        return row.product?.purchase_price || 0;
      },
      valueFormatter: (value: any) => {
        if (value === '-') return '-';
        return `${Number(value).toFixed(2)} kr`;
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      editable: false,
      cellRenderer: (value: any, row: SurchargeProduct) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveProduct(row.product_id || row.id);
          }}
          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
          title="Ta bort"
        >
          <X className="w-4 h-4" />
        </button>
      ),
    },
  ], []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">{surchargeName}</h2>
        <p className="text-sm text-slate-600 mt-1">
          {surchargeProducts.length} produkter
        </p>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Lägg till produkt
        </button>
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-600">Laddar produkter...</p>
          </div>
        ) : (
          <SpreadsheetGrid
            columns={columns}
            data={surchargeProducts}
            height="100%"
            showFilter={true}
          />
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Lägg till produkt till påslag</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-4 border-b border-slate-200">
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setModalTab('single');
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    modalTab === 'single'
                      ? 'text-blue-700 border-b-2 border-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Produkter
                </button>
                <button
                  onClick={() => {
                    setModalTab('product_group');
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    modalTab === 'product_group'
                      ? 'text-blue-700 border-b-2 border-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Varugrupper
                </button>
                <button
                  onClick={() => {
                    setModalTab('department');
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    modalTab === 'department'
                      ? 'text-blue-700 border-b-2 border-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Avdelningar
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-200">
              <input
                type="text"
                placeholder={`Sök ${modalTab === 'single' ? 'produkt' : modalTab === 'product_group' ? 'varugrupp' : 'avdelning'} (kod eller namn)...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
              {getFilteredItems().length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-600">
                    {searchTerm ? 'Inga resultat hittades' : `Inga ${modalTab === 'single' ? 'produkter' : modalTab === 'product_group' ? 'varugrupper' : 'avdelningar'} tillgängliga`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredItems().map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddProducts(modalTab, item)}
                      className="w-full p-3 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Kod: {item.code}
                        {modalTab === 'single' && item.product_group && (
                          <> | Varugrupp: {item.product_group.name}</>
                        )}
                        {modalTab === 'single' && item.purchase_price && (
                          <> | Inköpspris: {Number(item.purchase_price).toFixed(2)} kr</>
                        )}
                        {modalTab === 'product_group' && (
                          <> | {allProducts.filter((p: any) => p.product_group?.id === item.id).length} produkter</>
                        )}
                        {modalTab === 'department' && (
                          <> | {allProducts.filter((p: any) => p.product_group?.department?.id === item.id).length} produkter</>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
