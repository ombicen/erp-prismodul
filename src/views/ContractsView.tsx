import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/DataTable';
import { supabase, Contract } from '../lib/supabase';
import { FileText } from 'lucide-react';

export function ContractsView() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
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

  const columns: Column<Contract>[] = [
    {
      key: 'name',
      label: 'Avtalsnamn',
      width: '300px',
      sortable: true,
      editable: true,
      render: (value) => (
        <span className="font-medium text-slate-900">{value}</span>
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
    const contract = contracts[rowIndex];
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ [columnKey]: value })
        .eq('id', contract.id);

      if (error) throw error;

      setContracts(prev => prev.map((c, i) =>
        i === rowIndex ? { ...c, [columnKey]: value } : c
      ));
    } catch (error) {
      console.error('Error updating contract:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Laddar avtal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Avtal</h1>
              <p className="text-sm text-slate-600">Hantera kundavtal och prisregler</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              Nytt avtal
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={contracts}
          keyExtractor={(row) => row.id}
          onCellEdit={handleCellEdit}
          filterRow={true}
        />
      </div>
    </div>
  );
}
