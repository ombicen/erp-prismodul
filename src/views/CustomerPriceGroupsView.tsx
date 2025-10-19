import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/DataTable';
import { supabase, CustomerPriceGroup } from '../lib/supabase';
import { Users } from 'lucide-react';

export function CustomerPriceGroupsView() {
  const [groups, setGroups] = useState<CustomerPriceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_price_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading customer price groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('sv-SE');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      planned: 'bg-blue-100 text-blue-800',
      expired: 'bg-slate-100 text-slate-800',
    };
    const labels = {
      active: 'Aktiv',
      planned: 'Planerad',
      expired: 'Utgången',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || colors.active}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const columns: Column<CustomerPriceGroup>[] = [
    {
      key: 'name',
      label: 'Kundprisgrupp',
      width: '250px',
      sortable: true,
      editable: true,
      render: (value) => (
        <span className="font-medium text-slate-900">{value}</span>
      ),
    },
    {
      key: 'description',
      label: 'Kommentar / Beskrivning',
      width: '300px',
      editable: true,
      render: (value) => (
        <span className="text-slate-600 italic">{value || '-'}</span>
      ),
    },
    {
      key: 'valid_from',
      label: 'Giltighet från',
      width: '130px',
      sortable: true,
      editable: true,
      render: (value) => (
        <span className="text-slate-700">{formatDate(value)}</span>
      ),
    },
    {
      key: 'valid_to',
      label: 'Giltighet till',
      width: '130px',
      sortable: true,
      editable: true,
      render: (value) => (
        <span className="text-slate-700">{formatDate(value)}</span>
      ),
    },
    {
      key: 'id',
      label: 'Antal produkter',
      width: '130px',
      align: 'right',
      render: () => (
        <span className="text-slate-600">0</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
  ];

  const handleCellEdit = async (rowIndex: number, columnKey: string, value: any) => {
    const group = groups[rowIndex];
    try {
      const { error } = await supabase
        .from('customer_price_groups')
        .update({ [columnKey]: value })
        .eq('id', group.id);

      if (error) throw error;

      setGroups(prev => prev.map((g, i) =>
        i === rowIndex ? { ...g, [columnKey]: value } : g
      ));
    } catch (error) {
      console.error('Error updating customer price group:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Laddar kundprisgrupper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Kundprisgrupper</h1>
              <p className="text-sm text-slate-600">Hantera prislistor och kundprisregler</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              Ny prisgrupp
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={groups}
          keyExtractor={(row) => row.id}
          onCellEdit={handleCellEdit}
          filterRow={true}
        />
      </div>
    </div>
  );
}
