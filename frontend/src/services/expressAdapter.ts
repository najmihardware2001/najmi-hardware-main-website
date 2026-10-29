/**
 * NAJMI HARDWARE — CENTRALIZED EXPRESS BACKEND ADAPTER
 * 
 * This adapter bridges the frontend contracts defined in `api.ts`
 * to the Express 5 + PostgreSQL backend (`http://localhost:3002/api`).
 * 
 * NOTE: DO NOT ACTIVATE UNTIL THE STAGING VERIFICATION IS APPROVED.
 * The active storefront continues pointing to NestJS (/api/v1).
 */

import type {
  UserProfile,
  ApiProductTemplate,
  ApiProductVariant,
  ApiProductMedia,
  ApiOrder
} from './api';

const EXPRESS_API_URL = import.meta.env.VITE_EXPRESS_API_URL || '/api';

export class ExpressApiAdapter {
  private token: string | null = null;
  private orderTokens: Record<string, string> = {};

  constructor() {
    this.token = localStorage.getItem('najmi_express_token');
    try {
      const stored = localStorage.getItem('najmi_order_tokens');
      if (stored) this.orderTokens = JSON.parse(stored);
    } catch {
      this.orderTokens = {};
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('najmi_express_token', token);
    } else {
      localStorage.removeItem('najmi_express_token');
    }
  }

  saveOrderToken(orderNumber: string, token: string) {
    this.orderTokens[orderNumber] = token;
    localStorage.setItem('najmi_order_tokens', JSON.stringify(this.orderTokens));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${EXPRESS_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status} Error`;
      throw new Error(errorMsg);
    }

    return data;
  }

  // ── Auth Adapter ──
  async login(email: string, password: string): Promise<{ success: boolean; accessToken: string; user: UserProfile }> {
    // Admin login maps to /admin/auth/login or customer to /auth/login
    try {
      const res = await this.request<any>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setToken(res.token);
      return {
        success: true,
        accessToken: res.token,
        user: {
          id: String(res.admin?.id || 'admin'),
          email: res.admin?.email,
          fullName: res.admin?.name || 'Administrator',
          role: res.admin?.role === 'SUPER_ADMIN' ? 'OWNER' : 'MANAGER',
        },
      };
    } catch {
      // Fallback to customer login
      const res = await this.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setToken(res.token);
      return {
        success: true,
        accessToken: res.token,
        user: {
          id: String(res.customer?.id),
          email: res.customer?.email,
          fullName: res.customer?.name,
          role: 'CASHIER',
        },
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/admin/auth/logout', { method: 'POST' }).catch(() => {});
      await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      this.setToken(null);
    }
  }

  // ── Storefront Products Adapter ──
  async getStorefrontProducts(params?: { search?: string; categoryId?: string; brandId?: string; skip?: number; take?: number }): Promise<{ total: number; items: ApiProductTemplate[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('q', params.search);
    if (params?.categoryId) query.append('category_id', params.categoryId);
    if (params?.brandId) query.append('brand_id', params.brandId);
    const limit = params?.take || 20;
    const offset = params?.skip || 0;
    query.append('limit', String(limit));
    query.append('offset', String(offset));

    const path = params?.search ? `/search?${query.toString()}` : `/products?${query.toString()}`;
    const res = await this.request<{ products: any[]; total: number }>(path);

    const items: ApiProductTemplate[] = (res.products || []).map(p => this.transformProduct(p));
    return {
      total: res.total || items.length,
      items,
    };
  }

  async getStorefrontProductById(idOrSlug: string): Promise<ApiProductTemplate> {
    const res = await this.request<any>(`/products/${encodeURIComponent(idOrSlug)}`);
    return this.transformProduct(res.product || res);
  }

  async getStorefrontCategories(): Promise<{ id: string; name: string; nameAr: string; code: string; _count: { templates: number } }[]> {
    const res = await this.request<{ categories: any[] }>('/categories');
    return (res.categories || []).map(c => ({
      id: String(c.id),
      code: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      name: c.name,
      nameAr: c.name_ar || c.name,
      _count: { templates: Number(c.product_count || 0) },
    }));
  }

  async getStorefrontBrands(): Promise<{ id: string; name: string; nameAr: string; code: string; _count: { templates: number } }[]> {
    const res = await this.request<{ brands: any[] }>('/brands');
    return (res.brands || []).map(b => ({
      id: String(b.id),
      code: b.slug || b.name.toLowerCase().replace(/\s+/g, '-'),
      name: b.name,
      nameAr: b.name_ar || b.name,
      _count: { templates: Number(b.product_count || 0) },
    }));
  }

  // ── Cart & COD Checkout Adapter ──
  async getCodQuote(items: { productId: number; variantId?: number; qty: number }[], area: string = 'Shuwaikh') {
    return this.request<any>('/cart/quote', {
      method: 'POST',
      body: JSON.stringify({ items, area }),
    });
  }

  async createCodOrder(payload: {
    items: { variantId: string; quantity: number }[];
    customer: { name: string; phone: string; email?: string };
    address: {
      area: string;
      block?: string;
      street?: string;
      building?: string;
      floor?: string;
      apartment?: string;
      notes?: string;
    };
    idempotencyKey: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; messageAr: string; order: ApiOrder }> {
    const expressPayload = {
      idempotencyKey: payload.idempotencyKey,
      payment_method: 'COD',
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email,
        address: {
          country: 'Kuwait',
          area: payload.address.area,
          street: payload.address.street || 'Plot / Street',
          building: payload.address.building || 'Building',
          floor: payload.address.floor,
          apartment: payload.address.apartment,
          notes: payload.notes || payload.address.notes,
        },
      },
      items: payload.items.map(i => ({
        variantId: Number(i.variantId) || i.variantId,
        qty: i.quantity,
      })),
      notes: payload.notes,
    };

    const res = await this.request<any>('/checkout', {
      method: 'POST',
      body: JSON.stringify(expressPayload),
    });

    if (res.tracking_token && res.order?.order_number) {
      this.saveOrderToken(res.order.order_number, res.tracking_token);
    }

    return {
      success: true,
      message: 'Order created successfully with Cash on Delivery.',
      messageAr: 'تم إنشاء الطلب بنجاح - الدفع عند الاستلام.',
      order: this.transformOrder(res.order),
    };
  }

  async trackOrder(orderNumber: string): Promise<any> {
    const token = this.orderTokens[orderNumber];
    const headers: Record<string, string> = {};
    if (token) headers['X-Order-Token'] = token;

    const res = await this.request<any>(`/orders/${encodeURIComponent(orderNumber)}`, { headers });
    return res.order ? this.transformOrder(res.order) : res;
  }

  // ── Admin Orders Adapter ──
  async getAdminOrders(params?: { orderStatus?: string; paymentStatus?: string; search?: string; skip?: number; take?: number }): Promise<{ total: number; items: ApiOrder[] }> {
    const query = new URLSearchParams();
    if (params?.orderStatus) query.append('status', params.orderStatus);
    if (params?.paymentStatus) query.append('payment_status', params.paymentStatus);
    if (params?.search) query.append('search', params.search);
    if (params?.skip) query.append('offset', String(params.skip));
    if (params?.take) query.append('limit', String(params.take));

    const res = await this.request<{ orders: any[]; total: number }>(`/admin/orders?${query.toString()}`);
    return {
      total: res.total || res.orders.length,
      items: (res.orders || []).map(o => this.transformOrder(o)),
    };
  }

  async getAdminOrderById(id: string): Promise<ApiOrder> {
    const res = await this.request<any>(`/admin/orders/${id}`);
    return this.transformOrder(res.order || res);
  }

  async updateOrderStatus(id: string, status: string, reason?: string) {
    const res = await this.request<any>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return {
      success: true,
      orderStatus: res.order?.status || status,
      paymentStatus: res.order?.payment_status || 'PENDING_COLLECTION',
      message: 'Order status updated successfully.',
    };
  }

  async recordCashCollection(orderNumberOrId: string, amountCollected: number, staffName: string, referenceNotes?: string) {
    const res = await this.request<any>(`/admin/orders/${orderNumberOrId}/cash`, {
      method: 'POST',
      body: JSON.stringify({
        kind: 'COLLECTION',
        amount: amountCollected.toFixed(3),
        note: `Collected by ${staffName}. ${referenceNotes || ''}`.trim(),
        idempotency_key: `cash-col-${orderNumberOrId}-${Date.now()}`,
      }),
    });
    return {
      success: true,
      message: 'Cash collection recorded.',
      hasDiscrepancy: false,
      paymentStatus: 'PAID',
      collectedAmount: amountCollected,
      collection: res,
    };
  }

  // ── Transformers ──
  private transformProduct(p: any): ApiProductTemplate {
    return {
      id: String(p.id),
      code: p.source_sku || p.slug || `PROD-${p.id}`,
      name: p.name,
      nameAr: p.name_ar || p.name,
      categoryId: String(p.category_id || ''),
      category: p.category_name ? { id: String(p.category_id), name: p.category_name, nameAr: p.category_name_ar || p.category_name, code: '' } : undefined,
      productType: 'STANDARD',
      brand: p.brand_name ? { id: String(p.brand_id), name: p.brand_name, code: '' } : undefined,
      countryOfOrigin: p.custom_fields?.country_of_origin || undefined,
      verificationStatus: 'VERIFIED',
      publicationStatus: p.status === 'ACTIVE' || p.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      description: p.description,
      descriptionAr: p.description_ar,
      imageUrl: p.primary_image_url || p.images?.[0]?.url,
      createdAt: p.created_at || new Date().toISOString(),
      variants: (p.variants || []).map((v: any): ApiProductVariant => ({
        id: String(v.id),
        sku: v.sku,
        diameterMm: v.diameter_mm ? Number(v.diameter_mm) : undefined,
        lengthValue: v.length_value ? Number(v.length_value) : undefined,
        lengthUnit: v.length_unit,
        color: v.color,
        material: v.material,
        sellingUnit: 'PCS',
        pricingStatus: v.price_approved ? 'APPROVED' : 'DRAFT',
        retailPrice: v.selling_price ? Number(v.selling_price) : null,
        costPrice: v.cost_price ? Number(v.cost_price) : undefined,
        availableStock: v.inventory_quantity !== undefined ? Number(v.inventory_quantity) : undefined,
        isInStock: Number(v.inventory_quantity || 0) > 0,
      })),
      media: (p.images || []).map((img: any, idx: number): ApiProductMedia => ({
        id: String(img.id || idx),
        templateId: String(p.id),
        originalUrl: img.url,
        webpUrl: img.url,
        orderIndex: img.order_index ?? idx,
        isPrimary: img.is_primary ?? (idx === 0),
      })),
    };
  }

  private transformOrder(o: any): ApiOrder {
    return {
      id: String(o.id),
      orderNumber: o.order_number,
      customerName: o.customer_name || o.shipping_address?.name || 'Customer',
      customerPhone: o.customer_phone || o.shipping_address?.phone || '',
      customerEmail: o.customer_email || o.shipping_address?.email,
      deliveryAddress: {
        area: o.shipping_address?.area || 'Kuwait',
        street: o.shipping_address?.street,
        building: o.shipping_address?.building,
        notes: o.shipping_address?.notes,
        fullAddress: `${o.shipping_address?.area || ''}, ${o.shipping_address?.street || ''}, ${o.shipping_address?.building || ''}`.trim(),
      },
      deliveryMethod: 'DELIVERY',
      subtotal: Number(o.subtotal_amount || o.subtotal || 0),
      deliveryFee: Number(o.delivery_fee || o.shipping_amount || 0),
      grandTotal: Number(o.total_amount || o.grand_total || 0),
      paymentMethod: 'COD',
      paymentStatus: o.payment_status || 'PENDING_COLLECTION',
      orderStatus: o.status || 'PENDING_CONFIRMATION',
      collectedAmount: Number(o.collected_amount || 0),
      createdAt: o.created_at || new Date().toISOString(),
      lines: (o.items || []).map((it: any): any => ({
        id: String(it.id),
        productName: it.product_name || it.name,
        sku: it.sku,
        quantity: it.quantity || it.qty,
        unitPrice: Number(it.unit_price || 0),
        subtotal: Number(it.total_price || (it.unit_price * it.quantity) || 0),
      })),
    };
  }
}

export const expressAdapter = new ExpressApiAdapter();
