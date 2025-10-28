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







  // Supplier state for Kalkylpris editor



  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);



  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');



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



    try {



      const data = await api.productSuppliers.getByProduct(productId);



      setProductSuppliers(data);



      // Set the primary supplier as selected by default



      const primary = data.find((ps: ProductSupplier) => ps.is_primary);



      if (primary) {



        setSelectedSupplierId(primary.id);



      } else if (data.length > 0) {



        setSelectedSupplierId(data[0].id);



      } else {



        setSelectedSupplierId('');



      }



    } catch (error) {



      console.error('Error loading product suppliers:', error);



    }



  };







  const loadProductSurcharges = async (productId: string) => {
    setSurchargesLoading(true);

    try {

      // Load product-scoped surcharges
      const productSurcharges = await api.surcharges.getByProduct(productId);

      // Load supplier-scoped surcharges for all suppliers of this product
      const suppliers = await api.productSuppliers.getByProduct(productId);
      const supplierSurchargesPromises = suppliers.map((supplier: ProductSupplier) =>
        api.productSuppliers.getSurcharges(supplier.id)
      );
      const supplierSurchargesArrays = await Promise.all(supplierSurchargesPromises);
      const supplierSurcharges = supplierSurchargesArrays.flat();

      // Combine both types
      const allSurcharges = [...productSurcharges, ...supplierSurcharges];

      setProductSurcharges(allSurcharges);



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



      const discountAmount = supplier.discount_type === '%'



        ? supplier.base_price * (supplier.discount_value / 100)



        : supplier.discount_value;



      const slutpris = supplier.base_price + supplier.freight_cost - discountAmount;



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







  // Get selected supplier for cost summary



  const selectedSupplier = suppliersWithSlutpris.find(s => s.id === selectedSupplierId);







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

      // Step 4: Update local supplier state
      setProductSuppliers(prev =>
        prev.map(supplier => {
          if (supplier.id === rowId) {
            const nextSupplier: any = { ...supplier, [field]: processedValue };
            const supplierInfo = allSuppliers.find(s => s.id === processedValue);
            nextSupplier.supplier_name =
              supplierInfo?.name ?? selectedLabel ?? supplier.supplier_name ?? '';
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

  // For non-supplier_id changes, use the original logic
  setProductSuppliers(prev =>
    prev.map(supplier => {
      if (supplier.id === rowId) {
        const nextSupplier: any = { ...supplier, [field]: processedValue };
        if (field === 'supplier_id') {
          const supplierInfo = allSuppliers.find(s => s.id === processedValue);
          nextSupplier.supplier_name =
            supplierInfo?.name ?? selectedLabel ?? supplier.supplier_name ?? '';
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
}, [allSuppliers, api, setProductSuppliers, setNewSupplierDraft, selectedProduct, loadProductSurcharges, productSuppliers]);

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







      setProductSuppliers(prev => [...prev, created]);



      setSelectedSupplierId(created.id);



      setNewSupplierDraft(createEmptySupplierDraft());



    } catch (error) {



      console.error('Error creating product supplier:', error);



    } finally {



      setIsCreatingSupplier(false);



    }



  }, [selectedProduct, productSuppliers, setProductSuppliers, setSelectedSupplierId, setNewSupplierDraft, setIsCreatingSupplier]);

const handleSurchargeCellValueChange = useCallback(async (rowId: string, field: string, rawValue: any) => {
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
          setNewSurchargeData({ name: '', cost_type: '%', cost_value: 0, scope_type: 'product' });
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

          // If supplier type, use the selected supplier's ID
          if (scopeType === 'supplier') {
            if (!selectedSupplierId) {
              console.error('No supplier selected for supplier-scoped surcharge');
              return;
            }
            scopeId = selectedSupplierId;
          }

          // Create the new surcharge
          const newSurcharge = await api.surcharges.create({
            name: updatedData.name.trim(),
            cost_type: updatedData.cost_type,
            cost_value: updatedData.cost_value,
            scope_type: scopeType,
            scope_id: scopeId,
            is_active: true,
          });

          // Reload surcharges
          await loadProductSurcharges(selectedProduct.id);
          setNewSurchargeData({ name: '', cost_type: '%', cost_value: 0, scope_type: 'product' });
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

  // Find the surcharge to update
  const surchargeToUpdate = productSurcharges.find(ps => ps.id === rowId);
  if (!surchargeToUpdate) return;

  try {
    // Update the surcharge based on field
    if (field === 'cost_type' || field === 'cost_value') {
      // Update the surcharge itself
      const updateData: any = {};

      if (field === 'cost_type') {
        updateData.cost_type = rawValue;
      } else if (field === 'cost_value') {
        updateData.cost_value = Number(rawValue) || 0;
      }

      await api.surcharges.update(surchargeToUpdate.surcharge_id, updateData);

      // Reload surcharges
      const updated = await api.surcharges.getByProduct(selectedProduct.id);
      setProductSurcharges(updated);
      await loadAllSurcharges(); // Reload all surcharges to reflect changes
    }
  } catch (error) {
    console.error('Error updating surcharge:', error);
  }
}, [selectedProduct, productSurcharges, newSurchargeData, api, setProductSurcharges, loadAllSurcharges, selectedSupplierId, loadProductSurcharges]);





  useEffect(() => {



    if (!selectedProduct) return;



    if (isCreatingSupplier) return;



    if (!newSupplierDraft.supplier_id) return;



    const basePriceValue = Number(newSupplierDraft.base_price);



    if (!Number.isFinite(basePriceValue) || basePriceValue <= 0) return;







    createSupplierFromDraft(newSupplierDraft);



  }, [newSupplierDraft, selectedProduct, isCreatingSupplier, createSupplierFromDraft]);











  // Calculate surcharges with computed amounts



  const surchargesWithAmounts = useMemo(() => {



    if (!selectedSupplier) {



      return productSurcharges.map(p => ({ ...p, computed_amount: 0 }));



    }

    // Filter surcharges based on scope:
    // - Product surcharges (scope_type === 'product'): always apply
    // - Supplier surcharges (scope_type === 'supplier'): only if scope_id matches selected supplier
    const applicableSurcharges = productSurcharges.filter(p => {
      if (p.scope_type === 'product') {
        return true; // Product surcharges always apply
      } else if (p.scope_type === 'supplier') {
        // Supplier surcharges only apply if they match the selected supplier's ProductSupplier ID
        return p.scope_id === selectedSupplier.id;
      }
      return false;
    });

    return applicableSurcharges.map(p => {



      let computed_amount = 0;



      if (p.surcharge.cost_type === '%') {



        computed_amount = selectedSupplier.slutpris * (p.surcharge.cost_value / 100);



      } else {



        computed_amount = p.surcharge.cost_value;



      }



      return { ...p, computed_amount };



    });



  }, [productSurcharges, selectedSupplier]);







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
    const newRow: ProductSurcharge & { id: string; surcharge_id: string } = {
      id: NEW_SURCHARGE_ROW_ID,
      surcharge_id: '',
      product_id: selectedProduct?.id || '',
      scope_type: newSurchargeData.scope_type || 'product',
      scope_id: newSurchargeData.scope_type === 'supplier' ? selectedSupplierId : (selectedProduct?.id || ''),
      surcharge: {
        id: '',
        name: newSurchargeData.name || '',
        cost_type: newSurchargeData.cost_type,
        cost_value: newSurchargeData.cost_value,
        scope_type: newSurchargeData.scope_type || 'product',
      },
      computed_amount: 0,
    };
    return [...productSurcharges, newRow];
  }, [productSurcharges, newSurchargeData, selectedProduct, selectedSupplierId]);

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
      field: 'computed_amount',
      headerName: 'Summa',
      width: 140,
      type: 'number',
      editable: false,
      valueFormatter: (value) => `${Number(value).toFixed(2)} kr`,
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

            checked={selectedSupplierId === row.id}

            onChange={async () => {

              setSelectedSupplierId(row.id);



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

  selectedSupplierId,

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



            data={surchargesWithNewRow.map(s => ({
              ...s,
              computed_amount: surchargesWithAmounts.find(sa => sa.id === s.id)?.computed_amount || 0
            }))}



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



                    <span className="font-medium">+ {p.computed_amount.toFixed(2)} kr</span>



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







