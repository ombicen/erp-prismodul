'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { SpreadsheetGrid, GridColumn } from '../components/SpreadsheetGrid';
import { PanelLayout } from '../components/PanelLayout';
import { DetailsTabs } from '../components/DetailsTabs';
import { Package } from 'lucide-react';
import { api } from '../services/api';

interface ProductRow {
  id: string;
  code: string;
  name: string;
  product_group_id: string;
  purchase_price: number;
  sync_status: string;
  last_sync: string | null;
  created_at: string;
  department_name?: string;
  product_group_name?: string;
}

interface ProductSupplier {
  id: string;
  supplier_id: string;
  supplier_name: string;
  base_price: number;
  freight_cost: number;
  discount_type: '%' | 'KR';
  discount_value: number;
  is_primary: boolean;
}

interface OtherCost {
  id: string;
  name: string;
  cost_type: '%' | 'KR';
  cost_value: number;
  is_active: boolean;
}

export function ProductsView() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBottomOpen, setIsBottomOpen] = useState(false);

  // Supplier state for Kalkylpris editor
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // Other costs state
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([]);

  useEffect(() => {
    loadProducts();
    loadOtherCosts();
  }, []);

  // Load product suppliers when a product is selected
  useEffect(() => {
    if (selectedProduct && isBottomOpen) {
      loadProductSuppliers(selectedProduct.id);
    }
  }, [selectedProduct, isBottomOpen]);

  const loadOtherCosts = async () => {
    try {
      const data = await api.otherCosts.getAll();
      setOtherCosts(data.filter((cost: OtherCost) => cost.is_active));
    } catch (error) {
      console.error('Error loading other costs:', error);
    }
  };

  const loadProductSuppliers = async (productId: string) => {
    try {
      const data = await api.productSuppliers.getByProduct(productId);
      setProductSuppliers(data);
      // Set the primary supplier as selected by default
      const primary = data.find((ps: ProductSupplier) => ps.is_primary);
      if (primary) {
        setSelectedSupplierId(primary.id);
      } else if (data.length > 0) {
        setSelectedSupplierId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading product suppliers:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsData = await api.products.getAll();

      const enrichedProducts = productsData.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        product_group_id: p.product_group_id,
        purchase_price: p.purchase_price,
        sync_status: p.sync_status,
        last_sync: p.last_sync,
        created_at: p.created_at,
        product_group_name: p.product_group?.name || '',
        department_name: p.product_group?.department?.name || '',
      }));

      setProducts(enrichedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate slutpris for each supplier
  const suppliersWithSlutpris = useMemo(() => {
    return productSuppliers.map(supplier => {
      let rabattAmount = 0;
      if (supplier.discount_type === '%') {
        rabattAmount = supplier.base_price * (supplier.discount_value / 100);
      } else {
        rabattAmount = supplier.discount_value;
      }
      const slutpris = supplier.base_price + supplier.freight_cost - rabattAmount;
      return { ...supplier, slutpris };
    });
  }, [productSuppliers]);

  // Get selected supplier for cost summary
  const selectedSupplier = suppliersWithSlutpris.find(s => s.id === selectedSupplierId);

  // Handle cell value changes for supplier grid
  const handleSupplierCellChange = useCallback(async (rowId: string, field: string, newValue: any) => {
    setProductSuppliers(prev => prev.map(supplier => {
      if (supplier.id === rowId) {
        return { ...supplier, [field]: newValue };
      }
      return supplier;
    }));

    // Update in database
    try {
      await api.productSuppliers.update(rowId, { [field]: newValue });
    } catch (error) {
      console.error('Error updating product supplier:', error);
    }
  }, []);

  // Handle cell value changes for other costs grid
  const handleOtherCostCellChange = useCallback((rowId: string, field: string, newValue: any) => {
    setOtherCosts(prev => prev.map(cost => {
      if (cost.id === rowId) {
        return { ...cost, [field]: newValue };
      }
      return cost;
    }));
  }, []);

  // Calculate other costs with computed amounts
  const otherCostsWithAmounts = useMemo(() => {
    if (!selectedSupplier) {
      return otherCosts.map(cost => ({ ...cost, computed_amount: 0 }));
    }

    return otherCosts.map(cost => {
      let computed_amount = 0;
      if (cost.cost_type === '%') {
        computed_amount = selectedSupplier.slutpris * (cost.cost_value / 100);
      } else {
        computed_amount = cost.cost_value;
      }
      return { ...cost, computed_amount };
    });
  }, [otherCosts, selectedSupplier]);

  // Calculate total other costs
  const totalOtherCosts = useMemo(() => {
    return otherCostsWithAmounts.reduce((sum, cost) => sum + cost.computed_amount, 0);
  }, [otherCostsWithAmounts]);

  // Automatically update purchase price when calculated price changes
  useEffect(() => {
    const updatePurchasePrice = async () => {
      if (selectedProduct && selectedSupplier) {
        const calculatedPrice = selectedSupplier.slutpris + totalOtherCosts;

        // Only update if the price has changed significantly (to avoid floating point issues)
        if (Math.abs(calculatedPrice - selectedProduct.purchase_price) > 0.01) {
          try {
            // Update in database
            await api.products.update(selectedProduct.id, {
              purchase_price: calculatedPrice,
            });

            // Update local state
            setProducts(prev => prev.map(p =>
              p.id === selectedProduct.id
                ? { ...p, purchase_price: calculatedPrice }
                : p
            ));

            // Update selected product
            setSelectedProduct(prev =>
              prev ? { ...prev, purchase_price: calculatedPrice } : null
            );
          } catch (error) {
            console.error('Error updating purchase price:', error);
          }
        }
      }
    };

    updatePurchasePrice();
  }, [selectedSupplier, totalOtherCosts, selectedProduct]);

  const otherCostsColumns = useMemo<GridColumn[]>(() => [
    {
      field: 'name',
      headerName: 'Kostnadstyp',
      width: 200,
      editable: true,
    },
    {
      field: 'cost_type',
      headerName: 'Typ',
      width: 120,
      editable: false,
      cellRenderer: (value: any, row: any) => {
        return (
          <select
            value={value}
            onChange={(e) => handleOtherCostCellChange(row.id, 'cost_type', e.target.value as '%' | 'KR')}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full px-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="%">Procent (%)</option>
            <option value="KR">Kronor (KR)</option>
          </select>
        );
      },
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',
    },
    {
      field: 'cost_value',
      headerName: 'Värde',
      width: 140,
      type: 'number',
      editable: true,
      cellRenderer: (value: any, row: any) => {
        return row.cost_type === '%' ? `${value}%` : `${value} kr`;
      },
      filterTextGetter: (value: any, row: any) => {
        return row.cost_type === '%' ? `${value}%` : `${value} kr`;
      },
    },
    {
      field: 'computed_amount',
      headerName: 'Belopp',
      width: 140,
      type: 'number',
      editable: false,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
    },
  ], [handleOtherCostCellChange]);

  const supplierColumns = useMemo<GridColumn[]>(() => [
    {
      field: 'selected',
      headerName: 'Välj',
      width: 80,
      editable: false,
      cellRenderer: (_value: any, row: any) => {
        return (
          <div className="flex items-center justify-center h-full">
            <input
              type="radio"
              name="selectedSupplier"
              checked={selectedSupplierId === row.id}
              onChange={async () => {
                setSelectedSupplierId(row.id);

                // Update product's purchase price based on selected supplier
                if (selectedProduct) {
                  const supplier = suppliersWithSlutpris.find(s => s.id === row.id);
                  if (supplier) {
                    const newPurchasePrice = supplier.slutpris + totalOtherCosts;

                    // Update local state
                    setProducts(prev => prev.map(p =>
                      p.id === selectedProduct.id
                        ? { ...p, purchase_price: newPurchasePrice }
                        : p
                    ));

                    // Set as primary supplier in database
                    try {
                      await api.productSuppliers.setPrimary(selectedProduct.id, row.supplier_id);
                    } catch (error) {
                      console.error('Error setting primary supplier:', error);
                    }
                  }
                }
              }}
              className="w-4 h-4 text-blue-600 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      },
    },
    {
      field: 'supplier_name',
      headerName: 'Leverantör',
      width: 200,
      editable: false,
    },
    {
      field: 'base_price',
      headerName: 'Baspris',
      width: 120,
      type: 'number',
      editable: true,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
    },
    {
      field: 'freight_cost',
      headerName: 'Frakt',
      width: 120,
      editable: false,
      cellRenderer: (value: any, row: any) => {
        return (
          <select
            value={value}
            onChange={(e) => handleSupplierCellChange(row.id, 'freight_cost', parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full px-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="0">0 kr</option>
            <option value="5">5 kr</option>
            <option value="8">8 kr</option>
            <option value="10">10 kr</option>
            <option value="15">15 kr</option>
            <option value="20">20 kr</option>
            <option value="25">25 kr</option>
            <option value="30">30 kr</option>
          </select>
        );
      },
      filterTextGetter: (value: any) => `${value} kr`,
    },
    {
      field: 'discount_type',
      headerName: 'Rabattyp',
      width: 120,
      editable: false,
      cellRenderer: (value: any, row: any) => {
        return (
          <select
            value={value}
            onChange={(e) => handleSupplierCellChange(row.id, 'discount_type', e.target.value as '%' | 'KR')}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full px-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="%">Procent (%)</option>
            <option value="KR">Kronor (KR)</option>
          </select>
        );
      },
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',
    },
    {
      field: 'discount_value',
      headerName: 'Rabattmängd',
      width: 140,
      type: 'number',
      editable: true,
      cellRenderer: (value: any, row: any) => {
        return row.discount_type === '%' ? `${value}%` : `${value} kr`;
      },
      filterTextGetter: (value: any, row: any) => {
        return row.discount_type === '%' ? `${value}%` : `${value} kr`;
      },
    },
    {
      field: 'slutpris',
      headerName: 'Slutpris',
      width: 140,
      type: 'number',
      editable: false,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
    },
  ], [selectedSupplierId, handleSupplierCellChange]);

  const columns = useMemo<GridColumn[]>(() => [
    {
      field: 'code',
      headerName: 'Produktkod',
      width: 140,
      editable: false,
    },
    {
      field: 'name',
      headerName: 'Namn',
      width: 300,
      editable: false,
    },
    {
      field: 'product_group_name',
      headerName: 'Varugrupp',
      width: 180,
      editable: false,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'department_name',
      headerName: 'Avdelning',
      width: 150,
      editable: false,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'purchase_price',
      headerName: 'Inköpspris',
      width: 140,
      type: 'number',
      editable: false,
      valueFormatter: (value) => {
        if (value == null) return '-';
        return `${Number(value).toLocaleString('sv-SE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} kr`;
      },
    },
    {
      field: 'sync_status',
      headerName: 'Synkstatus',
      width: 140,
      editable: false,
      fixed: true,
      cellRenderer: (value, row) => {
        const raw = (value ?? '').toString();
        const status = raw.toLowerCase();
        const lastSync = row.last_sync ? formatDate(row.last_sync) : '';

        const map = {
          green: {
            badge: 'bg-green-100 text-green-700 ring-green-200',
            dot: 'bg-green-600',
          },
          orange: {
            badge: 'bg-amber-100 text-amber-700 ring-amber-200',
            dot: 'bg-amber-600',
          },
          red: {
            badge: 'bg-rose-100 text-rose-700 ring-rose-200',
            dot: 'bg-rose-600',
          },
          gray: {
            badge: 'bg-slate-100 text-slate-700 ring-slate-200',
            dot: 'bg-slate-500',
          },
        } as const;

        const colorKey = (
          status === 'synced' || status === 'success' || status === 'ok'
            ? 'green'
            : status === 'pending' || status === 'in_progress' || status === 'queued' || status === 'warning'
            ? 'orange'
            : status === 'failed' || status === 'error' || status === 'unsynced'
            ? 'red'
            : 'gray'
        ) as keyof typeof map;

        const classes = map[colorKey];
        const label = raw.charAt(0).toUpperCase() + raw.slice(1);

        const tooltip = lastSync ? `Senast synk: ${lastSync}` : undefined;

        return (
          <div className="flex items-center" title={tooltip}>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${classes.badge}`}>
              <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
              {label}
            </span>
          </div>
        );
      },
      filterTextGetter: (value, row) => {
        const status = (value ?? '').toString();
        const lastSync = row.last_sync ? formatDate(row.last_sync) : '';
        return lastSync ? `${status} ${lastSync}` : status;
      },
    },
  ], []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Laddar produkter...</p>
        </div>
      </div>
    );
  }

  const handleCellClick = (row: ProductRow, field: string) => {
    console.log('Cell clicked:', row, field);
    setSelectedProduct(row);

    // If clicking on purchase_price (Inköpspris), open only bottom panel
    if (field === 'purchase_price') {
      console.log('Opening bottom panel for Inköpspris');
      setIsBottomOpen(true);
      // Don't open details panel when clicking purchase_price
    } else {
      // For other cells, just open details panel
      setIsDetailsOpen(true);
    }
  };

  const mainPanel = (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Produkter</h1>
              <p className="text-sm text-slate-600">Baslista - global produktkatalog</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              Ny produkt
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <SpreadsheetGrid
          columns={columns}
          data={products}
          height="calc(100vh - 180px)"
          onCellClicked={handleCellClick}
        />
      </div>
    </div>
  );

  const detailsPanel = selectedProduct && (
    <div className="flex flex-col h-full">
      {/* Product Info Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-row sm:flex-row sm:items-center sm:justify-start gap-8">
          <div className="flex flex-col sm:flex-col sm:items-start sm:justify-between gap-1">
            <h3 className="text-xs font-medium text-slate-500">Produktkod</h3>
            <p className="text-sm font-thin">{selectedProduct.code}</p>
          </div>
          <div className="flex flex-col sm:flex-col sm:items-start sm:justify-between gap-1">
            <h3 className="text-xs font-medium text-slate-500">Namn</h3>
            <p className="text-sm font-thin  ">{selectedProduct.name}</p>
          </div>
   
            <div className="flex flex-col sm:flex-col sm:items-start sm:justify-between gap-1">
              <h3 className="text-xs font-medium text-slate-500">Varugrupp</h3>
              <p className="text-sm font-thin  ">{selectedProduct.product_group_name || '-'}</p>
            </div>
            <div className="flex flex-col sm:flex-col sm:items-start sm:justify-between gap-1">
              <h3 className="text-xs font-medium text-slate-500">Inköpspris</h3>
              <p className="text-sm font-thin">
                {Number(selectedProduct.purchase_price).toLocaleString('sv-SE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} kr
              </p>
            </div>
      
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 overflow-hidden">
        <DetailsTabs
          productId={selectedProduct.id}
          productName={selectedProduct.name}
        />
      </div>
    </div>
  );

  const bottomPanel = selectedProduct && (
    <div className="flex h-full overflow-x-hidden overflow-y-auto min-h-96">
      {/* Left side: Supplier Grid and Other Costs */}
      <div className="flex-1 flex flex-col max-w-[1300px] ">
      

        {/* Supplier Grid */}
         <div className="overflow-hidden">
          <SpreadsheetGrid
            columns={supplierColumns}
            data={suppliersWithSlutpris}
            height="100%"
            showFilter={false}
            onCellValueChanged={handleSupplierCellChange}
          />
        </div>

        {/* Other Costs Grid */}
        <div className="overflow-hidden">
       
          <SpreadsheetGrid
            columns={otherCostsColumns}
            data={otherCostsWithAmounts}
            height="100%"
            showFilter={false}
            onCellValueChanged={handleOtherCostCellChange}
          />
        </div>
      </div>

      {/* Right side: Compact Cost Summary */}
      <div className="w-full flex flex-1 flex-col border-l border-slate-200 bg-slate-50 p-4 overflow-auto flex-shrink-0">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Kostnadssammanfattning</h3>

        {selectedSupplier ? (
          <div className="space-y-3">
            {/* Supplier */}
            <div className="bg-white rounded p-3 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Leverantör</div>
              <div className="text-sm font-semibold text-slate-900">{selectedSupplier.supplier_name}</div>
            </div>

            {/* Breakdown */}
            <div className="bg-white rounded p-3 shadow-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Baspris</span>
                <span className="font-medium">{selectedSupplier.base_price.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Frakt</span>
                <span className="font-medium">+ {selectedSupplier.freight_cost.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rabatt</span>
                <span className="font-medium text-red-600">
                  - {selectedSupplier.discount_type === '%'
                    ? (selectedSupplier.base_price * (selectedSupplier.discount_value / 100)).toFixed(2)
                    : selectedSupplier.discount_value.toFixed(2)
                  } kr
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700">Slutpris</span>
                  <span className="text-slate-900">{selectedSupplier.slutpris.toFixed(2)} kr</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-2 space-y-1">
                <div className="text-xs font-semibold text-slate-700 mb-1">Övriga Kostnader:</div>
                {otherCostsWithAmounts.map(cost => (
                  <div key={cost.id} className="flex justify-between text-xs">
                    <span className="text-slate-600">
                      {cost.name} {cost.cost_type === '%' ? `(${cost.cost_value}%)` : ''}
                    </span>
                    <span className="font-medium">+ {cost.computed_amount.toFixed(2)} kr</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-700 font-medium">Totalt övriga</span>
                  <span className="font-medium">+ {totalOtherCosts.toFixed(2)} kr</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Totalt Inköpspris</span>
                  <span className="text-lg font-bold text-blue-600">
                    {(selectedSupplier.slutpris + totalOtherCosts).toFixed(2)} kr
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Välj en leverantör</div>
        )}
      </div>
    </div>
  );

  return (
    <PanelLayout
      mainPanel={mainPanel}
      detailsPanel={detailsPanel}
      bottomPanel={bottomPanel}
      isDetailsOpen={isDetailsOpen}
      isBottomOpen={isBottomOpen}
      onCloseDetails={() => setIsDetailsOpen(false)}
      onCloseBottom={() => setIsBottomOpen(false)}
    />
  );
}
