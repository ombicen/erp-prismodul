'use client';

import { useEffect, useState, useMemo } from 'react';
import { SpreadsheetGrid, GridColumn } from '../components/SpreadsheetGrid';
import { PanelLayout } from '../components/PanelLayout';
import { CustomerPriceGroupDetailsTabs } from '../components/CustomerPriceGroupDetailsTabs';
import { Users } from 'lucide-react';
import { api } from '../services/api';

interface CustomerPriceGroup {
  id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
  description: string;
  status: string;
  created_at: string;
}

export function CustomerPriceGroupsView() {
  const [groups, setGroups] = useState<CustomerPriceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<CustomerPriceGroup | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await api.customerPriceGroups.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Error loading customer price groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('sv-SE');
  };

  const columns = useMemo<GridColumn[]>(() => [
    {
      field: 'name',
      headerName: 'Kundprisgrupp',
      width: 250,
      editable: true,
    },
    {
      field: 'description',
      headerName: 'Kommentar / Beskrivning',
      width: 350,
      editable: true,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'valid_from',
      headerName: 'Giltighet från',
      width: 150,
      editable: true,
      type: 'date',
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: 'valid_to',
      headerName: 'Giltighet till',
      width: 150,
      editable: true,
      type: 'date',
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: 'id',
      headerName: 'Antal produkter',
      width: 150,
      type: 'number',
      editable: false,
      cellRenderer: () => '0',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      editable: false,
      fixed: true,
      cellRenderer: (value) => {
        const status = value;
        const labels: Record<string, string> = {
          active: 'Aktiv',
          planned: 'Planerad',
          expired: 'Utgången',
        };
        return labels[status] || status;
      },
    },
  ], []);

  const handleCellValueChanged = async (rowId: string, field: string, newValue: any) => {
    try {
      await api.customerPriceGroups.update(rowId, { [field]: newValue });

      setGroups(prev => prev.map(g =>
        g.id === rowId ? { ...g, [field]: newValue } : g
      ));
    } catch (error) {
      console.error('Error updating customer price group:', error);
    }
  };

  const handleCellClick = (row: CustomerPriceGroup, field: string) => {
    setSelectedGroup(row);
    setIsDetailsOpen(true);
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

  const mainPanel = (
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
        <SpreadsheetGrid
          columns={columns}
          data={groups}
          height="calc(100vh - 180px)"
          onCellValueChanged={handleCellValueChanged}
          onCellClicked={handleCellClick}
        />
      </div>
    </div>
  );

  const detailsPanel = selectedGroup && (
    <div className="flex flex-col h-full">
      {/* Price Group Info Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <div>
            <h3 className="text-xs font-medium text-slate-500">Kundprisgrupp</h3>
            <p className="text-sm font-semibold text-slate-900">{selectedGroup.name}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500">Beskrivning</h3>
            <p className="text-xs text-slate-900">{selectedGroup.description || '-'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h3 className="text-xs font-medium text-slate-500">Giltighet från</h3>
              <p className="text-xs text-slate-900">{formatDate(selectedGroup.valid_from)}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-slate-500">Giltighet till</h3>
              <p className="text-xs text-slate-900">{formatDate(selectedGroup.valid_to)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 overflow-hidden">
        <CustomerPriceGroupDetailsTabs
          priceGroupId={selectedGroup.id}
          priceGroupName={selectedGroup.name}
        />
      </div>
    </div>
  );

  return (
    <PanelLayout
      mainPanel={mainPanel}
      detailsPanel={detailsPanel}
      isDetailsOpen={isDetailsOpen}
      isBottomOpen={false}
      onCloseDetails={() => setIsDetailsOpen(false)}
      onCloseBottom={() => {}}
    />
  );
}
