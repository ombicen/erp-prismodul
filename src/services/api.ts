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
  },

  productSuppliers: {
    getByProduct: async (productId: string) => {
      const response = await fetch(`/api/product-suppliers?product_id=${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product suppliers');
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
};
