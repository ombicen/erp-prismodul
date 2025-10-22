'use client';

import { useEffect, useState, useMemo } from 'react';
import { SpreadsheetGrid, GridColumn } from '../components/SpreadsheetGrid';
import { PanelLayout } from '../components/PanelLayout';
import { SurchargeDetailPanel } from '../components/SurchargeDetailPanel';
import { DollarSign } from 'lucide-react';
import { api } from '../services/api';

interface Surcharge {
  id: string;
  name: string;
  description: string | null;
  cost_type: string;
  cost_value: number;
  scope_type: string;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export function SurchargesView() {
  const [surcharges, setSurcharges] = useState<Surcharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurcharge, setSelectedSurcharge] = useState<Surcharge | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadSurcharges();
  }, []);

  const loadSurcharges = async () => {
    setLoading(true);
    try {
      const data = await api.surcharges.getAll();
      setSurcharges(data);
    } catch (error) {
      console.error('Error loading surcharges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCellValueChanged = async (rowId: string, field: string, newValue: any) => {
    try {
      await api.surcharges.update(rowId, { [field]: newValue });
      setSurcharges(surcharges.map(s => s.id === rowId ? { ...s, [field]: newValue } : s));
    } catch (error) {
      console.error('Error updating surcharge:', error);
    }
  };

  const surchargeValueFormat = useMemo(
    () =>
      new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const costTypeDropdownOptions = useMemo(
    () => [
      { label: 'Procent (%)', value: '%' },
      { label: 'Kronor (KR)', value: 'KR' },
    ],
    [],
  );

  const columns = useMemo<GridColumn[]>(() => [
    {
      field: 'name',
      headerName: 'Namn',
      width: 250,
      editable: true,
    },
    {
      field: 'cost_value',
      headerName: 'Pris',
      width: 120,
      cellType: 'number',
      editable: true,
      numberFormat: surchargeValueFormat,
    },
    {
      field: 'scope_type',
      headerName: 'Typ',
      width: 100,
      editable: false,
      cellRenderer: (value: string) => {
        const isGlobal = value === 'global';
        const colorClass = isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
        const label = isGlobal ? 'Global' : 'Lokal';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        );
      },
      filterTextGetter: (value: string) => value === 'global' ? 'Global' : 'Lokal',
    },
    {
      field: 'cost_type',
      headerName: 'Kostnadstyp',
      width: 100,
      editable: true,
      isEditable: (row: any) => row?.scope_type !== 'global',
      cellType: 'dropdown',
      dropdownOptions: () => costTypeDropdownOptions,
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',
    },
    {
      field: 'product_count',
      headerName: 'Antal produkter',
      width: 150,
      type: 'number',
      editable: false,
      valueFormatter: (value) => value || 0,
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 140,
      editable: false,
      cellRenderer: (value: boolean) => {
        const statusClass = value
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-700';
        const label = value ? 'Aktiv' : 'Inaktiv';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {label}
          </span>
        );
      },
      filterTextGetter: (value: boolean) => value ? 'Aktiv' : 'Inaktiv',
    },
  ], [surchargeValueFormat, costTypeDropdownOptions]);

  const handleRowClick = (surcharge: Surcharge) => {
    setSelectedSurcharge(surcharge);
    setIsDetailsOpen(true);
  };

  const handleAddNew = async () => {
    try {
      const newSurcharge = await api.surcharges.create({
        name: 'Nytt påslag',
        cost_type: '%',
        cost_value: 0,
        scope_type: 'local',
        is_active: true,
      });
      setSurcharges([...surcharges, newSurcharge]);
      setSelectedSurcharge(newSurcharge);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Error creating surcharge:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Laddar påslag...</p>
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
              <h1 className="text-2xl font-semibold text-slate-900">Påslag</h1>
              <p className="text-sm text-slate-600">{surcharges.length} påslag</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Export
            </button>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Nytt påslag
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <SpreadsheetGrid
          columns={columns}
          data={surcharges}
          height="calc(100vh - 180px)"
          onRowClicked={handleRowClick}
          onCellValueChanged={handleCellValueChanged}
          showFilter={true}
        />
      </div>
    </div>
  );

  const detailsPanel = selectedSurcharge && (
    <SurchargeDetailPanel
      surchargeId={selectedSurcharge.id}
      surchargeName={selectedSurcharge.name}
    />
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
