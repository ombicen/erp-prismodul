import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/DataTable';
import { supabase, ProductWithDetails, ProductGroup, Department } from '../lib/supabase';
import { Package, ExternalLink } from 'lucide-react';

interface ProductRow extends ProductWithDetails {
  department_name?: string;
  product_group_name?: string;
}

export function ProductsView() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('code');

      if (productsError) throw productsError;

      const { data: groupsData } = await supabase
        .from('product_groups')
        .select('*');

      const { data: deptData } = await supabase
        .from('departments')
        .select('*');

      const groupsMap = new Map(groupsData?.map(g => [g.id, g]) || []);
      const deptMap = new Map(deptData?.map(d => [d.id, d]) || []);

      const enrichedProducts = productsData?.map(p => {
        const group = groupsMap.get(p.product_group_id);
        const dept = group ? deptMap.get(group.department_id) : undefined;
        return {
          ...p,
          product_group_name: group?.name || '',
          department_name: dept?.name || '',
        };
      }) || [];

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

  const getSyncStatusBadge = (status: string) => {
    const colors = {
      synced: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status}
      </span>
    );
  };

  const columns: Column<ProductRow>[] = [
    {
      key: 'code',
      label: 'Produktkod',
      width: '120px',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-medium text-slate-900">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Namn',
      width: '300px',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-slate-800">{value}</span>
      ),
    },
    {
      key: 'product_group_name',
      label: 'Varugrupp',
      width: '150px',
      sortable: true,
      render: (value) => (
        <span className="text-slate-600">{value || '-'}</span>
      ),
    },
    {
      key: 'department_name',
      label: 'Avdelning',
      width: '130px',
      sortable: true,
      render: (value) => (
        <span className="text-slate-600">{value || '-'}</span>
      ),
    },
    {
      key: 'purchase_price',
      label: 'Inköpspris',
      width: '120px',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-slate-900">
          {Number(value).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr
        </span>
      ),
    },
    {
      key: 'sync_status',
      label: 'Synkstatus',
      width: '100px',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          {getSyncStatusBadge(value)}
          {row.last_sync && (
            <span className="text-[10px] text-slate-500">
              {formatDate(row.last_sync)}
            </span>
          )}
        </div>
      ),
    },
  ];

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

  return (
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
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(row) => row.id}
          filterRow={true}
        />
      </div>
    </div>
  );
}
