'use client';

import { useEffect, useState, useMemo } from 'react';
import { SpreadsheetGrid, GridColumn } from '../components/SpreadsheetGrid';
import { PanelLayout } from '../components/PanelLayout';
import { ContractDetailsTabs } from '../components/ContractDetailsTabs';
import { FileText } from 'lucide-react';
import { api } from '../services/api';

interface Contract {
  id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
  status: string;
  created_at: string;
  exclude_from_campaigns?: boolean;
}

export function ContractsView() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [excludeFromCampaigns, setExcludeFromCampaigns] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await api.contracts.getAll();
      setContracts(data);
    } catch (error) {
      console.error('Error loading contracts:', error);
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
      headerName: 'Avtalsnamn',
      width: 300,
      editable: true,
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
      field: 'exclude_from_campaigns',
      headerName: 'Kampanj-exkludering',
      width: 160,
      editable: false,
      cellRenderer: (value) => {
        if (value) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Exkluderad
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Tillåten
          </span>
        );
      },
      filterTextGetter: (value) => value ? 'Exkluderad' : 'Tillåten',
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
      await api.contracts.update(rowId, { [field]: newValue });

      setContracts(prev => prev.map(c =>
        c.id === rowId ? { ...c, [field]: newValue } : c
      ));
    } catch (error) {
      console.error('Error updating contract:', error);
    }
  };

  const handleCellClick = (row: Contract, field: string) => {
    setSelectedContract(row);
    setExcludeFromCampaigns(row.exclude_from_campaigns || false);
    setIsDetailsOpen(true);
  };

  const handleToggleExcludeFromCampaigns = async (value: boolean) => {
    setExcludeFromCampaigns(value);
    if (selectedContract) {
      try {
        await api.contracts.update(selectedContract.id, { exclude_from_campaigns: value });
        setContracts(prev => prev.map(c =>
          c.id === selectedContract.id ? { ...c, exclude_from_campaigns: value } : c
        ));
        setSelectedContract({ ...selectedContract, exclude_from_campaigns: value });
      } catch (error) {
        console.error('Error updating contract:', error);
      }
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

  const mainPanel = (
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
        <SpreadsheetGrid
          columns={columns}
          data={contracts}
          height="calc(100vh - 180px)"
          onCellValueChanged={handleCellValueChanged}
          onCellClicked={handleCellClick}
        />
      </div>
    </div>
  );

  const detailsPanel = selectedContract && (
    <div className="flex flex-col h-full">
      {/* Contract Info Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <div>
            <h3 className="text-xs font-medium text-slate-500">Avtalsnamn</h3>
            <p className="text-sm font-semibold text-slate-900">{selectedContract.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h3 className="text-xs font-medium text-slate-500">Giltighet från</h3>
              <p className="text-xs text-slate-900">{formatDate(selectedContract.valid_from)}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-slate-500">Giltighet till</h3>
              <p className="text-xs text-slate-900">{formatDate(selectedContract.valid_to)}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500">Status</h3>
            <p className="text-xs text-slate-900">{selectedContract.status}</p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 overflow-hidden">
        <ContractDetailsTabs
          contractId={selectedContract.id}
          contractName={selectedContract.name}
          excludeFromCampaigns={excludeFromCampaigns}
          onToggleExcludeFromCampaigns={handleToggleExcludeFromCampaigns}
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
