'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { SpreadsheetGrid, GridColumn } from './SpreadsheetGrid';
import { api } from '../services/api';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
}

interface SurchargeSupplier {
  id: string;
  supplier_id: string;
  surcharge_id: string;
  is_active: boolean;
  supplier?: Supplier;
}

interface SurchargeSupplierListPanelProps {
  surchargeId: string;
  surchargeName: string;
}

export function SurchargeSupplierListPanel({ surchargeId, surchargeName }: SurchargeSupplierListPanelProps) {
  const [surchargeSuppliers, setSurchargeSuppliers] = useState<SurchargeSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    loadSurchargeSuppliers();
    loadAvailableSuppliers();
  }, [surchargeId]);

  const loadSurchargeSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.surcharges.getSuppliers(surchargeId);
      setSurchargeSuppliers(data);
    } catch (error) {
      console.error('Error loading surcharge suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSuppliers = async () => {
    try {
      const data = await api.suppliers.getAll();
      setAllSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleRemoveSupplier = async (supplierId: string) => {
    try {
      await api.surcharges.removeSupplier(surchargeId, supplierId);
      setSurchargeSuppliers(surchargeSuppliers.filter(ss => ss.supplier_id !== supplierId));
    } catch (error) {
      console.error('Error removing supplier from surcharge:', error);
    }
  };

  const handleAddSupplier = async (supplier: Supplier) => {
    try {
      // Check if already added
      const existingSupplierIds = surchargeSuppliers.map(ss => ss.supplier_id);
      if (existingSupplierIds.includes(supplier.id)) {
        alert('Denna leverantör är redan tillagd till detta påslag');
        return;
      }

      const newAssignment = await api.surcharges.addSupplier(surchargeId, supplier.id);
      setSurchargeSuppliers(prev => [...prev, newAssignment]);
      setIsModalOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding supplier to surcharge:', error);
      alert('Kunde inte lägga till leverantör: ' + (error as Error).message);
    }
  };

  const getFilteredSuppliers = () => {
    const lowerSearch = searchTerm.toLowerCase();
    return allSuppliers.filter((s: Supplier) =>
      s.name.toLowerCase().includes(lowerSearch) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(lowerSearch))
    );
  };

  const columns = useMemo<GridColumn[]>(() => [
    {
      field: 'name',
      headerName: 'Leverantör',
      width: 250,
      editable: false,
      valueGetter: (row: SurchargeSupplier) => row.supplier?.name || '',
    },
    {
      field: 'contact_person',
      headerName: 'Kontaktperson',
      width: 200,
      editable: false,
      valueGetter: (row: SurchargeSupplier) => row.supplier?.contact_person || '-',
    },
    {
      field: 'email',
      headerName: 'E-post',
      width: 200,
      editable: false,
      valueGetter: (row: SurchargeSupplier) => row.supplier?.email || '-',
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      width: 150,
      editable: false,
      valueGetter: (row: SurchargeSupplier) => row.supplier?.phone || '-',
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      editable: false,
      valueGetter: (row: SurchargeSupplier) => row.supplier?.is_active ?? true,
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
      width: 60,
      editable: false,
      cellRenderer: (value: any, row: SurchargeSupplier) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveSupplier(row.supplier_id);
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Leverantörer</h2>
          <p className="text-sm text-slate-600 mt-1">
            Påslag: {surchargeName} • {surchargeSuppliers.length} leverantörer
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Lägg till leverantör
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-600">Laddar leverantörer...</p>
          </div>
        ) : (
          <SpreadsheetGrid
            columns={columns}
            data={surchargeSuppliers}
            height="100%"
            showFilter={true}
            sortable={true}
          />
        )}
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Lägg till leverantör till påslag</h3>
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

            {/* Search */}
            <div className="p-4 border-b border-slate-200">
              <input
                type="text"
                placeholder="Sök leverantör (namn eller kontaktperson)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
              {getFilteredSuppliers().length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-600">
                    {searchTerm ? 'Inga resultat hittades' : 'Inga leverantörer tillgängliga'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredSuppliers().map((supplier: Supplier) => (
                    <button
                      key={supplier.id}
                      onClick={() => handleAddSupplier(supplier)}
                      className="w-full p-3 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium text-slate-900">{supplier.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        {supplier.contact_person && `Kontaktperson: ${supplier.contact_person}`}
                        {supplier.email && ` | E-post: ${supplier.email}`}
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
