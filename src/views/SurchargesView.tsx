'use client';

import { useEffect, useState, useMemo } from 'react';
import { SpreadsheetGrid, GridColumn } from '../components/SpreadsheetGrid';
import { PanelLayout } from '../components/PanelLayout';
import { SurchargeDetailPanel } from '../components/SurchargeDetailPanel';
import { SurchargeSupplierListPanel } from '../components/SurchargeSupplierListPanel';
import { DollarSign, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const NEW_SURCHARGE_ROW_ID = 'new-surcharge-row';

interface Surcharge {
  id: string;
  name: string;
  description: string | null;
  cost_type: string;
  cost_value: number;
  type?: string;
  sort_order?: number;
  source?: string; // 'final_price' or 'calculation_price'
  scope_type?: string; // deprecated, for backwards compatibility
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export function SurchargesView() {
  const [surcharges, setSurcharges] = useState<Surcharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurcharge, setSelectedSurcharge] = useState<Surcharge | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newSurchargeData, setNewSurchargeData] = useState<Partial<Surcharge>>({
    name: '',
    cost_type: '%',
    cost_value: 0,
    type: 'product',
    source: 'final_price',
    sort_order: 0,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [surchargestoDelete, setSurchargesToDelete] = useState<string[]>([]);
  const [showTypeChangeModal, setShowTypeChangeModal] = useState(false);
  const [typeChangeData, setTypeChangeData] = useState<{
    surchargeId: string;
    oldType: 'product' | 'supplier';
    newType: 'product' | 'supplier';
    relationshipCount: number;
  } | null>(null);

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
    // Handle new surcharge row
    if (rowId === NEW_SURCHARGE_ROW_ID) {
      const updatedData = { ...newSurchargeData, [field]: newValue };
      setNewSurchargeData(updatedData);

      // Check if all required fields are filled
      const isNameFilled = (field === 'name' ? newValue : updatedData.name)?.trim().length > 0;
      const isCostValueValid = (field === 'cost_value' ? newValue : updatedData.cost_value) !== undefined;

      if (isNameFilled && isCostValueValid) {
        try {
          // Create the surcharge
          const newSurcharge = await api.surcharges.create({
            name: updatedData.name!,
            cost_type: updatedData.cost_type!,
            cost_value: updatedData.cost_value!,
            type: updatedData.type || 'product',
            is_active: true,
          });

          // Add to list and reset new row
          setSurcharges([...surcharges, newSurcharge]);
          setNewSurchargeData({
            name: '',
            cost_type: '%',
            cost_value: 0,
            type: 'product',
          });
        } catch (error) {
          console.error('Error creating surcharge:', error);
        }
      }
      return;
    }

    // Handle existing surcharge update

    // Special handling for type changes
    if (field === 'type') {
      const surcharge = surcharges.find(s => s.id === rowId);
      if (!surcharge) return;

      const oldType = (surcharge.type || surcharge.scope_type || 'product') as 'product' | 'supplier';
      const newType = newValue as 'product' | 'supplier';

      // If type hasn't actually changed, do nothing
      if (oldType === newType) return;

      // Check if there are relationships that will be deleted
      try {
        const counts = await api.surcharges.getRelationshipCounts(rowId);
        const relationshipCount = oldType === 'product' ? counts.productCount : counts.supplierCount;

        if (relationshipCount > 0) {
          // Show confirmation modal
          setTypeChangeData({
            surchargeId: rowId,
            oldType,
            newType,
            relationshipCount,
          });
          setShowTypeChangeModal(true);
        } else {
          // No relationships, just update the type
          await api.surcharges.update(rowId, { type: newType });
          setSurcharges(surcharges.map(s => s.id === rowId ? { ...s, type: newType } : s));

          // Update selected surcharge if it's the one being changed
          if (selectedSurcharge?.id === rowId) {
            setSelectedSurcharge({ ...selectedSurcharge, type: newType });
          }
        }
      } catch (error) {
        console.error('Error checking relationships:', error);
      }
      return;
    }

    // Handle all other field updates
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
      isEditable: (row: any) => row.id === NEW_SURCHARGE_ROW_ID || row.scope_type !== 'global',
    },
    {
      field: 'cost_value',
      headerName: 'Pris',
      width: 120,
      cellType: 'number',
      editable: true,
      isEditable: (row: any) => row.id === NEW_SURCHARGE_ROW_ID || row.scope_type !== 'global',
      numberFormat: surchargeValueFormat,
    },
    {
      field: 'type',
      headerName: 'Typ',
      width: 140,
      editable: true,
      cellType: 'customDropdown',
      dropdownOptions: () => [
        { label: 'Produkt', value: 'product' },
        { label: 'Leverantör', value: 'supplier' },
      ],
      valueGetter: (row: any) => row.type || row.scope_type || 'product',
      filterTextGetter: (_value: any, row: any) => {
        const type = row.type || row.scope_type || 'product';
        return type === 'product' ? 'Produkt' : 'Leverantör';
      },
    },
    {
      field: 'cost_type',
      headerName: 'Kostnadstyp',
      width: 100,
      editable: true,
      isEditable: (row: any) => row.id === NEW_SURCHARGE_ROW_ID || row?.scope_type !== 'global',
      cellType: 'customDropdown',
      dropdownOptions: () => costTypeDropdownOptions,
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',
    },
    {
      field: 'source',
      headerName: 'Källa',
      width: 140,
      editable: true,
      cellType: 'customDropdown',
      dropdownOptions: () => [
        { label: 'Slutpris', value: 'final_price' },
        { label: 'Kalkylpris', value: 'calculation_price' },
      ],
      valueGetter: (row: any) => row.source || 'final_price',
      filterTextGetter: (_value: any, row: any) => {
        const source = row.source || 'final_price';
        return source === 'final_price' ? 'Slutpris' : 'Kalkylpris';
      },
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
    {
      field: 'actions',
      headerName: '',
      width: 30,
      editable: false,
      sortable: false,
      cellRenderer: (_value: any, row: any) => {
        // Don't show delete button for new row
        if (row.id === NEW_SURCHARGE_ROW_ID) {
          return null;
        }

        return (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={async (e) => {
                e.stopPropagation();

                if (!confirm(`Är du säker på att du vill ta bort påslaget "${row.name}"?`)) {
                  return;
                }

                try {
                  // Delete surcharge using the API route
                  await fetch(`/api/surcharges?id=${row.id}`, {
                    method: 'DELETE',
                  });

                  // Reload surcharges
                  await loadSurcharges();
                } catch (error) {
                  console.error('Error deleting surcharge:', error);
                }
              }}
              className="p-1 hover:bg-red-50 rounded transition-colors"
              title="Ta bort påslag"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        );
      },
    },
  ], [surchargeValueFormat, costTypeDropdownOptions, loadSurcharges]);

  const surchargesWithNewRow = useMemo(() => {
    const newRow: Surcharge = {
      id: NEW_SURCHARGE_ROW_ID,
      name: newSurchargeData.name || '',
      description: null,
      cost_type: newSurchargeData.cost_type || '%',
      cost_value: newSurchargeData.cost_value || 0,
      scope_type: newSurchargeData.scope_type || 'local',
      is_active: true,
      created_at: new Date().toISOString(),
      product_count: 0,
    };
    return [...surcharges, newRow];
  }, [surcharges, newSurchargeData]);

  const handleRowClick = (surcharge: Surcharge) => {
    // Don't open details for the new row
    if (surcharge.id === NEW_SURCHARGE_ROW_ID) return;

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

  const handleDeleteRows = (rowIds: string[]) => {
    // Filter out the new row ID
    const validIds = rowIds.filter(id => id !== NEW_SURCHARGE_ROW_ID);
    if (validIds.length === 0) return;

    setSurchargesToDelete(validIds);
    setShowDeleteModal(true);
  };

  const handleRowsReorder = async (targetRowId: string, rowIds: string[], dropPosition: 'before' | 'after') => {
    // Filter out the new row ID
    const validRowIds = rowIds.filter(id => id !== NEW_SURCHARGE_ROW_ID);
    if (validRowIds.length === 0 || targetRowId === NEW_SURCHARGE_ROW_ID) return;

    // Create a new array with the reordered surcharges
    const reorderedSurcharges = [...surcharges];

    // Find the target index
    const targetIndex = reorderedSurcharges.findIndex(s => s.id === targetRowId);
    if (targetIndex === -1) return;

    // Remove dragged items
    const draggedItems = validRowIds.map(id =>
      reorderedSurcharges.find(s => s.id === id)
    ).filter((item): item is Surcharge => item !== undefined);

    const filteredSurcharges = reorderedSurcharges.filter(
      s => !validRowIds.includes(s.id)
    );

    // Calculate insert position
    const insertIndex = dropPosition === 'before'
      ? filteredSurcharges.findIndex(s => s.id === targetRowId)
      : filteredSurcharges.findIndex(s => s.id === targetRowId) + 1;

    // Insert dragged items at new position
    filteredSurcharges.splice(insertIndex, 0, ...draggedItems);

    // Update sort_order for all items
    const updates = filteredSurcharges.map((surcharge, index) => ({
      id: surcharge.id,
      sort_order: index,
    }));

    // Optimistically update UI
    setSurcharges(filteredSurcharges.map((s, index) => ({
      ...s,
      sort_order: index,
    })));

    // Persist to backend
    try {
      await api.surcharges.updateSortOrder(updates);
    } catch (error) {
      console.error('Error updating sort order:', error);
      // Revert on error
      loadSurcharges();
    }
  };

  const confirmDelete = async () => {
    try {
      // Delete all selected surcharges
      await Promise.all(
        surchargestoDelete.map(id =>
          fetch(`/api/surcharges?id=${id}`, { method: 'DELETE' })
        )
      );

      // Reload surcharges
      await loadSurcharges();
      setShowDeleteModal(false);
      setSurchargesToDelete([]);
    } catch (error) {
      console.error('Error deleting surcharges:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSurchargesToDelete([]);
  };

  const confirmTypeChange = async () => {
    if (!typeChangeData) return;

    try {
      const { surchargeId, oldType, newType } = typeChangeData;

      // Cascade delete old relationships
      if (oldType === 'product') {
        await api.surcharges.cascadeDeleteProducts(surchargeId);
      } else {
        await api.surcharges.cascadeDeleteSuppliers(surchargeId);
      }

      // Update the surcharge type
      await api.surcharges.update(surchargeId, { type: newType });

      // Update local state
      setSurcharges(surcharges.map(s =>
        s.id === surchargeId ? { ...s, type: newType } : s
      ));

      // Update selected surcharge if it's the one being changed
      if (selectedSurcharge?.id === surchargeId) {
        setSelectedSurcharge({ ...selectedSurcharge, type: newType });
      }

      // Close modal
      setShowTypeChangeModal(false);
      setTypeChangeData(null);
    } catch (error) {
      console.error('Error changing surcharge type:', error);
      alert('Kunde inte ändra typ: ' + (error as Error).message);
    }
  };

  const cancelTypeChange = () => {
    setShowTypeChangeModal(false);
    setTypeChangeData(null);
    // Note: The grid will naturally revert the dropdown since we didn't update the state
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
          data={surchargesWithNewRow}
          height="calc(100vh - 180px)"
          onRowClicked={handleRowClick}
          onCellValueChanged={handleCellValueChanged}
          onDeleteRows={handleDeleteRows}
          onRowsReordered={handleRowsReorder}
          reorderable={true}
          showFilter={true}
        />
      </div>
    </div>
  );

  const detailsPanel = selectedSurcharge && (
    (selectedSurcharge.type || selectedSurcharge.scope_type) === 'supplier' ? (
      <SurchargeSupplierListPanel
        surchargeId={selectedSurcharge.id}
        surchargeName={selectedSurcharge.name}
      />
    ) : (
      <SurchargeDetailPanel
        surchargeId={selectedSurcharge.id}
        surchargeName={selectedSurcharge.name}
      />
    )
  );

  const surchargeNames = surchargestoDelete
    .map(id => surcharges.find(s => s.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <PanelLayout
        mainPanel={mainPanel}
        detailsPanel={detailsPanel}
        isDetailsOpen={isDetailsOpen}
        isBottomOpen={false}
        onCloseDetails={() => setIsDetailsOpen(false)}
        onCloseBottom={() => {}}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Ta bort påslag
                </h3>
              </div>
              <p className="text-slate-600 mb-4">
                {surchargestoDelete.length === 1
                  ? `Är du säker på att du vill ta bort påslaget "${surchargeNames}"?`
                  : `Är du säker på att du vill ta bort ${surchargestoDelete.length} påslag?`}
              </p>
              {surchargestoDelete.length > 1 && (
                <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-sm text-slate-700 font-medium mb-1">
                    Påslag som kommer tas bort:
                  </p>
                  <p className="text-sm text-slate-600">{surchargeNames}</p>
                </div>
              )}
              <p className="text-sm text-slate-500 mb-6">
                Denna åtgärd kan inte ångras.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  Ta bort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Type Change Confirmation Modal */}
      {showTypeChangeModal && typeChangeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Ändra påslagstyp
                </h3>
              </div>
              <p className="text-slate-600 mb-4">
                Att ändra från <strong>{typeChangeData.oldType === 'product' ? 'Produkt' : 'Leverantör'}</strong> till{' '}
                <strong>{typeChangeData.newType === 'product' ? 'Produkt' : 'Leverantör'}</strong> kommer att
                permanent ta bort alla <strong>{typeChangeData.relationshipCount}</strong> kopplade{' '}
                {typeChangeData.oldType === 'product' ? 'produkter' : 'leverantörer'}.
              </p>
              <div className="mb-4 p-3 bg-amber-50 rounded border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Varning:</strong> Denna åtgärd kan inte ångras. Alla {typeChangeData.oldType === 'product' ? 'produkt' : 'leverantör'}relationer kommer att tas bort permanent.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelTypeChange}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={confirmTypeChange}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
                >
                  Fortsätt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
