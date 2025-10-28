// API service for making requests to the backend

export const api = {
  products: {
    getAll: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
  },

  contracts: {
    getAll: async () => {
      const response = await fetch('/api/contracts');
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/contracts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update contract');
      return response.json();
    },
  },

  customerPriceGroups: {
    getAll: async () => {
      const response = await fetch('/api/customer-price-groups');
      if (!response.ok) throw new Error('Failed to fetch customer price groups');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/customer-price-groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update customer price group');
      return response.json();
    },
    getProducts: async (priceGroupId: string) => {
      const response = await fetch(`/api/customer-price-groups/${priceGroupId}/products`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch price group products: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    addProduct: async (priceGroupId: string, data: any) => {
      const response = await fetch(`/api/customer-price-groups/${priceGroupId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add product to price group');
      return response.json();
    },
    updateProduct: async (priceGroupId: string, productId: string, data: any) => {
      const response = await fetch(`/api/customer-price-groups/${priceGroupId}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update price group product');
      return response.json();
    },
    removeProduct: async (priceGroupId: string, productId: string) => {
      const response = await fetch(`/api/customer-price-groups/${priceGroupId}/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove product from price group');
      return response.json();
    },
  },

  campaigns: {
    getAll: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update campaign');
      return response.json();
    },
  },

  pricingRules: {
    getByContext: async (contextType: string, contextId: string) => {
      const response = await fetch(
        `/api/pricing-rules?context_type=${contextType}&context_id=${contextId}`
      );
      if (!response.ok) throw new Error('Failed to fetch pricing rules');
      return response.json();
    },
    create: async (data: any) => {
      const response = await fetch('/api/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create pricing rule');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/pricing-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update pricing rule');
      return response.json();
    },
  },

  suppliers: {
    getAll: async () => {
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },
    create: async (data: any) => {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create supplier');
      return response.json();
    },
    getSurcharges: async (supplierId: string) => {
      const response = await fetch(`/api/suppliers/${supplierId}/surcharges`);
      if (!response.ok) throw new Error('Failed to fetch supplier surcharges');
      return response.json();
    },
  },

  productSuppliers: {
    getByProduct: async (productId: string) => {
      const response = await fetch(`/api/product-suppliers?product_id=${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product suppliers');
      return response.json();
    },
    getSurcharges: async (supplierProductId: string) => {
      const response = await fetch(`/api/product-suppliers/${supplierProductId}/surcharges`);
      if (!response.ok) throw new Error('Failed to fetch supplier surcharges');
      return response.json();
    },
    create: async (data: any) => {
      const response = await fetch('/api/product-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create product supplier');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/product-suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update product supplier');
      return response.json();
    },
    delete: async (id: string) => {
      const response = await fetch('/api/product-suppliers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Failed to delete product supplier');
      return response.json();
    },
    setPrimary: async (productId: string, supplierId: string) => {
      const response = await fetch('/api/product-suppliers/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, supplierId }),
      });
      if (!response.ok) throw new Error('Failed to set primary supplier');
      return response.json();
    },
  },

  productGroups: {
    getAll: async () => {
      const response = await fetch('/api/product-groups');
      if (!response.ok) throw new Error('Failed to fetch product groups');
      return response.json();
    },
  },

  departments: {
    getAll: async () => {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      return response.json();
    },
  },

  otherCosts: {
    getAll: async () => {
      const response = await fetch('/api/other-costs');
      if (!response.ok) throw new Error('Failed to fetch other costs');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/other-costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update other cost');
      return response.json();
    },
  },

  surcharges: {
    getAll: async () => {
      const response = await fetch('/api/surcharges');
      if (!response.ok) throw new Error('Failed to fetch surcharges');
      return response.json();
    },
    create: async (data: any) => {
      const response = await fetch('/api/surcharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create surcharge');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await fetch('/api/surcharges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update surcharge');
      return response.json();
    },
    getProducts: async (surchargeId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/products`);
      if (!response.ok) throw new Error('Failed to fetch surcharge products');
      return response.json();
    },
    getByProduct: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}/surcharges`);
      if (!response.ok) throw new Error('Failed to fetch product surcharges');
      return response.json();
    },
    addProduct: async (surchargeId: string, productId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error('Failed to add product to surcharge');
      return response.json();
    },
    removeProduct: async (surchargeId: string, productId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove product from surcharge');
      return response.json();
    },
    getSuppliers: async (surchargeId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/suppliers`);
      if (!response.ok) throw new Error('Failed to fetch surcharge suppliers');
      return response.json();
    },
    addSupplier: async (surchargeId: string, supplierId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId }),
      });
      if (!response.ok) throw new Error('Failed to add supplier to surcharge');
      return response.json();
    },
    removeSupplier: async (surchargeId: string, supplierId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/suppliers/${supplierId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove supplier from surcharge');
      return response.json();
    },
    cascadeDeleteProducts: async (surchargeId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/cascade-delete-products`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to cascade delete products');
      return response.json();
    },
    cascadeDeleteSuppliers: async (surchargeId: string) => {
      const response = await fetch(`/api/surcharges/${surchargeId}/cascade-delete-suppliers`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to cascade delete suppliers');
      return response.json();
    },
    getRelationshipCounts: async (surchargeId: string) => {
      const [products, suppliers] = await Promise.all([
        fetch(`/api/surcharges/${surchargeId}/products`).then(r => r.json()),
        fetch(`/api/surcharges/${surchargeId}/suppliers`).then(r => r.json()),
      ]);
      return {
        productCount: products.length,
        supplierCount: suppliers.length,
      };
    },
    updateSortOrder: async (updates: { id: string; sort_order: number }[]) => {
      const response = await fetch('/api/surcharges/update-sort-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!response.ok) throw new Error('Failed to update sort order');
      return response.json();
    },
  },
};
