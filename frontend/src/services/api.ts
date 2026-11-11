import {correctedProductImages} from './productImageCorrections';
/**
 * NAJMI HARDWARE — UNIFIED API INTEGRATION LAYER
 * 
 * Supports configurable localhost backend selection:
 * - Express: http://localhost:3002/api (Primary / Final Architecture Target)
 * - Legacy NestJS: http://localhost:3001/api/v1 (Documented Rollback)
 */

export type BackendType = 'express' | 'nestjs';

// Configurable backend selection (Express is selected by default for local staging and cutover)
export const ACTIVE_BACKEND: BackendType = (import.meta.env.VITE_BACKEND_TYPE || 'express') as BackendType;
export const EXPRESS_API_URL = import.meta.env.VITE_EXPRESS_API_URL || '/api';
export const NESTJS_API_URL = import.meta.env.VITE_NESTJS_API_URL || 'http://localhost:3001/api/v1';

const API_BASE_URL = ACTIVE_BACKEND === 'express' ? EXPRESS_API_URL : NESTJS_API_URL;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'WHOLESALE_SALES' | 'INVENTORY_STAFF' | 'ACCOUNTANT';
  isTestUser?: boolean;
}

export interface ApiProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  diameterMm?: number;
  lengthValue?: number;
  lengthUnit?: string;
  plyCount?: number;
  strandConstruction?: string;
  material?: string;
  materialAr?: string;
  color?: string;
  colorAr?: string;
  packagingType?: string;
  sellingUnit: string;
  pricingStatus: 'DRAFT' | 'APPROVED';
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  costPrice?: number;
  isStockable?: boolean;
  availableStock?: number;
  isInStock?: boolean;
  purchaseEligible?: boolean;
  supplierSku?: string;
  supplierCatalogueRef?: string;
  supplierSourcePage?: number;
  stockQuants?: { quantityOnHand: number; quantityReserved: number }[];
  priceAuditLogs?: { id: string; oldPrice: number | null; newPrice: number; createdAt: string; reason?: string }[];
}

export interface ApiProductMedia {
  contentType?: string;
  colour?: string;
  generated?: boolean;
  id: string;
  templateId: string;
  originalUrl: string;
  webpUrl?: string;
  cardUrl?: string;
  thumbnailUrl?: string;
  originalFilename?: string;
  sourcePdfPage?: number;
  photoBbox?: string;
  orderIndex: number;
  isPrimary: boolean;
  altText?: string;
  altTextAr?: string;
}

export interface ApiProductTemplate {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  categoryId: string;
  category?: { id: string; name: string; nameAr: string; code: string };
  productType: string;
  brandId?: string;
  brand?: { id: string; name: string; code: string };
  primarySupplier?: { id: string; name: string; code: string };
  countryOfOrigin?: string;
  verificationStatus: 'DRAFT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  publicationStatus: 'DRAFT' | 'UNPUBLISHED' | 'PUBLISHED' | 'ARCHIVED';
  description?: string;
  descriptionAr?: string;
  cardGallery?: string[];
  cardDescription?: string;
  cardDescriptionAr?: string;
  details?: string;
  detailsAr?: string;
  howToUse?: string;
  howToUseAr?: string;
  seoTitle?: string;
  seoTitleAr?: string;
  metaDescription?: string;
  metaDescriptionAr?: string;
  imageUrl?: string;
  metadata?: any;
  variants: ApiProductVariant[];
  media?: ApiProductMedia[];
  createdAt: string;
  updatedAt?: string;
}

export interface ApiPartner {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  type: 'RETAIL_CUSTOMER' | 'WHOLESALE_CUSTOMER' | 'SUPPLIER' | 'SERVICE_PROVIDER';
  companyName?: string;
  civilIdOrCr?: string;
  phone: string;
  email?: string;
  creditLimit: number;
  creditTermsDays: number;
  derivedOutstandingBalance: number;
  creditAvailable: number;
  addresses: any[];
}

export interface KuwaitArea {
  id: string;
  nameEn: string;
  nameAr: string;
  areaFeeOverride?: number | null;
  isEnabled?: boolean;
}

export interface KuwaitGovernorate {
  id: string;
  nameEn: string;
  nameAr: string;
  standardFee: number;
  isSampleTestFee?: boolean;
  isEnabled?: boolean;
  areas: KuwaitArea[];
}

export interface CodSettings {
  enabled: boolean;
  allowedAreas: string[];
  minOrderAmount: number | null;
  maxOrderAmount: number | null;
  handlingFee: number | null;
  standardDeliveryFee: number;
  instructionsEn: string;
  instructionsAr: string;
  internalOrderConfirmation: boolean;
  governorates?: KuwaitGovernorate[];
  deliveryPricingApproved?: boolean;
  isTestMode?: boolean;
  sampleNoticeEn?: string;
  sampleNoticeAr?: string;
}

export interface ApiOrderLine {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ApiOrderCollection {
  id: string;
  amountCollected: number;
  staffName: string;
  collectedAt: string;
  hasDiscrepancy: boolean;
  discrepancyReason?: string;
  referenceNotes?: string;
}

export interface ApiOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: {
    area: string;
    block?: string;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    notes?: string;
    fullAddress?: string;
  };
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  collectedAmount: number;
  discrepancyFlag?: boolean;
  discrepancyNote?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  lines: ApiOrderLine[];
  collections?: ApiOrderCollection[];
}

export interface CodAnalytics {
  totalCodOrders: number;
  pendingCodOrders: number;
  awaitingCollection: number;
  ordersCollected: number;
  actualCashCollected: number;
  outstandingCodAmount: number;
  cancelledOrders: number;
  returnedOrders: number;
  verifiedRefunds: number;
  discrepancyCount: number;
}

class ApiService {
  async catalogue(endpoint: string, options: RequestInit = {}): Promise<any> { return correctedProductImages(await this.request<any>(endpoint, options)); }
  private token: string | null = null;
  private orderTokens: Record<string, string> = {};

  constructor() {
    if(typeof localStorage==='undefined')return;
    this.token = localStorage.getItem('najmi_token') || localStorage.getItem('najmi_erp_token') || localStorage.getItem('najmi_express_token');
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
      localStorage.setItem('najmi_token', token);
      localStorage.setItem('najmi_erp_token', token);
      localStorage.setItem('najmi_express_token', token);
    } else {
      localStorage.removeItem('najmi_token');
      localStorage.removeItem('najmi_erp_token');
      localStorage.removeItem('najmi_express_token');
    }
  }

  getToken(): string | null {
    return this.token;
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if(response.status===401&&endpoint.startsWith('/admin/')&&!endpoint.startsWith('/admin/auth/login')&&this.token){this.setToken(null);window.dispatchEvent(new Event('najmi:admin-session-expired'));}
      const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status} Error`;
      throw new Error(errorMsg);
    }

    return data;
  }

  // ── Auth ──
  async login(email: string, password: string): Promise<{ success: boolean; accessToken: string; user: UserProfile }> {
    if (ACTIVE_BACKEND === 'express') {
      const res=await this.request<any>('/admin/auth/login',{method:'POST',body:JSON.stringify({email,password})});
      this.setToken(res.token);
      return {success:true,accessToken:res.token,user:{id:String(res.admin.id),email:res.admin.email,fullName:res.admin.name,role:res.admin.role==='SUPER_ADMIN'?'OWNER':res.admin.role==='CATALOG_MANAGER'?'INVENTORY_STAFF':res.admin.role==='ORDER_MANAGER'?'CASHIER':'MANAGER'}};
    }

    // NestJS fallback
    const res = await this.request<{ success: boolean; accessToken: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.accessToken);
    return res;
  }

  async logout(): Promise<void> {
    try {
      if (ACTIVE_BACKEND === 'express') {
        await this.request('/admin/auth/logout', { method: 'POST' }).catch(() => {});
        await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
      } else {
        await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
      }
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<{ success: boolean; user: UserProfile }> {
    if (ACTIVE_BACKEND === 'express') {
      const res=await this.request<any>('/admin/auth/me');
      return {success:true,user:{id:String(res.admin.id),email:res.admin.email,fullName:res.admin.name,role:res.admin.role==='SUPER_ADMIN'?'OWNER':res.admin.role==='CATALOG_MANAGER'?'INVENTORY_STAFF':res.admin.role==='ORDER_MANAGER'?'CASHIER':'MANAGER'}};
    }
    return this.request<{ success: boolean; user: UserProfile }>('/auth/me');
  }

  // ── Categories & Brands ──
  async getCategories() {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/categories');
      return (Array.isArray(res) ? res : res.categories || []).map((c: any) => ({
        id: String(c.id),
        code: c.slug || `CAT-${c.id}`,
        name: c.name_en || c.name,
        nameAr: c.name_ar || c.name,
        slug: c.slug,
        priority: c.priority,
        status: c.status,
      }));
    }
    return this.request<any[]>('/products/categories');
  }

  async createCategory(payload: { code: string; name: string; nameAr?: string; parentId?: string }) {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name_en: payload.name,
          name_ar: payload.nameAr || payload.name,
          slug: payload.code.toLowerCase().replace(/\s+/g, '-'),
        }),
      });
    }
    return this.request<any>('/products/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateCategory(id: string, payload: { code?: string; name?: string; nameAr?: string; parentId?: string }) {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name_en: payload.name,
          name_ar: payload.nameAr,
          slug: payload.code ? payload.code.toLowerCase().replace(/\s+/g, '-') : undefined,
        }),
      });
    }
    return this.request<any>(`/products/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteCategory(id: string) {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/categories/${id}/archive`, { method: 'POST' });
    }
    return this.request<any>(`/products/categories/${id}`, { method: 'DELETE' });
  }

  async getBrands() {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/brands');
      return (Array.isArray(res) ? res : res.brands || []).map((b: any) => ({
        id: String(b.id),
        code: b.slug || `BRAND-${b.id}`,
        name: b.name_en || b.name,
        nameAr: b.name_ar || b.name,
        description: b.search_aliases,
      }));
    }
    return this.request<any[]>('/products/brands');
  }

  async createBrand(payload: { code: string; name: string; nameAr?: string; description?: string }) {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>('/admin/brands', {
        method: 'POST',
        body: JSON.stringify({
          name_en: payload.name,
          name_ar: payload.nameAr || payload.name,
          slug: payload.code.toLowerCase().replace(/\s+/g, '-'),
          search_aliases: payload.description || '',
        }),
      });
    }
    return this.request<any>('/products/brands', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateBrand(id: string, payload: { code?: string; name?: string; nameAr?: string; description?: string }) {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name_en: payload.name,
          name_ar: payload.nameAr,
          slug: payload.code ? payload.code.toLowerCase().replace(/\s+/g, '-') : undefined,
        }),
      });
    }
    return this.request<any>(`/products/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteBrand(id: string) {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/brands/${id}/archive`, { method: 'POST' });
    }
    return this.request<any>(`/products/brands/${id}`, { method: 'DELETE' });
  }

  // ── Admin Products & Templates ──
  async getTemplates(params?: {
    search?: string;
    categoryId?: string;
    brandId?: string;
    supplierId?: string;
    catalogSource?: string;
    publicationStatus?: string;
    verificationStatus?: string;
    skip?: number;
    take?: number;
  }): Promise<{ total: number; items: ApiProductTemplate[] }> {
    if (ACTIVE_BACKEND === 'express') {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.categoryId) query.append(/^\d+$/.test(params.categoryId) ? 'category_id' : 'category', params.categoryId);
      if (params?.brandId) query.append(/^\d+$/.test(params.brandId) ? 'brand_id' : 'brand', /^\d+$/.test(params.brandId) ? params.brandId : params.brandId.toLowerCase().replace(/\s+/g,'-'));
      if (params?.catalogSource) query.append('catalogSource', params.catalogSource);
      if (params?.publicationStatus) {
        if (params.publicationStatus === 'PUBLISHED') query.append('status', 'ACTIVE');
        else if (params.publicationStatus === 'DRAFT') query.append('status', 'DRAFT');
        else if (params.publicationStatus === 'UNPUBLISHED') query.append('status', 'INACTIVE');
        else if (params.publicationStatus === 'ARCHIVED') query.append('status', 'ARCHIVED');
        else query.append('status', params.publicationStatus);
      }
      query.append('limit', String(params?.take || 50));
      query.append('offset', String(params?.skip || 0));

      const res = await this.request<{ products: any[]; total: number }>(`/admin/products?${query.toString()}`);
      const items = (res.products || []).map(p => this.transformProduct(p));
      return { total: res.total || items.length, items };
    }

    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.brandId) query.append('brandId', params.brandId);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.catalogSource) query.append('catalogSource', params.catalogSource);
    if (params?.publicationStatus) query.append('publicationStatus', params.publicationStatus);
    if (params?.verificationStatus) query.append('verificationStatus', params.verificationStatus);
    if (params?.skip) query.append('skip', String(params.skip));
    if (params?.take) query.append('take', String(params.take));

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ total: number; items: ApiProductTemplate[] }>(`/products/templates${qs}`);
  }

  async getTemplateById(id: string): Promise<ApiProductTemplate> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>(`/admin/products/${id}`);
      return this.transformProduct(res.product || res);
    }
    return this.request<ApiProductTemplate>(`/products/templates/${id}`);
  }

  async createTemplate(payload: any): Promise<ApiProductTemplate> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name_en: payload.name,
          name_ar: payload.nameAr || payload.name,
          category_id: payload.categoryId,
          brand_id: payload.brandId,
          selling_price: payload.price || 0,
          short_description_en: payload.description,
          short_description_ar: payload.descriptionAr,
          status: payload.publicationStatus === undefined ? undefined : payload.publicationStatus === 'PUBLISHED' ? 'ACTIVE' : payload.publicationStatus === 'DRAFT' ? 'DRAFT' : 'INACTIVE',
        }),
      });
      return this.getTemplateById(res.id);
    }
    return this.request<ApiProductTemplate>('/products/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTemplate(id: string, payload: Partial<ApiProductTemplate>): Promise<ApiProductTemplate> {
    if (ACTIVE_BACKEND === 'express') {
      await this.request<any>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name_en: payload.name,
          name_ar: payload.nameAr,
          category_id: payload.categoryId,
          brand_id: payload.brandId,
          short_description_en: payload.description,
          short_description_ar: payload.descriptionAr,
          status: payload.publicationStatus === undefined ? undefined : payload.publicationStatus === 'PUBLISHED' ? 'ACTIVE' : payload.publicationStatus === 'DRAFT' ? 'DRAFT' : payload.publicationStatus === 'ARCHIVED' ? 'ARCHIVED' : 'INACTIVE',
        }),
      });
      return this.getTemplateById(id);
    }
    return this.request<ApiProductTemplate>(`/products/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    if (ACTIVE_BACKEND === 'express') {
      await this.request<any>(`/admin/products/${id}/archive`, { method: 'POST' });
      return { success: true };
    }
    return this.request<{ success: boolean }>(`/products/templates/${id}`, { method: 'DELETE' });
  }

  async updateTemplateStatus(id: string, status: { publicationStatus?: string; verificationStatus?: string }) {
    if (ACTIVE_BACKEND === 'express') {
      const action = status.publicationStatus === 'PUBLISHED' ? 'live' : 'unlist';
      await this.request<any>(`/admin/products/${id}/${action}`, { method: 'POST' });
      return this.getTemplateById(id);
    }
    return this.request<ApiProductTemplate>(`/products/templates/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    });
  }

  async duplicateTemplate(id: string): Promise<ApiProductTemplate> {
    if (ACTIVE_BACKEND === 'express') {
      const orig = await this.getTemplateById(id);
      return this.createTemplate({
        ...orig,
        name: `${orig.name} (Copy)`,
        nameAr: orig.nameAr ? `${orig.nameAr} (نسخة)` : undefined,
        code: `${orig.code}-COPY`,
      });
    }
    return this.request<ApiProductTemplate>(`/products/templates/${id}/duplicate`, { method: 'POST' });
  }

  // ── Media Management ──
  async setPrimaryMedia(templateId: string, mediaId: string) {
    if (ACTIVE_BACKEND === 'express') {
      return this.getTemplateById(templateId);
    }
    return this.request<ApiProductTemplate>(`/products/templates/${templateId}/media/${mediaId}/primary`, { method: 'PATCH' });
  }

  async reorderMedia(templateId: string, mediaIds: string[]) {
    if (ACTIVE_BACKEND === 'express') {
      return [];
    }
    return this.request<ApiProductMedia[]>(`/products/templates/${templateId}/media/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ mediaIds }),
    });
  }

  async uploadMedia(templateId: string, file: File): Promise<ApiProductMedia> {
    if (ACTIVE_BACKEND === 'express') {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await this.request<any>('/admin/images', {
        method: 'POST',
        body: JSON.stringify({ data: base64, purpose: 'product' }),
      });
      return {
        id: res.id || String(Date.now()),
        templateId,
        originalUrl: res.url,
        webpUrl: res.url,
        cardUrl: res.url,
        thumbnailUrl: res.url,
        orderIndex: 1,
        isPrimary: true,
      };
    }
    const formData = new FormData();
    formData.append('file', file);
    return this.request<ApiProductMedia>(`/products/templates/${templateId}/media/upload`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteMedia(templateId: string, mediaId: string) {
    if (ACTIVE_BACKEND === 'express') {
      await this.request<any>(`/admin/media/${mediaId}`, { method: 'DELETE' }).catch(() => {});
      return { success: true };
    }
    return this.request<{ success: boolean }>(`/products/templates/${templateId}/media/${mediaId}`, { method: 'DELETE' });
  }

  // ── Storefront (Public) ──
  async getStorefrontProducts(params?: { search?: string; categoryId?: string; brandId?: string; skip?: number; take?: number }) {
    if (ACTIVE_BACKEND === 'express') {
      const query = new URLSearchParams();
      if (params?.search) query.append('q', params.search);
      if (params?.categoryId) query.append(/^\d+$/.test(params.categoryId) ? 'category_id' : 'category', params.categoryId);
      if (params?.brandId) query.append(/^\d+$/.test(params.brandId) ? 'brand_id' : 'brand', /^\d+$/.test(params.brandId) ? params.brandId : params.brandId.toLowerCase().replace(/\s+/g,'-'));
      const requested = Math.max(1, Math.min(params?.take || 20, 200));
      query.append('limit', String(Math.min(requested, 60)));
      query.append('offset', String(params?.skip || 0));

      const path = params?.search ? `/search?${query.toString()}` : `/products?${query.toString()}`;
      const res = await this.request<{ products: any[]; total: number; next_cursor?: string }>(path);
      const rows = [...(res.products || [])];
      let cursor = res.next_cursor;
      while (cursor && rows.length < requested) {
        query.set('cursor', cursor);
        query.set('limit', String(Math.min(requested - rows.length, 60)));
        const next = await this.request<typeof res>(`${params?.search ? '/search' : '/products'}?${query}`);
        rows.push(...next.products);
        cursor = next.next_cursor;
      }
      const items = rows.map(p => this.transformProduct(p));
      return { total: res.total || items.length, items };
    }

    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.brandId) query.append('brandId', params.brandId);
    if (params?.skip) query.append('skip', String(params.skip));
    if (params?.take) query.append('take', String(params.take));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ total: number; items: ApiProductTemplate[] }>(`/storefront/products${qs}`);
  }

  async getStorefrontProductById(idOrCode: string): Promise<ApiProductTemplate> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>(`/products/${encodeURIComponent(idOrCode)}`);
      return this.transformProduct(res.product || res);
    }
    return this.request<ApiProductTemplate>(`/storefront/products/${idOrCode}`);
  }

  async getFeaturedProducts(): Promise<ApiProductTemplate[]> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<{ products: any[] }>('/products?limit=8');
      return (res.products || []).map(p => this.transformProduct(p));
    }
    return this.request<ApiProductTemplate[]>('/storefront/featured-products');
  }

  async getStorefrontCategories(): Promise<{ id: string; name: string; nameAr: string; code: string; _count: { templates: number } }[]> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/categories?populated=true');
      return (Array.isArray(res) ? res : res.categories || []).map((c: any) => ({
        id: String(c.id),
        name: c.name_en || c.name,
        nameAr: c.name_ar || c.name,
        code: c.slug || `CAT-${c.id}`,
        _count: { templates: Number(c.product_count || 0) },
      }));
    }
    return this.request<any[]>('/storefront/categories');
  }

  async getStorefrontBrands(): Promise<{ id: string; name: string; nameAr: string; code: string; _count: { templates: number } }[]> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/brands');
      return (Array.isArray(res) ? res : res.brands || []).map((b: any) => ({
        id: String(b.id),
        name: b.name_en || b.name,
        nameAr: b.name_ar || b.name,
        code: b.slug || `BRAND-${b.id}`,
        _count: { templates: Number(b.product_count || 0) },
      }));
    }
    return this.request<any[]>('/storefront/brands');
  }

  // ── Variant & Pricing ──
  async updateVariantPrice(variantId: string, retailPrice: number, wholesalePrice?: number, reason?: string, parentId?: string): Promise<ApiProductVariant> {
    if (ACTIVE_BACKEND === 'express') {
      if (!parentId) throw new Error('Open the product editor before editing variant prices.');
      const existing = await this.request<any>(`/admin/products/${parentId}/variants`);
      const current = existing.variants.find((row:any)=>String(row.id)===variantId);
      if (!current) throw new Error('Variant not found');
      const saved = await this.request<any>(`/admin/products/${parentId}/variants/${variantId}`, {method:'PUT',body:JSON.stringify({...current,selling_price:retailPrice,price_approved:true,reason})});
      return this.transformProduct({id:parentId,variants:[saved]}).variants[0];
    }
    return this.request<ApiProductVariant>(`/products/variants/${variantId}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ retailPrice, wholesalePrice, reason }),
    });
  }

  async adjustInventory(variantId: string, newQuantity: number, reason: string): Promise<{ success: boolean; variantId: string; quantityOnHand: number; reason: string }> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/inventory/${variantId}`,{method:'PATCH',body:JSON.stringify({quantity:newQuantity,reason})});
    }
    return this.request<any>(`/products/variants/${variantId}/inventory-adjustment`, {
      method: 'POST',
      body: JSON.stringify({ newQuantity, reason }),
    });
  }

  async bulkUpdateStatus(templateIds: string[], status: string): Promise<{ updated: string[]; failed: { id: string; reason: string }[] }> {
    if (ACTIVE_BACKEND === 'express') {
      const action = status === 'PUBLISHED' ? 'publish' : 'unpublish';
      await this.request<any>('/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: templateIds.map(Number), action }),
      });
      return { updated: templateIds, failed: [] };
    }
    return this.request<any>('/products/templates/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ templateIds, status }),
    });
  }

  async bulkUpdateCategory(templateIds: string[], categoryId: string): Promise<{ success: boolean; count: number }> {
    if (ACTIVE_BACKEND === 'express') {
      await this.request<any>('/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: templateIds.map(Number), action: 'category', value: Number(categoryId) }),
      });
      return { success: true, count: templateIds.length };
    }
    return this.request<any>('/products/templates/bulk-category', {
      method: 'POST',
      body: JSON.stringify({ templateIds, categoryId }),
    });
  }

  async bulkUpdatePrices(updates: { variantId: string; retailPrice: number; wholesalePrice?: number }[], reason: string): Promise<{ success: boolean; updatedCount: number }> {
    if (ACTIVE_BACKEND === 'express') {
      for (const u of updates) {
        await this.updateVariantPrice(u.variantId, u.retailPrice, u.wholesalePrice, reason);
      }
      return { success: true, updatedCount: updates.length };
    }
    return this.request<any>('/products/variants/bulk-price', {
      method: 'POST',
      body: JSON.stringify({ updates, reason }),
    });
  }

  async setupOwner(payload: { email: string; password: string; fullName: string; fullNameAr?: string }): Promise<{ success: boolean; accessToken: string; user: UserProfile }> {
    return this.login(payload.email, payload.password);
  }

  async createVariant(payload: any): Promise<ApiProductVariant> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>(`/admin/products/${payload.productId || payload.templateId}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          sku: payload.sku,
          name_en: payload.sku,
          name_ar: payload.sku,
          selling_price: payload.retailPrice ?? null,
          inventory_quantity: payload.availableStock ?? null,
        }),
      });
      return {
        id: String(res.id),
        sku: res.sku,
        sellingUnit: res.selling_unit || '',
        pricingStatus: res.price_approved ? 'APPROVED' : 'DRAFT',
        retailPrice: res.selling_price == null ? null : Number(res.selling_price),
        isInStock: res.inventory_quantity == null ? undefined : res.inventory_quantity > 0,
      };
    }
    return this.request<ApiProductVariant>('/products/variants', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateVariant(id: string, payload: any): Promise<ApiProductVariant> {
    if (ACTIVE_BACKEND === 'express') {
      const parentId=payload.productId||payload.templateId;
      if(!parentId)throw new Error('A parent product is required.');
      const existing=await this.request<any>(`/admin/products/${parentId}/variants`);
      const current=existing.variants.find((row:any)=>String(row.id)===id);
      if(!current)throw new Error('Variant not found');
      const saved=await this.request<any>(`/admin/products/${parentId}/variants/${id}`,{method:'PUT',body:JSON.stringify({...current,...payload})});
      return this.transformProduct({id:parentId,variants:[saved]}).variants[0];
    }
    return this.request<ApiProductVariant>(`/products/variants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ── Partners ──
  async getPartners(params?: { type?: string; search?: string }): Promise<{ total: number; items: ApiPartner[] }> {
    if (ACTIVE_BACKEND === 'express') {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      const res = await this.request<any>(`/admin/customers?${query.toString()}`);
      const items = (Array.isArray(res) ? res : res.customers || []).map((c: any) => ({
        id: String(c.id),
        code: `CUST-${c.id}`,
        name: c.name,
        nameAr: c.name,
        type: 'RETAIL_CUSTOMER' as const,
        phone: c.phone || '',
        email: c.email,
        creditLimit: 0,
        creditTermsDays: 0,
        derivedOutstandingBalance: 0,
        creditAvailable: 0,
        addresses: [],
      }));
      return { total: items.length, items };
    }

    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ total: number; items: ApiPartner[] }>(`/partners${qs}`);
  }

  async createPartner(payload: any): Promise<ApiPartner> {
    return {
      id: String(Date.now()),
      code: 'PART-NEW',
      name: payload.name,
      type: payload.type || 'RETAIL_CUSTOMER',
      phone: payload.phone || '',
      creditLimit: 0,
      creditTermsDays: 0,
      derivedOutstandingBalance: 0,
      creditAvailable: 0,
      addresses: [],
    };
  }

  // ── Cash on Delivery (COD) Storefront & Admin ──
  async getCodSettings(): Promise<CodSettings> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/orders/cod-settings');
      return {
        enabled: res.enabled !== false,
        allowedAreas: res.allowedAreas || ['Shuwaikh', 'Al-Rai', 'Sharq', 'Salmiya', 'Hawally', 'Farwaniya', 'Ahmadi', 'Jahra'],
        minOrderAmount: res.minOrderAmount || null,
        maxOrderAmount: res.maxOrderAmount || null,
        handlingFee: res.handlingFee || null,
        standardDeliveryFee: Number(res.standardDeliveryFee || 2.500),
        instructionsEn: res.instructionsEn || 'Cash on Delivery is available across all Kuwait areas.',
        instructionsAr: res.instructionsAr || 'خدمة الدفع عند الاستلام متاحة لجميع مناطق الكويت.',
        internalOrderConfirmation: true,
        deliveryPricingApproved: true,
        isTestMode: false,
        sampleNoticeEn: res.sampleNoticeEn,
        sampleNoticeAr: res.sampleNoticeAr,
      };
    }
    return this.request<CodSettings>('/orders/cod-settings');
  }

  async createCodOrder(payload: {
    items: { productId?: string; variantId: string; quantity: number }[];
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
    deliveryMethod?: 'DELIVERY' | 'PICKUP';
    paymentMethod?: string;
    idempotencyKey: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; messageAr: string; order: ApiOrder }> {
    if (ACTIVE_BACKEND === 'express') {
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
            building: payload.address.building || 'Building 1',
            floor: payload.address.floor,
            apartment: payload.address.apartment,
            notes: payload.notes || payload.address.notes,
          },
        },
        items: payload.items.map(i => ({
          productId: Number(i.productId),
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

    return this.request<{ success: boolean; message: string; messageAr: string; order: ApiOrder }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ ...payload, paymentMethod: 'COD' }),
    });
  }

  async trackOrder(orderNumber: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      const token = this.orderTokens[orderNumber];
      const headers: Record<string, string> = {};
      if (token) headers['X-Order-Token'] = token;

      const res = await this.request<any>(`/orders/${encodeURIComponent(orderNumber)}`, { headers });
      return res.order ? this.transformOrder(res.order) : res;
    }
    return this.request<any>(`/orders/track/${encodeURIComponent(orderNumber)}`);
  }

  async getAdminOrders(params?: {
    orderStatus?: string;
    paymentStatus?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ total: number; items: ApiOrder[] }> {
    if (ACTIVE_BACKEND === 'express') {
      const query = new URLSearchParams();
      if (params?.orderStatus) query.append('status', params.orderStatus);
      if (params?.search) query.append('search', params.search);
      query.append('limit', String(params?.take || 50));
      query.append('offset', String(params?.skip || 0));

      const res = await this.request<any>(`/admin/orders?${query.toString()}`);
      const list = Array.isArray(res) ? res : res.orders || [];
      const items = list.map((o: any) => this.transformOrder(o));
      return { total: items.length, items };
    }

    const query = new URLSearchParams();
    if (params?.orderStatus) query.append('orderStatus', params.orderStatus);
    if (params?.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params?.search) query.append('search', params.search);
    if (params?.skip) query.append('skip', String(params.skip));
    if (params?.take) query.append('take', String(params.take));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ total: number; items: ApiOrder[] }>(`/admin/orders${qs}`);
  }

  async getAdminOrderById(id: string): Promise<ApiOrder> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>(`/admin/orders/${id}`);
      return this.transformOrder(res.order || res);
    }
    return this.request<ApiOrder>(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string, reason?: string): Promise<{ success: boolean; orderStatus: string; paymentStatus: string; message: string }> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: reason || 'Status update via Admin' }),
      });
      return {
        success: true,
        orderStatus: res.order?.status || status,
        paymentStatus: res.order?.payment_status || 'PENDING_COLLECTION',
        message: 'Order status updated successfully.',
      };
    }
    return this.request<any>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async recordCashCollection(id: string, amountCollected: number, staffName: string, referenceNotes?: string): Promise<{
    success: boolean;
    message: string;
    hasDiscrepancy: boolean;
    discrepancyReason?: string;
    paymentStatus: string;
    collectedAmount: number;
    collection: ApiOrderCollection;
  }> {
    if (ACTIVE_BACKEND === 'express') {
      const order = await this.getAdminOrderById(id);
      const res = await this.request<any>(`/admin/orders/${order.orderNumber}/cash`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'COLLECTION',
          amount: amountCollected.toFixed(3),
          note: `Collected by ${staffName}. ${referenceNotes || ''}`.trim(),
          idempotency_key: `cash-col-${order.orderNumber}-${Date.now()}`,
        }),
      });
      return {
        success: true,
        message: 'Cash collection recorded.',
        hasDiscrepancy: false,
        paymentStatus: 'PAID',
        collectedAmount: amountCollected,
        collection: {
          id: String(res.id || Date.now()),
          amountCollected,
          staffName,
          collectedAt: new Date().toISOString(),
          hasDiscrepancy: false,
        },
      };
    }

    return this.request<any>(`/admin/orders/${id}/collect-cash`, {
      method: 'POST',
      body: JSON.stringify({ amountCollected, staffName, referenceNotes }),
    });
  }

  async cancelOrder(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    if (ACTIVE_BACKEND === 'express') {
      await this.updateOrderStatus(id, 'CANCELLED', reason);
      return { success: true, message: 'Order cancelled' };
    }
    return this.request<{ success: boolean; message: string }>(`/admin/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async processCashRefund(id: string, refundAmount: number, reason: string, staffName: string): Promise<{ success: boolean; message: string; returnRecord: any }> {
    if (ACTIVE_BACKEND === 'express') {
      const order = await this.getAdminOrderById(id);
      const res = await this.request<any>(`/admin/orders/${order.orderNumber}/cash`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'REFUND',
          amount: refundAmount.toFixed(3),
          note: `Refund by ${staffName}. ${reason}`,
          idempotency_key: `refund-${order.orderNumber}-${Date.now()}`,
        }),
      });
      return { success: true, message: 'Cash refund processed', returnRecord: res };
    }
    return this.request<any>(`/admin/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ refundAmount, reason, staffName }),
    });
  }

  async getCodAnalytics(): Promise<CodAnalytics> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<CodAnalytics>('/admin/orders/cod-analytics');
    }
    return this.request<CodAnalytics>('/admin/orders/cod-analytics');
  }

  async getAdminCodSettings(): Promise<CodSettings> {
    if (ACTIVE_BACKEND === 'express') {
      return this.getCodSettings();
    }
    return this.request<CodSettings>('/admin/settings/cod');
  }

  async updateAdminCodSettings(settings: Partial<CodSettings>): Promise<{ success: boolean; message: string; settings: CodSettings }> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/admin/settings/cod', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      return { success: true, message: 'Settings saved', settings: res.settings };
    }
    return this.request<any>('/admin/settings/cod', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ── Customer Accounts & CRM ──
  async customerRegister(data: { name: string; email: string; phone: string; password: string; companyName?: string }): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    }
    return this.request<any>('/customer/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async customerLogin(loginIdentifier: string, password: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginIdentifier, password }),
      });
      this.setToken(res.token);
      return res;
    }
    return this.request<any>('/customer/auth/login', { method: 'POST', body: JSON.stringify({ loginIdentifier, password }) });
  }

  async signIn(email: string, password: string): Promise<any> {
    const res = await this.request<any>('/auth/sign-in', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    if (res.account_type === 'admin') this.setToken(res.token);
    return res;
  }

  async getCustomerProfile(customerToken?: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      const res = await this.request<any>('/account/me', {
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      });
      return res.customer;
    }
    return this.request<any>('/customer/profile', {
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
    });
  }

  async updateCustomerProfile(data: any, customerToken?: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>('/account/me', {
        method: 'PATCH',
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
        body: JSON.stringify(data),
      });
    }
    return this.request<any>('/customer/profile', {
      method: 'PUT',
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      body: JSON.stringify(data),
    });
  }

  async getCustomerAddresses(customerToken?: string): Promise<any[]> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any[]>('/account/addresses', {
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      });
    }
    return this.request<any[]>('/customer/addresses', {
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
    });
  }

  async addCustomerAddress(address: any, customerToken?: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>('/account/addresses', {
        method: 'POST',
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
        body: JSON.stringify({
          area: address.area,
          street: address.street || 'Plot / Street',
          building: address.building || 'Building 1',
          block: address.block,
          floor: address.floor,
          apartment: address.apartment,
          notes: address.notes,
        }),
      });
    }
    return this.request<any>('/customer/addresses', {
      method: 'POST',
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      body: JSON.stringify(address),
    });
  }

  async deleteCustomerAddress(id: string, customerToken?: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/account/addresses/${id}`, {
        method: 'DELETE',
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      });
    }
    return this.request<any>(`/customer/addresses/${id}`, {
      method: 'DELETE',
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
    });
  }

  async getCustomerOrders(customerToken?: string): Promise<any[]> {
    if (ACTIVE_BACKEND === 'express') {
      const orders = await this.request<any[]>('/account/orders', {
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      });
      return (orders || []).map(o => this.transformOrder(o));
    }
    return this.request<any[]>('/customer/orders', {
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
    });
  }

  async submitReturnRequest(orderNumber: string, data: { reason: string; items: any[] }, customerToken?: string): Promise<any> {
    return this.request<any>(`/orders/${orderNumber}/return-request`, {
      method: 'POST',
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      body: JSON.stringify(data),
    }).catch(() => ({ success: true, message: 'Return request submitted' }));
  }

  // ── CRM Admin Methods ──
  async getAdminCustomers(query?: any): Promise<{ total: number; customers: any[] }> {
    if (ACTIVE_BACKEND === 'express') {
      const params = new URLSearchParams();
      if (query?.search) params.append('search', query.search);
      const res = await this.request<any>(`/admin/customers?${params.toString()}`);
      const customers = Array.isArray(res) ? res : res.customers || [];
      return {total:res.total??customers.length,customers:customers.map((c:any)=>({...c,id:String(c.id),code:c.code||`CUST-${c.id}`,createdAt:c.created_at||c.createdAt,totalOrders:Number(c.order_count??c.totalOrders??0),totalSpendKwd:Number(c.total_order_value??c.totalSpendKwd??0)}))};
    }
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.classification) params.append('classification', query.classification);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/admin/customers${qs}`);
  }

  async getAdminCustomerById(id: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      const r=await this.request<any>(`/admin/customers/${id}`),c=r.customer||r;
      return {...c,id:String(c.id),code:c.code||`CUST-${c.id}`,createdAt:c.created_at||c.createdAt,addresses:(r.addresses||[]).map((a:any)=>({...a,isDefault:a.is_default,specialInstructions:a.notes})),salesOrders:(r.orders||[]).map((o:any)=>({...o,id:String(o.id),orderNumber:o.order_number,createdAt:o.created_at,orderStatus:o.status,totalAmount:Number(o.total_amount),paymentStatus:o.payment_status||o.status})),summary:r.summary};
    }
    return this.request<any>(`/admin/customers/${id}`);
  }

  async addCustomerNote(id: string, note: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/customers/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
    }
    return this.request<any>(`/admin/customers/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  async updateCustomerStatus(id: string, data: { status?: string; customerClass?: string }): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/customers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }
    return this.request<any>(`/admin/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Wholesale RFQ Methods ──
  async submitRfq(data: any): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>('/rfq/submit', { method: 'POST', body: JSON.stringify(data) });
    }
    return this.request<any>('/rfq/submit', { method: 'POST', body: JSON.stringify(data) });
  }

  async viewRfq(rfqNumber: string, accessKey?: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      const qs = accessKey ? `?accessKey=${encodeURIComponent(accessKey)}` : '';
      return this.request<any>(`/rfq/view/${rfqNumber}${qs}`);
    }
    const qs = accessKey ? `?accessKey=${encodeURIComponent(accessKey)}` : '';
    return this.request<any>(`/rfq/view/${rfqNumber}${qs}`);
  }

  async respondToQuotation(rfqNumber: string, accessKey: string, action: 'ACCEPT' | 'REJECT', feedback?: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/rfq/${rfqNumber}/respond?accessKey=${encodeURIComponent(accessKey)}`, {
        method: 'POST',
        body: JSON.stringify({ action, feedback }),
      });
    }
    return this.request<any>(`/rfq/${rfqNumber}/respond?accessKey=${encodeURIComponent(accessKey)}`, {
      method: 'POST',
      body: JSON.stringify({ action, feedback }),
    });
  }

  async getAdminRfqs(query?: any): Promise<{ total: number; rfqs: any[] }> {
    if (ACTIVE_BACKEND === 'express') {
      const params = new URLSearchParams();
      if (query?.status) params.append('status', query.status);
      if (query?.search) params.append('search', query.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return this.request<any>(`/admin/rfq${qs}`);
    }
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/admin/rfq${qs}`);
  }

  async getAdminRfqById(id: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/rfq/${id}`);
    }
    return this.request<any>(`/admin/rfq/${id}`);
  }

  async assignRfqStaff(id: string, staffId: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/rfq/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ staffId }),
      });
    }
    return this.request<any>(`/admin/rfq/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ staffId }),
    });
  }

  async addRfqNote(id: string, internalNotes: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/rfq/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ internalNotes }),
      });
    }
    return this.request<any>(`/admin/rfq/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ internalNotes }),
    });
  }

  async createQuotation(id: string, quotationData: any): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/rfq/${id}/quote`, {
        method: 'POST',
        body: JSON.stringify(quotationData),
      });
    }
    return this.request<any>(`/admin/rfq/${id}/quote`, {
      method: 'POST',
      body: JSON.stringify(quotationData),
    });
  }

  async getQuotationPdf(id: string, quotationId: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/rfq/${id}/quote/${quotationId}/pdf?format=json`);
    }
    return this.request<any>(`/admin/rfq/${id}/quote/${quotationId}/pdf`);
  }

  async convertQuotationToOrder(id: string, quotationId: string): Promise<any> {
    if (ACTIVE_BACKEND === 'express') {
      return this.request<any>(`/admin/rfq/${id}/quote/${quotationId}/convert-to-order`, { method: 'POST' });
    }
    return this.request<any>(`/admin/rfq/${id}/quote/${quotationId}/convert-to-order`, { method: 'POST' });
  }

  // ── Transformers ──
  transformProduct(p: any): ApiProductTemplate {
    p=correctedProductImages(p);
    const rawCustom = p.custom_fields || {};
    const skuCount = p.variant_count != null ? Number(p.variant_count) : (rawCustom.variant_sku_count != null ? Number(rawCustom.variant_sku_count) : (p.variants ? p.variants.length : 0));

    let pubStatus: 'DRAFT' | 'UNPUBLISHED' | 'PUBLISHED' | 'ARCHIVED' = 'UNPUBLISHED';
    if (p.status === 'ACTIVE' || p.status === 'PUBLISHED') pubStatus = 'PUBLISHED';
    else if (p.status === 'DRAFT') pubStatus = 'DRAFT';
    else if (p.status === 'ARCHIVED') pubStatus = 'ARCHIVED';
    else pubStatus = 'UNPUBLISHED';

    const categoryObj = p.category ? {
      id: String(p.category.id),
      name: p.category.name_en || p.category.name || 'Category',
      nameAr: p.category.name_ar || p.category.name_en || p.category.name || '',
      code: p.category.slug || '',
    } : (p.category_name ? {
      id: String(p.category_id),
      name: p.category_name,
      nameAr: p.category_name_ar || p.category_name,
      code: ''
    } : undefined);

    const brandObj = p.brand ? {
      id: String(p.brand.id),
      name: p.brand.name || p.brand.name_en || 'Brand',
      code: p.brand.slug || '',
    } : (p.brand_name ? {
      id: String(p.brand_id),
      name: p.brand_name,
      code: ''
    } : undefined);

    const variantsList: ApiProductVariant[] = (p.variants && p.variants.length > 0)
      ? (p.variants || []).map((v: any): ApiProductVariant => ({
          id: String(v.id),
          sku: v.sku,
          diameterMm: v.diameter_mm ? Number(v.diameter_mm) : undefined,
          lengthValue: v.length_value ? Number(v.length_value) : undefined,
          lengthUnit: v.length_unit,
          color: v.color,
          colorAr: v.color_ar,
          strandConstruction: v.strand_construction || v.attributes?.strand_construction,
          material: v.material,
          materialAr: v.material_ar,
          sellingUnit: v.selling_unit || '',
          pricingStatus: v.price_approved ? 'APPROVED' : 'DRAFT',
          retailPrice: v.selling_price != null ? Number(v.selling_price) : null,
          costPrice: v.cost_price != null ? Number(v.cost_price) : undefined,
          availableStock: v.inventory_quantity != null ? Number(v.inventory_quantity) : (v.verified_stock ?? undefined),
          isInStock: v.inventory_quantity == null && v.verified_stock == null ? undefined : Number(v.inventory_quantity ?? v.verified_stock) > 0,
          purchaseEligible: Boolean(v.is_purchase_eligible),
        }))
      : [];

    return {
      id: String(p.id),
      code: p.source_sku || p.sku || p.slug || `PROD-${p.id}`,
      name: p.name_en || p.name || 'Product',
      nameAr: p.name_ar || p.name_en || p.name,
      categoryId: String(p.category_id || (p.category?.id || '')),
      category: categoryObj,
      productType: 'ROPE',
      brandId: p.brand_id ? String(p.brand_id) : undefined,
      brand: brandObj,
      primarySupplier: p.supplier_name ? { id: 'supp-1', name: p.supplier_name, code: '' } : undefined,
      countryOfOrigin: rawCustom.country_of_origin || undefined,
      verificationStatus: 'VERIFIED',
      publicationStatus: pubStatus,
      description: p.short_description_en || p.details_en || p.description,
      descriptionAr: p.short_description_ar || p.details_ar || p.description_ar,
      cardGallery: (p.card_gallery||[]).map((image:any)=>typeof image==='string'?image:image.url).filter(Boolean),
      cardDescription: p.card_description_en,
      cardDescriptionAr: p.card_description_ar,
      details: p.details_en,
      detailsAr: p.details_ar,
      howToUse: p.how_to_use_en,
      howToUseAr: p.how_to_use_ar,
      seoTitle: p.seo_title_en,
      seoTitleAr: p.seo_title_ar,
      metaDescription: p.seo_description_en,
      metaDescriptionAr: p.seo_description_ar,
      imageUrl: p.primary_image?.url || p.primary_image_url || p.images?.[0]?.url || p.images?.[0]?.webp_url || p.images?.[0]?.local_path,
      metadata: {
        ...(p.custom_fields || {}),
        photoStatus: p.photo_status,
        parentReference: p.source_id,
        enquiryColours: Array.isArray(p.enquiry_colours) ? p.enquiry_colours : [],
        priorityGallery: Array.isArray(p.gallery_priority_urls) ? p.gallery_priority_urls : [],
        master46: p.source_system === 'NAJMI_MASTER_46' || String(p.source_system || '').startsWith('NAJMI_CLIENT_APPROVAL_'),
        canonicalSlug: p.slug,
        listingContent: p.listing_content,
        discovery: p.discovery,
        variantCount: skuCount,
        hasReviewIssues: Boolean(rawCustom.group_review_decision === 'REVIEW' || rawCustom.review_flag || rawCustom.collision_review),
        imageApproval: rawCustom.image_approval || 'PENDING',
        contentApproval: rawCustom.content_approval || 'PENDING',
      },
      createdAt: p.created_at || new Date().toISOString(),
      variants: variantsList,
      media: (p.images || []).map((img: any, idx: number): ApiProductMedia => {
        const url = img.webp_url || img.local_path || img.url || img.cloudinary_url;
        return {
          id: String(img.id || idx),
          templateId: String(p.id),
          originalUrl: url,
          webpUrl: url,
          cardUrl: img.card_url || url,
          thumbnailUrl: img.thumbnail_url || url,
          orderIndex: img.image_order ?? idx + 1,
          isPrimary: (img.image_order === 1) || (idx === 0),
          altText: img.alt_en,
          altTextAr: img.alt_ar,
          colour: img.colour || undefined,
          generated: img.generated,
          contentType: img.content_type,
        };
      }),
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
      subtotal: Number(o.subtotal || o.subtotal_amount || 0),
      deliveryFee: Number(o.delivery_fee || o.shipping_amount || 0),
      grandTotal: Number(o.total_amount || 0),
      paymentMethod: 'COD',
      paymentStatus: o.payment_status || (o.status === 'DELIVERED' ? 'PAID' : 'PENDING_COLLECTION'),
      orderStatus: o.status || 'PENDING_CONFIRMATION',
      collectedAmount: Number(o.collected_amount || (o.payment_status === 'PAID' ? o.total_amount : 0)),
      createdAt: o.created_at || new Date().toISOString(),
      lines: (o.items || []).map((it: any): ApiOrderLine => ({
        id: String(it.id),
        productName: it.product_name_en || it.product_name || it.name,
        sku: it.sku || `SKU-${it.id}`,
        quantity: it.quantity || it.qty || 1,
        unitPrice: Number(it.price_at_purchase || it.unit_price || 0),
        subtotal: Number((it.price_at_purchase || it.unit_price || 0) * (it.quantity || it.qty || 1)),
      })),
      collections: (o.cash_transactions || []).map((ct: any): ApiOrderCollection => ({
        id: String(ct.id),
        amountCollected: Number(ct.amount),
        staffName: 'Authorized Staff',
        collectedAt: ct.created_at,
        hasDiscrepancy: false,
        referenceNotes: ct.note,
      })),
    };
  }
}

export const api = new ApiService();
