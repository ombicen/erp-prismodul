'use client';

import { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/DataTable';
import { PanelLayout } from '../components/PanelLayout';
import { DollarSign, Plus } from 'lucide-react';
import { api } from '../services/api';

interface PriceRow {
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
  discount_type?: string;
  discount_value?: number;
  quantity_threshold?: number;
  excluded?: boolean;
  calculated_price?: number;
  margin_percentage?: number;
}

interface ContextualPriceViewProps {
  contextType: 'contract' | 'customer_price_group' | 'campaign';
  contextId: string;
  contextName: string;
}

export function ContextualPriceView({ contextType, contextId, contextName }: ContextualPriceViewProps) {
  const [products, setProducts] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PriceRow | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(false);

  useEffect(() => {
    loadContextualProducts();
  }, [contextType, contextId]);

  const loadContextualProducts = async () => {
    setLoading(true);
    try {
      const [productsData, rulesData] = await Promise.all([
        api.products.getAll(),
        api.pricingRules.getByContext(contextType, contextId),
      ]);

      const rulesMap = new Map(rulesData.map((r: any) => [r.target_id, r]));

      const enrichedProducts = productsData.map((p: any) => {
        const rule = rulesMap.get(p.id) as any;

        const discountValue = rule?.discount_value || 0;
        const purchasePrice = p.purchase_price;

        let calculatedPrice = purchasePrice;
        if (rule?.discount_type === 'percentage') {
          calculatedPrice = purchasePrice * (1 + discountValue / 100);
        } else if (rule?.discount_type === 'fixed') {
          calculatedPrice = purchasePrice + discountValue;
        }

        const marginPercentage = calculatedPrice > 0
          ? ((calculatedPrice - purchasePrice) / calculatedPrice) * 100
          : 0;

        return {
          id: p.id,
          code: p.code,
          name: p.name,
          product_group_id: p.product_group_id,
          purchase_price: purchasePrice,
          sync_status: p.sync_status,
          last_sync: p.last_sync,
          created_at: p.created_at,
          product_group_name: p.product_group?.name || '',
          department_name: p.product_group?.department?.name || '',
          discount_type: rule?.discount_type || 'percentage',
          discount_value: discountValue,
          quantity_threshold: rule?.quantity_threshold || 0,
          excluded: rule?.excluded || false,
          calculated_price: calculatedPrice,
          margin_percentage: marginPercentage,
        };
      });

      setProducts(enrichedProducts);
    } catch (error) {
      console.error('Error loading contextual products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = async (rowIndex: number, columnKey: string, value: any) => {
    const product = products[rowIndex];

    if (['discount_type', 'discount_value', 'quantity_threshold', 'excluded'].includes(columnKey)) {
      try {
        const rulesData = await api.pricingRules.getByContext(contextType, contextId);
        const existingRule = rulesData.find((r: any) =>
          r.target_type === 'product' && r.target_id === product.id
        );

        if (existingRule) {
          await api.pricingRules.update(existingRule.id, { [columnKey]: value });
        } else {
          await api.pricingRules.create({
            context_type: contextType,
            context_id: contextId,
            target_type: 'product',
            target_id: product.id,
            discount_type: 'percentage',
            discount_value: 0,
            [columnKey]: value,
          });
        }

        loadContextualProducts();
      } catch (error) {
        console.error('Error updating pricing rule:', error);
      }
    }
  };

  const columns: Column<PriceRow>[] = [
    {
      key: 'code',
      label: 'Produktkod',
      width: '110px',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs font-medium text-slate-900">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Namn',
      width: '200px',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-slate-800">{value}</span>
      ),
    },
    {
      key: 'product_group_name',
      label: 'Varugrupp',
      width: '120px',
      sortable: true,
    },
    {
      key: 'department_name',
      label: 'Avdelning',
      width: '110px',
      sortable: true,
    },
    {
      key: 'sync_status',
      label: 'Synkstatus',
      width: '140px',
      render: (value, row) => {
        const raw = (value ?? '').toString();
        const status = raw.toLowerCase();
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
        const lastSync = row.last_sync
          ? new Date(row.last_sync).toLocaleString('sv-SE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        const tooltip = lastSync ? `Senast synk: ${lastSync}` : undefined;

        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${classes.badge}`}
            title={tooltip}
          >
            <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
            {label}
          </span>
        );
      },
    },
    {
      key: 'purchase_price',
      label: 'Kalkylpris',
      width: '100px',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-slate-700">
          {Number(value).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
        </span>
      ),
    },
    {
      key: 'discount_type',
      label: 'Rabattyp',
      width: '110px',
      editable: true,
      render: (value) => (
        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
          {value === 'percentage' ? '%' : value === 'fixed' ? 'Fast' : 'Trappstegs'}
        </span>
      ),
    },
    {
      key: 'discount_value',
      label: 'Rabatt',
      width: '100px',
      align: 'right',
      editable: true,
      sortable: true,
      render: (value, row) => (
        <span className="text-sm font-semibold text-blue-700">
          {row.discount_type === 'percentage' ? `${value}%` : `${value} kr`}
        </span>
      ),
    },
    {
      key: 'quantity_threshold',
      label: 'Mängd',
      width: '80px',
      align: 'right',
      editable: true,
      render: (value) => (
        <span className="text-sm text-slate-600">{value || '-'}</span>
      ),
    },
    {
      key: 'calculated_price',
      label: 'Utpris',
      width: '110px',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-bold text-green-700">
          {Number(value).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
        </span>
      ),
    },
    {
      key: 'margin_percentage',
      label: 'TG %',
      width: '80px',
      align: 'right',
      sortable: true,
      render: (value) => {
        const color = value >= 30 ? 'text-green-700' : value >= 15 ? 'text-yellow-700' : 'text-red-700';
        return (
          <span className={`text-sm font-semibold ${color}`}>
            {Number(value).toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'excluded',
      label: 'Exkludera',
      width: '90px',
      align: 'center',
      editable: true,
      render: (value) => (
        <input
          type="checkbox"
          checked={!!value}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          readOnly
        />
      ),
    },
  ];

  const detailsPanel = selectedProduct && (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Produktinformation</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Produktkod</label>
            <p className="text-sm font-mono font-semibold text-slate-900">{selectedProduct.code}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Namn</label>
            <p className="text-sm text-slate-900">{selectedProduct.name}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Avdelning</label>
            <p className="text-sm text-slate-900">{selectedProduct.department_name || '-'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Varugrupp</label>
            <p className="text-sm text-slate-900">{selectedProduct.product_group_name || '-'}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Prisuppgifter</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Kalkylpris</span>
            <span className="text-sm font-semibold text-slate-900">
              {Number(selectedProduct.purchase_price).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Rabatt</span>
            <span className="text-sm font-semibold text-blue-700">
              {selectedProduct.discount_type === 'percentage'
                ? `${selectedProduct.discount_value}%`
                : `${selectedProduct.discount_value} kr`}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-sm font-medium text-slate-900">Utpris</span>
            <span className="text-lg font-bold text-green-700">
              {Number(selectedProduct.calculated_price).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Marginal (TG %)</span>
            <span className="text-sm font-semibold text-slate-900">
              {Number(selectedProduct.margin_percentage).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const bottomPanel = showBottomPanel && (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">Kalkylprisredigering</h4>
        <p className="text-xs text-yellow-800">
          Här kan du välja leverantör, fraktkostnad och andra faktorer som påverkar kalkylpriset.
          Funktionalitet under utveckling.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Laddar prisdata...</p>
        </div>
      </div>
    );
  }

  const mainPanel = (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{contextName}</h1>
              <p className="text-sm text-slate-600">Prislista med alla produkter och prisregler</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Lägg till produkt
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              Spara ändringar
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setSelectedProduct(row)}
          onCellEdit={handleCellEdit}
          filterRow={true}
        />
      </div>
    </div>
  );

  return (
    <PanelLayout
      mainPanel={mainPanel}
      detailsPanel={detailsPanel}
      bottomPanel={bottomPanel}
      isDetailsOpen={selectedProduct !== null}
      isBottomOpen={showBottomPanel}
      onCloseDetails={() => setSelectedProduct(null)}
      onCloseBottom={() => setShowBottomPanel(false)}
    />
  );
}
