'use client';







import { useEffect, useState, useMemo, useCallback } from 'react';



import { SpreadsheetGrid, GridColumn } from '../components/SpreadsheetGrid';



import { PanelLayout } from '../components/PanelLayout';



import { DetailsTabs } from '../components/DetailsTabs';



import { Package, Trash2 } from 'lucide-react';



import { api } from '../services/api';
import type { AutocompleteOption, AutocompleteCell } from '../components/cells/AutocompleteCellTemplate';





interface ProductRow {
  id: string;
  code: string;
  name: string;
  product_group_id: string;
  purchase_price: number;
  brand?: string;
  unit?: string;
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
  surcharges: Surcharge[]; // Embedded surcharges for this supplier
}







interface Surcharge {
  id: string;
  name: string;
  description?: string;
  cost_type: '%' | 'KR';
  cost_value: number;
  scope_type: 'product' | 'supplier';
  scope_id: string;
  scope_name?: string; // Display name for the linked entity
  is_active: boolean;
  created_at: string;
  computed_amount?: number; // Calculated amount for display
  sort_order?: number; // For ordering surcharges (critical for kalkylpris cascade)
  source?: 'final_price' | 'calculation_price'; // Where to apply: Slutpris or Kalkylpris
}

// For backward compatibility with existing code
interface ProductSurcharge {
  id: string;
  surcharge_id: string;
  product_id: string;
  scope_type: 'product' | 'supplier';
  scope_id: string;
  surcharge: {
    id: string;
    name: string;
    cost_type: '%' | 'KR';
    cost_value: number;
    scope_type: 'product' | 'supplier';
  };
  computed_amount?: number;
}







const NEW_SUPPLIER_ROW_ID = 'new-supplier-row';
const NEW_SURCHARGE_ROW_ID = 'new-surcharge-row';
const LEGACY_BRAND_KEY = 'varum\u00E4rke';
const LEGACY_UNIT_KEY = 'enhet';







interface SupplierOption {



  id: string;



  name: string;



}







type NewSupplierDraft = {



  id: string;



  supplier_id: string;



  supplier_name: string;



  base_price: number;



  freight_cost: number;



  discount_type: '%' | 'KR';



  discount_value: number;



  is_primary: boolean;



};







const createEmptySupplierDraft = (): NewSupplierDraft => ({



  id: NEW_SUPPLIER_ROW_ID,



  supplier_id: '',



  supplier_name: '',



  base_price: 0,



  freight_cost: 0,



  discount_type: '%',



  discount_value: 0,



  is_primary: false,



});







export function ProductsView() {



  const [products, setProducts] = useState<ProductRow[]>([]);



  const [loading, setLoading] = useState(true);



  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);



  const [isDetailsOpen, setIsDetailsOpen] = useState(false);



  const [isBottomOpen, setIsBottomOpen] = useState(false);







  // Supplier state for Kalkylpris editor (refactored with embedded surcharges)
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [activeSupplier, setActiveSupplier] = useState<ProductSupplier | null>(null); // SSOT for active supplier
  const [allSuppliers, setAllSuppliers] = useState<SupplierOption[]>([]);
  const [newSupplierDraft, setNewSupplierDraft] = useState<NewSupplierDraft>(createEmptySupplierDraft);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);







  // Surcharge state (previously labeled 'Other costs')
  const [productSurcharges, setProductSurcharges] = useState<ProductSurcharge[]>([]);
  const [surchargesLoading, setSurchargesLoading] = useState(false);
  const [allSurcharges, setAllSurcharges] = useState<any[]>([]);
  const [newSurchargeData, setNewSurchargeData] = useState({
    name: '',
    cost_type: '%' as '%' | 'KR',
    cost_value: 0,
    scope_type: 'product' as 'product' | 'supplier',
    source: 'final_price' as 'final_price' | 'calculation_price',
  });







  useEffect(() => {



    loadProducts();
    loadAllSurcharges();



  }, []);

  const loadAllSurcharges = async () => {
    try {
      const data = await api.surcharges.getAll();
      setAllSurcharges(data);
    } catch (error) {
      console.error('Error loading surcharges:', error);
    }
  };







  // Load product suppliers and surcharges when a product is selected



  useEffect(() => {



    if (selectedProduct && isBottomOpen) {



      loadProductSuppliers(selectedProduct.id);



      loadProductSurcharges(selectedProduct.id);



    }



  }, [selectedProduct, isBottomOpen]);







  useEffect(() => {



    if (!isBottomOpen) return;



    if (allSuppliers.length > 0) return;







    const fetchSuppliers = async () => {



      try {



        const data = await api.suppliers.getAll();



        const mapped: SupplierOption[] = data.map((supplier: any) => ({



          id: supplier.id,



          name: supplier.name,



        }));



        setAllSuppliers(mapped);



      } catch (error) {



        console.error('Error loading suppliers:', error);



      }



    };







    fetchSuppliers();



  }, [isBottomOpen, allSuppliers.length]);







  useEffect(() => {



    setNewSupplierDraft(createEmptySupplierDraft());



  }, [selectedProduct?.id]);







  // Ensure suppliers from existing product supplier assignments are available as options



  useEffect(() => {



    if (productSuppliers.length === 0) return;







    setAllSuppliers(prev => {



      const map = new Map(prev.map(option => [option.id, option]));



      for (const supplier of productSuppliers) {



        if (!supplier.supplier_id || !supplier.supplier_name) continue;



        if (!map.has(supplier.supplier_id)) {



          map.set(supplier.supplier_id, {



            id: supplier.supplier_id,



            name: supplier.supplier_name,



          });



        }



      }



      return Array.from(map.values());



    });



  }, [productSuppliers]);











  const loadProductSuppliers = async (productId: string) => {
    console.log('=== loadProductSuppliers START ===');
    console.log('productId:', productId);

    try {
      const data = await api.productSuppliers.getByProduct(productId);
      console.log('Raw suppliers data:', data);

      // Load surcharges for each supplier and embed them
      const suppliersWithSurcharges = await Promise.all(
        data.map(async (supplier: ProductSupplier) => {
          console.log(`Loading surcharges for supplier ${supplier.id} (${supplier.supplier_name})`);
          try {
            const surcharges = await api.productSuppliers.getSurcharges(supplier.id);
            console.log(`Surcharges for supplier ${supplier.supplier_name}:`, surcharges);
            return { ...supplier, surcharges: surcharges || [] };
          } catch (error) {
            console.error(`Error loading surcharges for supplier ${supplier.id}:`, error);
            return { ...supplier, surcharges: [] };
          }
        })
      );

      console.log('All suppliers with embedded surcharges:', suppliersWithSurcharges);
      setProductSuppliers(suppliersWithSurcharges);

      // Set the primary supplier as active by default
      const primary = suppliersWithSurcharges.find((ps: ProductSupplier) => ps.is_primary);
      if (primary) {
        console.log('Setting primary supplier as active:', primary);
        setActiveSupplier(primary);
      } else if (suppliersWithSurcharges.length > 0) {
        console.log('Setting first supplier as active:', suppliersWithSurcharges[0]);
        setActiveSupplier(suppliersWithSurcharges[0]);
      } else {
        console.log('No suppliers found, setting activeSupplier to null');
        setActiveSupplier(null);
      }
      console.log('=== loadProductSuppliers END ===');
    } catch (error) {
      console.error('Error loading product suppliers:', error);
    }
  };







  const loadProductSurcharges = async (productId: string) => {
    setSurchargesLoading(true);
    try {
      // Only load product-scoped surcharges
      // Supplier surcharges are now embedded in productSuppliers array
      const productSurcharges = await api.surcharges.getByProduct(productId);
      setProductSurcharges(productSurcharges);
    } catch (error) {
      console.error('Error loading product surcharges:', error);
    } finally {
      setSurchargesLoading(false);
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
  brand: (p as any).brand ?? (p as any)[LEGACY_BRAND_KEY] ?? '',
  unit: (p as any).unit ?? (p as any)[LEGACY_UNIT_KEY] ?? '',
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

    const existing = productSuppliers.map(supplier => {

      // Convert to numbers (DB might return Decimal objects or strings)
      const basePrice = Number(supplier.base_price || 0);
      const freightCost = Number(supplier.freight_cost || 0);
      const discountValue = Number(supplier.discount_value || 0);

      const discountAmount = supplier.discount_type === '%'
        ? basePrice * (discountValue / 100)
        : discountValue;

      const slutpris = basePrice + freightCost - discountAmount;

      return { ...supplier, slutpris };

    });







    if (!selectedProduct) {



      return existing;



    }







    const basePrice = Number(newSupplierDraft.base_price ?? 0);



    const freightCost = Number(newSupplierDraft.freight_cost ?? 0);



    const discountValue = Number(newSupplierDraft.discount_value ?? 0);



    const discountAmount = newSupplierDraft.discount_type === '%'



      ? basePrice * (discountValue / 100)



      : discountValue;



    const draftSlutpris = basePrice + freightCost - discountAmount;



    const supplierOption = allSuppliers.find(s => s.id === newSupplierDraft.supplier_id);



    const supplierName = newSupplierDraft.supplier_name || supplierOption?.name || '';







    const draftRow = {



      ...newSupplierDraft,



      supplier_name: supplierName,



      base_price: basePrice,



      freight_cost: freightCost,



      discount_value: discountValue,



      slutpris: Number.isFinite(draftSlutpris) ? draftSlutpris : 0,



      isDraft: true,



    };







    return [...existing, draftRow];



  }, [productSuppliers, newSupplierDraft, allSuppliers, selectedProduct]);







  // Get selected supplier for cost summary (SSOT: derived from activeSupplier)
  const selectedSupplier = activeSupplier
    ? suppliersWithSlutpris.find(s => s.id === activeSupplier.id)
    : null;







  // Handle cell value changes for supplier grid



  const handleSupplierCellChange = useCallback(async (rowId: string, field: string, newValue: any) => {
  if (rowId === NEW_SUPPLIER_ROW_ID) {
    if (field === 'supplier_id') {
      const extracted =
        newValue && typeof newValue === 'object' && 'value' in newValue
          ? {
              value: newValue.value != null ? String(newValue.value) : '',
              label: newValue.label != null ? String(newValue.label) : '',
            }
          : { value: newValue != null ? String(newValue) : '', label: '' };

      if (!extracted.value) {
        setNewSupplierDraft(prev => ({
          ...prev,
          supplier_id: '',
          supplier_name: '',
        }));
        return;
      }

      const supplier = allSuppliers.find(option => option.id === extracted.value);
      setNewSupplierDraft(prev => ({
        ...prev,
        supplier_id: extracted.value,
        supplier_name: supplier?.name ?? extracted.label ?? prev.supplier_name ?? '',
      }));
      return;
    }

    if (field === 'discount_type') {
      setNewSupplierDraft(prev => ({ ...prev, discount_type: newValue === 'KR' ? 'KR' : '%' }));
      return;
    }

    if (field === 'base_price' || field === 'freight_cost' || field === 'discount_value') {
      const numeric = typeof newValue === 'number' ? newValue : parseFloat(String(newValue));
      setNewSupplierDraft(prev => ({
        ...prev,
        [field]: Number.isFinite(numeric) ? numeric : 0,
      }));
      return;
    }

    return;
  }

  let processedValue: any = newValue;
  let selectedLabel: string | null = null;

  if (field === 'discount_type') {
    processedValue = newValue === 'KR' ? 'KR' : '%';
  } else if (field === 'base_price' || field === 'freight_cost' || field === 'discount_value') {
    const numeric = typeof newValue === 'number' ? newValue : parseFloat(String(newValue));
    processedValue = Number.isFinite(numeric) ? numeric : 0;
  } else if (field === 'supplier_id') {
    if (newValue && typeof newValue === 'object' && 'value' in newValue) {
      processedValue = newValue.value != null ? String(newValue.value) : '';
      selectedLabel = newValue.label != null ? String(newValue.label) : null;
    } else {
      processedValue = newValue != null ? String(newValue) : '';
    }
  }

  // Check if the value actually changed to prevent unnecessary API calls
  const currentSupplier = productSuppliers.find(s => s.id === rowId);
  if (!currentSupplier) return;

  const currentValue = currentSupplier[field as keyof ProductSupplier];
  if (currentValue === processedValue) {
    console.log('Value unchanged, skipping update');
    return;
  }

  // Handle supplier change: manage surcharges in the UI
  if (field === 'supplier_id' && selectedProduct) {
    const oldSupplierId = currentSupplier.supplier_id;
    const newSupplierId = processedValue;

    console.log('Supplier change detected:', { oldSupplierId, newSupplierId, productId: selectedProduct.id });

    try {
      // Step 1: Update the supplier in the database first
      await api.productSuppliers.update(rowId, { [field]: processedValue });
      console.log('Updated product supplier');

      // Step 2: Update surcharges in the state
      setSurchargesLoading(true);

      // Remove all supplier-type surcharges from the state
      const productOnlySurcharges = productSurcharges.filter(ps =>
        ps.surcharge?.scope_type !== 'supplier'
      );
      console.log('Removed supplier surcharges, keeping product surcharges:', productOnlySurcharges.length);

      // Step 3: Get new supplier's surcharges and add them to state
      let newSurcharges = productOnlySurcharges;
      if (newSupplierId) {
        try {
          const supplierSurcharges = await api.suppliers.getSurcharges(newSupplierId);
          console.log('New supplier surcharges to add:', supplierSurcharges.length);

          // Add the new supplier surcharges to the state
          newSurcharges = [...productOnlySurcharges, ...supplierSurcharges];
        } catch (err) {
          console.warn('Could not fetch new supplier surcharges:', err);
        }
      }

      // Update the surcharges state
      setProductSurcharges(newSurcharges);
      setSurchargesLoading(false);
      console.log('Updated surcharges state');

      // Step 4: Update local supplier state and active supplier
      setProductSuppliers(prev =>
        prev.map(supplier => {
          if (supplier.id === rowId) {
            const nextSupplier: any = { ...supplier, [field]: processedValue };
            const supplierInfo = allSuppliers.find(s => s.id === processedValue);
            nextSupplier.supplier_name =
              supplierInfo?.name ?? selectedLabel ?? supplier.supplier_name ?? '';

            // Update active supplier if this is the active one
            if (activeSupplier?.id === rowId) {
              setActiveSupplier(nextSupplier);
            }
            return nextSupplier;
          }
          return supplier;
        }),
      );
    } catch (error) {
      console.error('Error updating product supplier and surcharges:', error);
      setSurchargesLoading(false);
    }
    return;
  }

  // For non-supplier_id changes, update the supplier and active supplier if needed
  setProductSuppliers(prev =>
    prev.map(supplier => {
      if (supplier.id === rowId) {
        const nextSupplier: any = { ...supplier, [field]: processedValue };
        if (field === 'supplier_id') {
          const supplierInfo = allSuppliers.find(s => s.id === processedValue);
          nextSupplier.supplier_name =
            supplierInfo?.name ?? selectedLabel ?? supplier.supplier_name ?? '';
        }

        // Update active supplier if this is the active one
        if (activeSupplier?.id === rowId) {
          setActiveSupplier(nextSupplier);
        }
        return nextSupplier;
      }
      return supplier;
    }),
  );

  try {
    await api.productSuppliers.update(rowId, { [field]: processedValue });
  } catch (error) {
    console.error('Error updating product supplier:', error);
  }
}, [allSuppliers, api, setProductSuppliers, setNewSupplierDraft, selectedProduct, loadProductSurcharges, productSuppliers, activeSupplier]);

const createSupplierFromDraft = useCallback(async (draft: NewSupplierDraft) => {



    if (!selectedProduct) return;



    if (!draft.supplier_id) return;







    const alreadyLinked = productSuppliers.some(



      supplier => supplier.supplier_id === draft.supplier_id



    );







    if (alreadyLinked) {



      console.warn('Supplier is already linked to this product.');



      setNewSupplierDraft(createEmptySupplierDraft());



      return;



    }







    setIsCreatingSupplier(true);



    try {



      const payload = {



        product_id: selectedProduct.id,



        supplier_id: draft.supplier_id,



        base_price: Number(draft.base_price ?? 0),



        freight_cost: Number(draft.freight_cost ?? 0),



        discount_type: draft.discount_type || '%',



        discount_value: Number(draft.discount_value ?? 0),



      };







      const created = await api.productSuppliers.create(payload);







      // Add surcharges array to the new supplier
      const createdWithSurcharges = { ...created, surcharges: [] };

      setProductSuppliers(prev => [...prev, createdWithSurcharges]);

      // Set the newly created supplier as active
      setActiveSupplier(createdWithSurcharges);

      setNewSupplierDraft(createEmptySupplierDraft());



    } catch (error) {



      console.error('Error creating product supplier:', error);



    } finally {



      setIsCreatingSupplier(false);



    }



  }, [selectedProduct, productSuppliers, setProductSuppliers, setActiveSupplier, setNewSupplierDraft, setIsCreatingSupplier]);

const handleSurchargeCellValueChange = useCallback(async (rowId: string, field: string, rawValue: any) => {
  console.log('=== handleSurchargeCellValueChange ===', { rowId, field, rawValue });

  // Handle new surcharge row
  if (rowId === NEW_SURCHARGE_ROW_ID) {
    let updatedData = { ...newSurchargeData };

    // Handle name field - can be either existing surcharge selection or new name input
    if (field === 'name') {
      if (typeof rawValue === 'object' && rawValue?.value) {
        // Selecting an existing surcharge - create product surcharge relationship
        if (!selectedProduct) return;

        try {
          await api.surcharges.addProduct(rawValue.value, selectedProduct.id);

          // Reload product surcharges
          const updated = await api.surcharges.getByProduct(selectedProduct.id);
          setProductSurcharges(updated);
          setNewSurchargeData({ name: '', cost_type: '%', cost_value: 0, scope_type: 'product', source: 'final_price' });
        } catch (error) {
          console.error('Error creating product surcharge:', error);
        }
      } else {
        // Entering a new surcharge name
        updatedData.name = rawValue || '';
        setNewSurchargeData(updatedData);
      }
      return;
    }

    // Handle scope_type field
    if (field === 'scope_type') {
      updatedData.scope_type = rawValue as 'product' | 'supplier';
      setNewSurchargeData(updatedData);
      return;
    }

    // Handle source field
    if (field === 'source') {
      updatedData.source = rawValue as 'final_price' | 'calculation_price';
      setNewSurchargeData(updatedData);
      return;
    }

    // Handle cost_type field
    if (field === 'cost_type') {
      updatedData.cost_type = rawValue as '%' | 'KR';
      setNewSurchargeData(updatedData);
      return;
    }

    // Handle cost_value field
    if (field === 'cost_value') {
      const valueAsNumber = Number(rawValue);
      updatedData.cost_value = Number.isFinite(valueAsNumber) ? valueAsNumber : 0;
      setNewSurchargeData(updatedData);

      // Only create surcharge when Värde field is filled and all required fields are present
      const hasName = updatedData.name && updatedData.name.trim().length > 0;
      const hasCostType = updatedData.cost_type && (updatedData.cost_type === '%' || updatedData.cost_type === 'KR');
      const hasCostValue = Number.isFinite(updatedData.cost_value) && updatedData.cost_value !== 0;

      if (hasName && hasCostType && hasCostValue) {
        if (!selectedProduct) return;

        try {
          // Determine scope based on selected type
          const scopeType = updatedData.scope_type || 'product';
          let scopeId = selectedProduct.id;

          // If supplier type, use the active supplier's ID
          if (scopeType === 'supplier') {
            if (!activeSupplier) {
              console.error('No supplier selected for supplier-scoped surcharge');
              return;
            }
            scopeId = activeSupplier.id;
          }

          // Create the new surcharge
          const newSurcharge = await api.surcharges.create({
            name: updatedData.name.trim(),
            cost_type: updatedData.cost_type,
            cost_value: updatedData.cost_value,
            scope_type: scopeType,
            scope_id: scopeId,
            is_active: true,
            source: updatedData.source || 'final_price',
          });

          // Reload surcharges
          await loadProductSurcharges(selectedProduct.id);
          setNewSurchargeData({ name: '', cost_type: '%', cost_value: 0, scope_type: 'product', source: 'final_price' });
          await loadAllSurcharges(); // Reload to include the new surcharge
        } catch (error) {
          console.error('Error creating surcharge:', error);
        }
      }
      return;
    }

    // Other fields
    updatedData = { ...updatedData, [field]: rawValue };
    setNewSurchargeData(updatedData);
    return;
  }

  // Handle existing surcharge updates
  if (!selectedProduct) return;

  // Find the surcharge to update - check both product and supplier surcharges
  let surchargeToUpdate = productSurcharges.find(ps => ps.id === rowId);
  let isSupplierSurcharge = false;

  // If not found in product surcharges, check supplier surcharges
  if (!surchargeToUpdate && activeSupplier?.surcharges) {
    console.log('Checking supplier surcharges:', activeSupplier.surcharges);
    const supplierSurcharge = activeSupplier.surcharges.find(s => s.id === rowId);
    console.log('Found supplier surcharge:', supplierSurcharge);

    if (supplierSurcharge) {
      isSupplierSurcharge = true;
      // Convert supplier surcharge format to match productSurcharge format
      surchargeToUpdate = {
        id: supplierSurcharge.id,
        surcharge_id: supplierSurcharge.surcharge_id,
        product_id: selectedProduct.id,
        surcharge: supplierSurcharge.surcharge || supplierSurcharge,
      } as any;
      console.log('Converted supplier surcharge:', surchargeToUpdate);
    }
  }

  if (!surchargeToUpdate) {
    console.warn('Surcharge not found:', rowId);
    return;
  }

  console.log('Processing surcharge update:', {
    rowId,
    field,
    rawValue,
    isSupplierSurcharge,
    surchargeToUpdate
  });

  try {
    // Handle computed_amount changes (reverse-calculate cost_value)
    if (field === 'computed_amount') {
      const newComputedAmount = Number(rawValue) || 0;

      // Get source and cost_type from the surcharge
      const source = surchargeToUpdate.surcharge?.source || 'final_price';
      const costType = surchargeToUpdate.surcharge?.cost_type || '%';

      // Calculate base amount - need to get supplier with slutpris
      const suppliersWithSlutprisLocal = productSuppliers.map(supplier => {
        const basePrice = Number(supplier.base_price || 0);
        const freightCost = Number(supplier.freight_cost || 0);
        const discountValue = Number(supplier.discount_value || 0);
        const discountAmount = supplier.discount_type === '%'
          ? basePrice * (discountValue / 100)
          : discountValue;
        const slutpris = basePrice + freightCost - discountAmount;
        return { ...supplier, slutpris };
      });

      const selectedSupplier = suppliersWithSlutprisLocal.find(s => s.id === activeSupplier?.id);
      if (!selectedSupplier) return;

      // Calculate what the base amount is for this surcharge
      let baseAmount = selectedSupplier.slutpris;
      if (source === 'calculation_price') {
        // For kalkylpris, need to sum up all surcharges before this one
        // This is simplified - we'll use slutpris for now since exact calculation
        // requires knowing the order of all surcharges
        // TODO: If needed, implement full cascade calculation here
        baseAmount = selectedSupplier.slutpris;
      }

      // Reverse-calculate cost_value
      let newCostValue = 0;
      if (costType === '%') {
        // computed_amount = baseAmount * (cost_value / 100)
        // cost_value = (computed_amount / baseAmount) * 100
        newCostValue = baseAmount > 0 ? (newComputedAmount / baseAmount) * 100 : 0;
      } else {
        // For KR, cost_value = computed_amount
        newCostValue = newComputedAmount;
      }

      console.log('Reverse-calculated cost_value:', {
        newComputedAmount,
        baseAmount,
        costType,
        newCostValue
      });

      // Update the surcharge with new cost_value
      await api.surcharges.update(surchargeToUpdate.surcharge_id, {
        cost_value: Number(newCostValue.toFixed(2))
      });

      // Reload surcharges
      const updated = await api.surcharges.getByProduct(selectedProduct.id);
      setProductSurcharges(updated);
      await loadAllSurcharges();
      await loadProductSuppliers(selectedProduct.id);
      return;
    }

    // Update the surcharge based on field
    if (field === 'cost_type' || field === 'cost_value' || field === 'source') {
      // Update the surcharge itself
      const updateData: any = {};

      if (field === 'cost_type') {
        updateData.cost_type = rawValue;
      } else if (field === 'cost_value') {
        updateData.cost_value = Number(rawValue) || 0;
      } else if (field === 'source') {
        updateData.source = rawValue;
        console.log('Updating source:', { surcharge_id: surchargeToUpdate.surcharge_id, newSource: rawValue });
      }

      // Optimistic update - immediately update the UI
      const oldProductSurcharges = [...productSurcharges];
      const oldProductSuppliers = [...productSuppliers];

      // Update productSurcharges optimistically
      const optimisticProductSurcharges = productSurcharges.map(ps => {
        if (ps.id === rowId) {
          return {
            ...ps,
            surcharge: {
              ...ps.surcharge,
              ...updateData,
            },
          };
        }
        return ps;
      });
      setProductSurcharges(optimisticProductSurcharges);

      // Update supplier surcharges optimistically if needed
      if (isSupplierSurcharge && activeSupplier) {
        const optimisticSuppliers = productSuppliers.map(supplier => {
          if (supplier.id === activeSupplier.id) {
            return {
              ...supplier,
              surcharges: supplier.surcharges.map(s => {
                if (s.id === rowId) {
                  return {
                    ...s,
                    surcharge: {
                      ...(s.surcharge || s),
                      ...updateData,
                    },
                  };
                }
                return s;
              }),
            };
          }
          return supplier;
        });
        setProductSuppliers(optimisticSuppliers);

        // Update active supplier as well
        const updatedActiveSupplier = optimisticSuppliers.find(s => s.id === activeSupplier.id);
        if (updatedActiveSupplier) {
          setActiveSupplier(updatedActiveSupplier);
        }
      }

      try {
        console.log('Updating surcharge:', { surcharge_id: surchargeToUpdate.surcharge_id, updateData });
        await api.surcharges.update(surchargeToUpdate.surcharge_id, updateData);

        // Reload surcharges to ensure consistency
        console.log('Reloading surcharges after update...');
        const updated = await api.surcharges.getByProduct(selectedProduct.id);
        setProductSurcharges(updated);
        await loadAllSurcharges(); // Reload all surcharges to reflect changes

        // IMPORTANT: Reload supplier surcharges too (they have embedded surcharges)
        await loadProductSuppliers(selectedProduct.id);
        console.log('Surcharge update complete');
      } catch (error) {
        console.error('Error updating surcharge, reverting optimistic update:', error);

        // Revert optimistic update on error
        setProductSurcharges(oldProductSurcharges);
        setProductSuppliers(oldProductSuppliers);

        // Restore active supplier
        const restoredActiveSupplier = oldProductSuppliers.find(s => s.id === activeSupplier?.id);
        if (restoredActiveSupplier) {
          setActiveSupplier(restoredActiveSupplier);
        }

        // TODO: Show toast error notification
        alert('Kunde inte spara ändringen. Var god försök igen.');
        throw error; // Re-throw to be caught by outer catch
      }
    }
  } catch (error) {
    console.error('Error updating surcharge:', error);
  }
}, [selectedProduct, productSurcharges, newSurchargeData, api, setProductSurcharges, loadAllSurcharges, activeSupplier, loadProductSurcharges, loadProductSuppliers, productSuppliers]);





  useEffect(() => {



    if (!selectedProduct) return;



    if (isCreatingSupplier) return;



    if (!newSupplierDraft.supplier_id) return;



    const basePriceValue = Number(newSupplierDraft.base_price);



    if (!Number.isFinite(basePriceValue) || basePriceValue <= 0) return;







    createSupplierFromDraft(newSupplierDraft);



  }, [newSupplierDraft, selectedProduct, isCreatingSupplier, createSupplierFromDraft]);











  // Calculate surcharges with computed amounts (DRY: combines product + active supplier surcharges)
  const surchargesWithAmounts = useMemo(() => {
    console.log('=== surchargesWithAmounts calculation START ===');
    console.log('activeSupplier:', activeSupplier);
    console.log('productSurcharges:', productSurcharges);

    if (!activeSupplier) {
      console.log('No active supplier, returning only product surcharges');
      return productSurcharges.map(p => ({ ...p, computed_amount: p.computed_amount || 0 }));
    }

    console.log('activeSupplier.surcharges:', activeSupplier.surcharges);
    console.log('Number of supplier surcharges:', activeSupplier.surcharges?.length || 0);

    // SSOT: Combine product surcharges with active supplier's embedded surcharges
    const supplierSurchargesMapped = (activeSupplier.surcharges || []).map(s => {
      console.log('Mapping supplier surcharge:', s);
      // Supplier surcharges have a nested 'surcharge' object with the actual data
      const surchargeData = s.surcharge || s;
      return {
        id: s.id,
        surcharge_id: s.surcharge_id || s.id,
        product_id: selectedProduct?.id || '',
        scope_type: surchargeData.type || surchargeData.scope_type || 'supplier',
        scope_id: s.supplier_id,
        surcharge: {
          id: surchargeData.id,
          name: surchargeData.name,
          cost_type: surchargeData.cost_type,
          cost_value: surchargeData.cost_value,
          scope_type: surchargeData.type || surchargeData.scope_type || 'supplier',
          source: surchargeData.source || 'final_price', // ✅ Added
          sort_order: surchargeData.sort_order || 0, // ✅ Added
        },
        computed_amount: 0, // Will be calculated below
      };
    });

    console.log('Mapped supplier surcharges:', supplierSurchargesMapped);

    const combinedSurcharges = [
      ...productSurcharges,
      ...supplierSurchargesMapped
    ];

    console.log('Combined surcharges (product + supplier):', combinedSurcharges);
    console.log('Total combined surcharges:', combinedSurcharges.length);

    const selectedSupplier = suppliersWithSlutpris.find(s => s.id === activeSupplier.id);
    console.log('selectedSupplier from suppliersWithSlutpris:', selectedSupplier);

    if (!selectedSupplier) {
      console.warn('Could not find selectedSupplier in suppliersWithSlutpris!');
      return combinedSurcharges.map(p => ({ ...p, computed_amount: p.computed_amount || 0 }));
    }

    // Sort by sort_order and apply cascading calculation based on source
    const result = combinedSurcharges
      .sort((a, b) => (a.surcharge.sort_order || 0) - (b.surcharge.sort_order || 0))
      .reduce((acc, p) => {
        let computed_amount = 0;

        // Determine base amount based on source (källa)
        const source = p.surcharge.source || 'final_price';
        const baseAmount = source === 'calculation_price'
          ? acc.runningTotal  // Kalkylpris: use accumulated total
          : selectedSupplier.slutpris;  // Slutpris: use fixed supplier price

        // Convert cost_value to number (it might be a Decimal or string from DB)
        const costValue = Number(p.surcharge.cost_value);

        console.log(`Calculating ${p.surcharge.name}:`, {
          source,
          cost_type: p.surcharge.cost_type,
          cost_value: costValue,
          baseAmount,
          slutpris: selectedSupplier.slutpris,
          runningTotal: acc.runningTotal
        });

        // Calculate surcharge amount
        if (p.surcharge.cost_type === '%') {
          if (!isNaN(baseAmount) && !isNaN(costValue)) {
            computed_amount = baseAmount * (costValue / 100);
          } else {
            console.error(`Cannot calculate percentage: baseAmount=${baseAmount}, costValue=${costValue}`);
            computed_amount = 0;
          }
        } else {
          computed_amount = isNaN(costValue) ? 0 : costValue; // Fixed KR amount
        }

        console.log(`Computed ${p.surcharge.name} (source: ${source}): base=${Number(baseAmount).toFixed(2)}, amount=${computed_amount.toFixed(2)}, running=${(acc.runningTotal + computed_amount).toFixed(2)}`);

        // Add to result array and update running total
        acc.results.push({ ...p, computed_amount });
        acc.runningTotal += computed_amount;

        return acc;
      }, { results: [] as any[], runningTotal: Number(selectedSupplier.slutpris || 0) })
      .results;

    console.log('=== Final surchargesWithAmounts result ===');
    console.log('Result:', result);
    console.log('=== surchargesWithAmounts calculation END ===');

    return result;
  }, [productSurcharges, activeSupplier, suppliersWithSlutpris, selectedProduct]);







  // Calculate total surcharge costs



  const totalSurchargeCosts = useMemo(() => {



    return surchargesWithAmounts.reduce((sum, p) => sum + p.computed_amount, 0);



  }, [surchargesWithAmounts]);







  const currencyFormat = useMemo(



    () =>



      new Intl.NumberFormat('sv-SE', {



        minimumFractionDigits: 2,



        maximumFractionDigits: 2,



      }),



    [],



  );







const supplierDropdownOptions = useMemo<AutocompleteOption[]>(() => {
  // Get IDs of already added suppliers
  const addedSupplierIds = new Set(
    productSuppliers
      .filter(ps => ps.supplier_id) // Exclude the new row
      .map(ps => ps.supplier_id)
  );

  // Filter out already added suppliers
  return allSuppliers
    .filter(s => !addedSupplierIds.has(s.id))
    .map(option => ({ label: option.name, value: option.id }));
}, [allSuppliers, productSuppliers]);







  const discountTypeOptions = useMemo(



    () => [



      { label: 'Procent (%)', value: '%' },



      { label: 'Kronor (KR)', value: 'KR' },



    ],



    [],



  );







  // Automatically update purchase price when calculated price changes



  useEffect(() => {



    const updatePurchasePrice = async () => {



      if (selectedProduct && selectedSupplier) {



        const calculatedPrice = selectedSupplier.slutpris + totalSurchargeCosts;







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



  }, [selectedSupplier, totalSurchargeCosts, selectedProduct]);











  const surchargesWithNewRow = useMemo(() => {
    console.log('=== surchargesWithNewRow calculation ===');
    console.log('surchargesWithAmounts:', surchargesWithAmounts);

    const newRow: ProductSurcharge & { id: string; surcharge_id: string } = {
      id: NEW_SURCHARGE_ROW_ID,
      surcharge_id: '',
      product_id: selectedProduct?.id || '',
      scope_type: newSurchargeData.scope_type || 'product',
      scope_id: newSurchargeData.scope_type === 'supplier' ? (activeSupplier?.id || '') : (selectedProduct?.id || ''),
      surcharge: {
        id: '',
        name: newSurchargeData.name || '',
        cost_type: newSurchargeData.cost_type,
        cost_value: newSurchargeData.cost_value,
        scope_type: newSurchargeData.scope_type || 'product',
        source: newSurchargeData.source || 'final_price',
      },
      computed_amount: 0,
    };

    // Use surchargesWithAmounts (which includes both product + supplier surcharges) instead of productSurcharges
    const result = [...surchargesWithAmounts, newRow];
    console.log('surchargesWithNewRow result:', result);
    return result;
  }, [surchargesWithAmounts, newSurchargeData, selectedProduct, activeSupplier]);

  const surchargeDropdownOptions = useMemo(() => {
    // Get IDs of already added surcharges
    const addedSurchargeIds = new Set(
      productSurcharges
        .filter(ps => ps.surcharge_id) // Exclude the new row
        .map(ps => ps.surcharge_id)
    );

    // Filter out already added surcharges - only show product-scoped surcharges
    return allSurcharges
      .filter(s => s.scope_type === 'product' && s.is_active && !addedSurchargeIds.has(s.id))
      .map(s => ({
        value: s.id,
        label: s.name,
      }));
  }, [allSurcharges, productSurcharges]);

  const costTypeOptions = useMemo(
    () => [
      { label: 'Procent (%)', value: '%' },
      { label: 'Kronor (KR)', value: 'KR' },
    ],
    [],
  );

  const scopeTypeOptions = useMemo(
    () => [
      { label: 'Produkt', value: 'product' },
      { label: 'Leverantör', value: 'supplier' },
    ],
    [],
  );

  const surchargeColumns = useMemo<GridColumn[]>(() => [
    {
      field: 'name',
      headerName: 'Påslag',
      width: 200,
      editable: true,
      isEditable: (row: any) => true, // Allow editing all rows
      cellType: 'autocomplete',
      autocompletePlaceholder: 'Skriv påslagsnamn...',
      autocompleteOptions: () => surchargeDropdownOptions,
      autocompleteCreateLabel: 'Skapa "{input}"',
      onCreateAutocompleteOption: async (input: string, row: any) => {
        // Check if a surcharge with this name already exists in productSurcharges
        const existingInProduct = productSurcharges.find(
          ps => ps.surcharge?.name?.toLowerCase() === input.trim().toLowerCase()
        );

        if (existingInProduct) {
          // Don't allow creating - this surcharge is already added to the product
          return null;
        }

        // Check if a surcharge with this name exists in allSurcharges (but not yet added to product)
        const existingInAll = allSurcharges.find(
          s => s.name?.toLowerCase() === input.trim().toLowerCase()
        );

        if (existingInAll) {
          // Don't allow creating - suggest selecting from dropdown instead
          return null;
        }

        // Allow creating new surcharge - we'll create it when all fields are filled
        return { value: input, label: input };
      },
      filterTextGetter: (_value: any, row: any) => row.surcharge?.name || '',
      valueGetter: (params: any) => params.surcharge?.name || '',
      valueParser: (cell) => {
        const autocompleteCell = cell as any;
        return autocompleteCell.text ?? autocompleteCell.selectedValue ?? '';
      },
    },
    {
      field: 'scope_type',
      headerName: 'Typ',
      width: 140,
      editable: true,
      isEditable: (row: any) => row.id === NEW_SURCHARGE_ROW_ID, // Only allow editing on new row
      sortable: true,
      cellType: 'customDropdown',
      dropdownOptions: () => scopeTypeOptions,
      valueGetter: (row: any) => row.surcharge?.type || row.scope_type || 'product',
      filterTextGetter: (_value: any, row: any) => {
        const scopeType = row.surcharge?.type || row.scope_type || 'product';
        return scopeType === 'product' ? 'Produkt' : 'Leverantör';
      },
    },
    {



      field: 'cost_type',



      headerName: 'Enhet',



      width: 120,



      editable: true,
      isEditable: (row: any) => true, // Allow editing all rows
      cellType: 'customDropdown',
      dropdownOptions: () => costTypeOptions,
      valueGetter: (params: any) => params.surcharge?.cost_type || '%',
      filterTextGetter: (value: any) => value === '%' ? 'Procent (%)' : 'Kronor (KR)',



    },



    {
      field: 'cost_value',
      headerName: 'Värde',
      width: 120,
      cellType: 'number',
      editable: true,
      isEditable: (row: any) => true, // Allow editing all rows
      valueGetter: (params: any) => params.surcharge?.cost_value || 0,
      // Removed cellRenderer to allow editing in new row
      // Note: existing rows will show plain numbers without % or kr suffix
    },
    {
      field: 'source',
      headerName: 'Källa',
      width: 140,
      editable: true,
      isEditable: (row: any) => true, // Allow editing all rows
      sortable: true,
      cellType: 'customDropdown',
      dropdownOptions: () => [
        { label: 'Slutpris', value: 'final_price' },
        { label: 'Kalkylpris', value: 'calculation_price' }
      ],
      valueGetter: (row: any) => row.surcharge?.source || 'final_price',
      filterTextGetter: (_value: any, row: any) => {
        const source = row.surcharge?.source || 'final_price';
        return source === 'final_price' ? 'Slutpris' : 'Kalkylpris';
      },
    },
    {
      field: 'computed_amount',
      headerName: 'Summa',
      width: 140,
      cellType: 'number',
      editable: true,
      isEditable: (row: any) => true, // Allow editing all rows
      valueGetter: (row: any) => Number(row.computed_amount || 0),
      valueFormatter: (value) => `${Number(value || 0).toFixed(2)} kr`,
      numberFormat: new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    },
    {
      field: 'actions',
      headerName: '',
      width: 30,
      editable: false,
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
                if (!selectedProduct) return;

                try {
                  // Remove the product surcharge
                  await api.surcharges.removeProduct(row.surcharge_id, selectedProduct.id);

                  // Reload the surcharges
                  const updated = await api.surcharges.getByProduct(selectedProduct.id);
                  setProductSurcharges(updated);
                } catch (error) {
                  console.error('Error removing surcharge:', error);
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



  ], [surchargeDropdownOptions, costTypeOptions, scopeTypeOptions, selectedProduct, api, setProductSurcharges]);







  const supplierColumns = useMemo<GridColumn[]>(() => [

  {

    field: 'selected',

    headerName: 'Välj',

    width: 80,

    editable: false,

    cellRenderer: (_value: any, row: any) => {

      if (row.id === NEW_SUPPLIER_ROW_ID) {

        return (

          <div className="flex items-center justify-center text-xs text-slate-400 h-full">

            Ny

          </div>

        );

      }



      return (

        <div className="flex items-center justify-center h-full">

          <input

            type="radio"

            name="selectedSupplier"

            checked={activeSupplier?.id === row.id}

            onChange={async () => {

              // Find the full supplier object and set it as active
              const supplier = suppliersWithSlutpris.find(s => s.id === row.id);
              if (supplier) {
                setActiveSupplier(productSuppliers.find(ps => ps.id === row.id) || null);
              }



              if (selectedProduct) {

                const supplier = suppliersWithSlutpris.find(s => s.id === row.id);

                if (supplier) {

                  const newPurchasePrice = supplier.slutpris + totalSurchargeCosts;



                  setProducts(prev => prev.map(p =>

                    p.id === selectedProduct.id

                      ? { ...p, purchase_price: newPurchasePrice }

                      : p

                  ));



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

    field: 'supplier_id',
    headerName: 'Leverantör',
    width: 220,
    editable: true,
    isEditable: (row: any) => true, // Allow editing all rows
    cellType: 'autocomplete',
    autocompletePlaceholder: 'Välj leverantör...',
    autocompleteOptions: () => supplierDropdownOptions,
    autocompleteCreateLabel: 'Skapa "{input}"',
    onCreateAutocompleteOption: async (input: string, row: any) => {
      // Check if a supplier with this name already exists in productSuppliers
      const existingInProduct = productSuppliers.find(
        ps => ps.supplier_name?.toLowerCase() === input.trim().toLowerCase()
      );

      if (existingInProduct) {
        // Don't allow creating - this supplier is already added to the product
        return null;
      }

      // Check if a supplier with this name exists in allSuppliers (but not yet added to product)
      const existingInAll = allSuppliers.find(
        s => s.name?.toLowerCase() === input.trim().toLowerCase()
      );

      if (existingInAll) {
        // Don't allow creating - suggest selecting from dropdown instead
        return null;
      }

      // Create new supplier
      try {
        const newSupplier = await api.suppliers.create({
          name: input,
          code: input.toUpperCase().replace(/\s+/g, '_'),
        });
        setAllSuppliers(prev => [...prev, newSupplier]);
        return { value: newSupplier.id, label: newSupplier.name };
      } catch (error) {
        console.error('Error creating supplier:', error);
        return null;
      }
    },
    valueGetter: (row: any) => row.supplier_name || '',
    filterTextGetter: (_value: any, row: any) => row.supplier_name || '',
    valueParser: (cell) => ({
      value: (cell as AutocompleteCell).selectedValue ?? '',
      label: (cell as AutocompleteCell).text ?? '',
    }),

  },

  {

    field: 'base_price',

    headerName: 'Grundpris',

    width: 120,

    cellType: 'number',

    editable: true,

    numberFormat: currencyFormat,

  },

  {

    field: 'discount_type',

    headerName: 'Rabatttyp',

    width: 120,

    cellType: 'customDropdown',

    editable: true,

    dropdownOptions: () => discountTypeOptions,

  },

  {

    field: 'discount_value',

    headerName: 'Rabatt',

    width: 140,

    cellType: 'number',

    editable: true,

  },

  {

    field: 'slutpris',

    headerName: 'Slutpris',

    width: 140,

    cellType: 'number',

    editable: false,

    numberFormat: currencyFormat,

  },
  {
    field: 'actions',
    headerName: '',
    width: 30,
    editable: false,
    cellRenderer: (_value: any, row: any) => {
      // Don't show delete button for new row
      if (row.id === NEW_SUPPLIER_ROW_ID) {
        return null;
      }

      return (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!selectedProduct) return;

              try {
                // Remove the product supplier
                await api.productSuppliers.delete(row.id);

                // Reload the suppliers
                const updated = await api.productSuppliers.getByProduct(selectedProduct.id);
                setProductSuppliers(updated);
              } catch (error) {
                console.error('Error removing supplier:', error);
              }
            }}
            className="p-1 hover:bg-red-50 rounded transition-colors"
            title="Ta bort leverantör"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      );
    },
  },

], [

  activeSupplier,

  productSuppliers,

  suppliersWithSlutpris,

  selectedProduct,

  totalSurchargeCosts,

  supplierDropdownOptions,

  discountTypeOptions,

  api,

]);

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
    field: 'brand',
    headerName: 'Varumärke',
    width: 150,
    editable: true,
    valueFormatter: (value) => value || '-',
  },
  {
    field: 'unit',
    headerName: 'Enhet',
    width: 100,
    editable: true,
    valueFormatter: (value) => value || '-',
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
        maximumFractionDigits: 2,
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
        green: { badge: 'bg-green-100 text-green-700 ring-green-200', dot: 'bg-green-600' },
        orange: { badge: 'bg-amber-100 text-amber-700 ring-amber-200', dot: 'bg-amber-600' },
        red: { badge: 'bg-rose-100 text-rose-700 ring-rose-200', dot: 'bg-rose-600' },
        gray: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-500' },
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
      const tooltip = lastSync ? `Last sync: ${lastSync}` : undefined;

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



          <p className="text-slate-600">Loading products...</p>



        </div>



      </div>



    );



  }







  const handleCellClick = (row: ProductRow, field: string) => {



    console.log('Cell clicked:', row, field);



    setSelectedProduct(row);







    // If clicking on purchase_price (Purchase Price), open only bottom panel



    if (field === 'purchase_price') {



      console.log('Opening bottom panel for Purchase Price');



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



              New product



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



              <h3 className="text-xs font-medium text-slate-500">Purchase Price</h3>



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



      {/* Left side: Supplier Grid and Surcharges */}



      <div className="flex-1 flex flex-col max-w-[1300px] ">











        {/* Supplier Grid */}



         <div className="overflow-visible">



          <SpreadsheetGrid



            columns={supplierColumns}



            data={suppliersWithSlutpris}



            height="100%"



            showFilter={false}



            onCellValueChanged={handleSupplierCellChange}



          />



        </div>







        {/* Surcharge Grid */}



        <div className="overflow-visible relative">

          {surchargesLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="text-slate-600">Loading surcharges...</div>
            </div>
          )}

          <SpreadsheetGrid

            columns={surchargeColumns}

            data={surchargesWithNewRow}

            height="100%"

            showFilter={false}
            sortable={true}

            onCellValueChanged={handleSurchargeCellValueChange}



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



              <div className="text-xs text-slate-500 mb-1">Supplier</div>



              <div className="text-sm font-semibold text-slate-900">{selectedSupplier.supplier_name}</div>



            </div>







            {/* Breakdown */}



            <div className="bg-white rounded p-3 shadow-sm space-y-2 text-sm">



              <div className="flex justify-between">



                <span className="text-slate-600">Baspris</span>



                <span className="font-medium">{selectedSupplier.base_price.toFixed(2)} kr</span>



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



                <div className="text-xs font-semibold text-slate-700 mb-1">Surcharge:</div>



                {surchargesWithAmounts.map(p => (



                  <div key={p.id} className="flex justify-between text-xs">



                    <span className="text-slate-600">



                      {p.surcharge.name} {p.surcharge.cost_type === '%' ? `(${p.surcharge.cost_value}%)` : ''}



                    </span>



                    <span className="font-medium">+ {(p.computed_amount || 0).toFixed(2)} kr</span>



                  </div>



                ))}



                {surchargesWithAmounts.length > 0 && (



                  <div className="flex justify-between pt-1 border-t border-slate-100">



                    <span className="text-slate-700 font-medium">Totalt surcharge</span>



                    <span className="font-medium">+ {totalSurchargeCosts.toFixed(2)} kr</span>



                  </div>



                )}



              </div>



              <div className="border-t border-slate-200 pt-2">



                <div className="flex justify-between items-center">



                  <span className="font-semibold text-slate-900">Totalt Purchase Price</span>



                  <span className="text-lg font-bold text-blue-600">



                    {(selectedSupplier.slutpris + totalSurchargeCosts).toFixed(2)} kr



                  </span>



                </div>



              </div>



            </div>



          </div>



        ) : (



          <div className="text-sm text-slate-500">Select a supplier</div>



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







