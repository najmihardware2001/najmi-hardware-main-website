import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../StoreContext';
import { useAuth } from '../../AuthContext';
import { api, type ApiProductTemplate, type ApiProductVariant } from '../../services/api';
import MasterCatalogueAdmin from '../../components/MasterCatalogueAdmin';

export default function AdminProducts() {
  const { showToast } = useStore();
  const { user } = useAuth();

  // ── State: Product List ──
  const [templates, setTemplates] = useState<ApiProductTemplate[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [erpOnline, setErpOnline] = useState(false);
  const [loadError,setLoadError]=useState('');
  const [summary,setSummary]=useState<any>(null);
  const [page,setPage]=useState(0);
  const pageSize=50;
  const [search, setSearch] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState<'MASTER46' | 'ALL' | 'YUESHENG' | 'STAR_ROPE'>('MASTER46');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'updatedAt'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Categories & Brands
  const [categories, setCategories] = useState<{ id: string; name: string; nameAr: string; code: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string; code: string }[]>([]);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Gallery Quick Drawer
  const [expandedGalleryId, setExpandedGalleryId] = useState<string | null>(null);
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);
  const [imageFormatPref, setImageFormatPref] = useState<'webp' | 'original'>('webp');

  // ── State: Product Editor Modal ──
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ApiProductTemplate | null>(null);
  const [editorTab, setEditorTab] = useState<'general' | 'variants' | 'media'>('general');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    categoryId: '',
    brandId: '',
    countryOfOrigin: 'China',
    productType: 'ROPE',
    publicationStatus: 'UNPUBLISHED',
    verificationStatus: 'PENDING_REVIEW',
  });

  // Price & Stock Adjustment Modals
  const [priceModalVariant, setPriceModalVariant] = useState<ApiProductVariant | null>(null);
  const [newRetailPrice, setNewRetailPrice] = useState<string>('');
  const [priceReason, setPriceReason] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);

  const [stockModalVariant, setStockModalVariant] = useState<ApiProductVariant | null>(null);
  const [newStockQty, setNewStockQty] = useState<string>('');
  const [stockReason, setStockReason] = useState<string>('');
  const [savingStock, setSavingStock] = useState(false);

  // New Variant Form in Editor
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantDiameter, setNewVariantDiameter] = useState('');
  const [newVariantLength, setNewVariantLength] = useState('');
  const [newVariantColor, setNewVariantColor] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Fetching Data ──
  const loadMetadata = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.getCategories(),
        api.getBrands(),
      ]);
      setCategories(catRes);
      setBrands(brandRes);
    } catch (e) {
      console.warn('Failed to fetch categories/brands:', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);setLoadError('');
    try {
      const res = await api.getTemplates({
        search: search || undefined,
        publicationStatus: selectedStatus || undefined,
        categoryId: selectedCategory || undefined,
        brandId: selectedBrand || undefined,
        catalogSource: selectedCatalog === 'ALL' ? undefined : selectedCatalog,
        take: pageSize,skip:page*pageSize,
      });
      setTemplates(res.items);
      setTotalCount(res.total);
      setErpOnline(true);
      api.catalogue('/admin/products/summary').then(setSummary).catch(()=>{});
    } catch (err: any) {
      console.warn('Backend query error:', err);
      setErpOnline(false);setLoadError(err.message||'Unable to load products. Retry the request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [user, search, selectedStatus, selectedCategory, selectedBrand, selectedCatalog,page]);
  useEffect(()=>setPage(0),[search,selectedStatus,selectedCategory,selectedBrand,selectedCatalog]);

  // ── Sorting ──
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      let valA: any = a[sortBy as keyof ApiProductTemplate] || '';
      let valB: any = b[sortBy as keyof ApiProductTemplate] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [templates, sortBy, sortOrder]);

  // ── Single Actions ──
  const handleTogglePublication = async (template: ApiProductTemplate) => {
    if (template.publicationStatus === 'DRAFT') {
      showToast('Client inventory draft products cannot be published until prices and sellable stock are approved', 'warning');
      return;
    }
    const nextStatus = template.publicationStatus === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    try {
      await api.updateTemplateStatus(template.id, { publicationStatus: nextStatus });
      showToast(`Product ${nextStatus === 'PUBLISHED' ? 'published to live storefront' : 'unlisted from storefront'}`, 'verified');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleArchive = async (templateId: string) => {
    if (!confirm('Are you sure you want to archive this product? It will be removed from all active catalogues.')) return;
    try {
      await api.deleteTemplate(templateId);
      showToast('Product archived successfully', 'archive');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive product', 'error');
    }
  };

  const handleDuplicate = async (templateId: string) => {
    try {
      const duplicated = await api.duplicateTemplate(templateId);
      showToast(`Product duplicated as Draft (${duplicated.code})`, 'check_circle');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate product', 'error');
    }
  };

  // ── Bulk Actions ──
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(templates.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkPublish = async () => {
    if (!selectedIds.length) return;
    setBulkActionLoading(true);
    try {
      const res = await api.bulkUpdateStatus(selectedIds, 'PUBLISHED');
      if (res.failed.length > 0) {
        showToast(`Published ${res.updated.length} items. ${res.failed.length} failed validation (missing price or photo).`, 'warning');
      } else {
        showToast(`Published all ${res.updated.length} selected products!`, 'check_circle');
      }
      setSelectedIds([]);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Bulk publish failed', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnlist = async () => {
    if (!selectedIds.length) return;
    setBulkActionLoading(true);
    try {
      const res = await api.bulkUpdateStatus(selectedIds, 'UNPUBLISHED');
      showToast(`Unlisted ${res.updated.length} products from storefront.`, 'check_circle');
      setSelectedIds([]);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Bulk unlist failed', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Are you sure you want to archive ${selectedIds.length} products?`)) return;
    setBulkActionLoading(true);
    try {
      const res = await api.bulkUpdateStatus(selectedIds, 'ARCHIVED');
      showToast(`Archived ${res.updated.length} products.`, 'archive');
      setSelectedIds([]);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Bulk archive failed', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ── Product Editor Open/Close ──
  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      code: `TMPL-NEW-${Date.now().toString().slice(-4)}`,
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      countryOfOrigin: 'China',
      productType: 'ROPE',
      publicationStatus: 'DRAFT',
      verificationStatus: 'DRAFT',
    });
    setEditorTab('general');
    setEditorOpen(true);
  };

  const openEditModal = async (template: ApiProductTemplate) => {
    setEditingTemplate(template);
    setFormData({
      code: template.code,
      name: template.name,
      nameAr: template.nameAr || '',
      description: template.description || '',
      descriptionAr: template.descriptionAr || '',
      categoryId: template.categoryId || categories[0]?.id || '',
      brandId: template.brand?.id || '',
      countryOfOrigin: template.countryOfOrigin || '',
      productType: template.productType || 'ROPE',
      publicationStatus: template.publicationStatus,
      verificationStatus: template.verificationStatus,
    });
    setEditorTab('general');
    setEditorOpen(true);

    try {
      const full = await api.getTemplateById(template.id);
      if (full && full.id === template.id) {
        setEditingTemplate(full);
      }
    } catch (e) {
      console.warn('Could not load full template details:', e);
    }
  };

  const handleSaveTemplate = async (publishImmediate = false) => {
    setSavingTemplate(true);
    try {
      const payload = {
        ...formData,
        publicationStatus: publishImmediate ? 'PUBLISHED' : formData.publicationStatus,
      };

      if (editingTemplate) {
        await api.updateTemplate(editingTemplate.id, payload as any);
        showToast('Product specifications updated successfully', 'check_circle');
      } else {
        await api.createTemplate(payload as any);
        showToast('Product template created successfully', 'check_circle');
      }
      setEditorOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  // ── Price Adjustment Handler ──
  const openPriceModal = (variant: ApiProductVariant) => {
    setPriceModalVariant(variant);
    setNewRetailPrice(variant.retailPrice != null ? Number(variant.retailPrice).toFixed(3) : '');
    setPriceReason('Price review adjustment');
  };

  const handleSavePrice = async () => {
    if (!priceModalVariant) return;
    const priceNum = parseFloat(newRetailPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Enter a valid non-negative retail price in KWD', 'warning');
      return;
    }
    setSavingPrice(true);
    try {
      await api.updateVariantPrice(priceModalVariant.id, priceNum, undefined, priceReason || 'Manual Admin Price Correction', editingTemplate?.id);
      showToast(`Updated retail price to ${priceNum.toFixed(3)} KWD (audited)`, 'price_check');
      setPriceModalVariant(null);
      fetchProducts();
      if (editingTemplate) {
        const refreshed = await api.getTemplateById(editingTemplate.id);
        setEditingTemplate(refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update price', 'error');
    } finally {
      setSavingPrice(false);
    }
  };

  // ── Stock Adjustment Handler ──
  const openStockModal = (variant: ApiProductVariant) => {
    setStockModalVariant(variant);
    const onHand = variant.stockQuants?.reduce((sum, q) => sum + Number(q.quantityOnHand), 0) || 0;
    setNewStockQty(String(onHand));
    setStockReason('Physical inventory verification');
  };

  const handleSaveStock = async () => {
    if (!stockModalVariant) return;
    const qtyNum = parseFloat(newStockQty);
    if (isNaN(qtyNum) || qtyNum < 0) {
      showToast('Enter a valid non-negative stock quantity', 'warning');
      return;
    }
    if (!stockReason.trim()) {
      showToast('A reason for stock correction is required for auditing', 'warning');
      return;
    }
    setSavingStock(true);
    try {
      await api.adjustInventory(stockModalVariant.id, qtyNum, stockReason);
      showToast(`Audited stock updated to ${qtyNum} units`, 'warehouse');
      setStockModalVariant(null);
      fetchProducts();
      if (editingTemplate) {
        const refreshed = await api.getTemplateById(editingTemplate.id);
        setEditingTemplate(refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust inventory', 'error');
    } finally {
      setSavingStock(false);
    }
  };

  // ── Add New Variant to Editing Template ──
  const handleAddVariant = async () => {
    if (!editingTemplate) return;
    if (!newVariantSku.trim()) {
      showToast('SKU is required', 'warning');
      return;
    }
    try {
      const priceVal = newVariantPrice ? parseFloat(newVariantPrice) : null;
      await api.createVariant({
        templateId: editingTemplate.id,
        sku: newVariantSku.trim(),
        diameterMm: newVariantDiameter ? parseFloat(newVariantDiameter) : undefined,
        lengthValue: newVariantLength ? parseFloat(newVariantLength) : undefined,
        color: newVariantColor.trim() || undefined,
        retailPrice: priceVal,
        pricingStatus: priceVal ? 'APPROVED' : 'DRAFT',
        costPrice: 0,
        sellingUnit: 'PIECE',
        isStockable: true,
      });
      showToast(`Variant ${newVariantSku} added`, 'check');
      setNewVariantSku('');
      setNewVariantDiameter('');
      setNewVariantLength('');
      setNewVariantColor('');
      setNewVariantPrice('');
      const refreshed = await api.getTemplateById(editingTemplate.id);
      setEditingTemplate(refreshed);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to add variant', 'error');
    }
  };

  // ── Media Actions ──
  const triggerFileUpload = (templateId: string) => {
    setUploadingForId(templateId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingForId) return;

    try {
      showToast('Uploading & converting to WebP derivative...', 'cloud_upload');
      await api.uploadMedia(uploadingForId, file);
      showToast('Photo uploaded & WebP derivative generated', 'check_circle');
      fetchProducts();
      if (editingTemplate && editingTemplate.id === uploadingForId) {
        const refreshed = await api.getTemplateById(uploadingForId);
        setEditingTemplate(refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingForId(null);
    }
  };

  const handleSetPrimaryMedia = async (templateId: string, mediaId: string) => {
    try {
      await api.setPrimaryMedia(templateId, mediaId);
      showToast('Primary thumbnail updated', 'image');
      fetchProducts();
      if (editingTemplate && editingTemplate.id === templateId) {
        const refreshed = await api.getTemplateById(templateId);
        setEditingTemplate(refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update primary image', 'error');
    }
  };

  const handleDeleteMedia = async (templateId: string, mediaId: string) => {
    if (!confirm('Are you sure you want to remove this photograph?')) return;
    try {
      await api.deleteMedia(templateId, mediaId);
      showToast('Photo removed', 'delete');
      fetchProducts();
      if (editingTemplate && editingTemplate.id === templateId) {
        const refreshed = await api.getTemplateById(templateId);
        setEditingTemplate(refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete photo', 'error');
    }
  };

  const handleReorderMedia = async (templateId: string, mediaIds: string[], fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= mediaIds.length) return;
    const newOrder = [...mediaIds];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    try {
      await api.reorderMedia(templateId, newOrder);
      showToast('Gallery order updated', 'swap_horiz');
      fetchProducts();
      if (editingTemplate && editingTemplate.id === templateId) {
        const refreshed = await api.getTemplateById(templateId);
        setEditingTemplate(refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reorder images', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 80 }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#fff' }}>inventory_2</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="text-headline-md" style={{ color: 'var(--primary)', margin: 0, lineHeight: 1.2 }}>
                Products
              </h1>
              <span style={{
                background: erpOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: erpOnline ? '#16a34a' : '#ef4444',
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: erpOnline ? '#16a34a' : '#ef4444' }} />
                {loading?'Loading…':erpOnline?'Connected':'Connection error'}
              </span>
            </div>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Manage products, variant prices, stock availability & supplier photography ({totalCount} catalog templates)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Format preference */}
          <div style={{
            display: 'inline-flex', padding: 2, borderRadius: 6,
            background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', fontSize: 12
          }}>
            <button
              onClick={() => setImageFormatPref('webp')}
              style={{
                padding: '4px 8px', borderRadius: 4, border: 'none',
                background: imageFormatPref === 'webp' ? 'var(--primary)' : 'transparent',
                color: imageFormatPref === 'webp' ? '#fff' : 'var(--on-surface)',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              WebP
            </button>
            <button
              onClick={() => setImageFormatPref('original')}
              style={{
                padding: '4px 8px', borderRadius: 4, border: 'none',
                background: imageFormatPref === 'original' ? 'var(--primary)' : 'transparent',
                color: imageFormatPref === 'original' ? '#fff' : 'var(--on-surface)',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Original JPG
            </button>
          </div>

          <button
            onClick={fetchProducts}
            disabled={loading}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, animation: loading ? 'spin 1s infinite linear' : 'none' }}>sync</span>
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--primary)', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add Product
          </button>
        </div>
      </div>

      {loadError&&<div role="alert" className="admin-error">{loadError} <button type="button" onClick={fetchProducts}>Retry</button></div>}
      {/* Catalog Source Filter Tabs */}
      <div data-testid="catalogue-tabs" style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        background: 'var(--surface-container-low)', padding: '6px 8px',
        borderRadius: 12, border: '1px solid var(--outline-variant)'
      }}>
        <button type="button" className={selectedCatalog==='MASTER46'?'btn btn-primary':'btn btn-outline'} onClick={()=>{setSelectedCatalog('MASTER46');setSelectedStatus('')}}>Selected Catalogue <strong>{summary?.selected??'—'}</strong></button>
        <button
          onClick={() => { setSelectedCatalog('ALL'); setSelectedStatus(''); }}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: selectedCatalog === 'ALL' && !selectedStatus ? 'var(--primary)' : 'transparent',
            color: selectedCatalog === 'ALL' && !selectedStatus ? '#ffffff' : 'var(--on-surface)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: selectedCatalog === 'ALL' && !selectedStatus ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span>All Products</span>
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 10,
            background: selectedCatalog === 'ALL' && !selectedStatus ? 'rgba(255,255,255,0.25)' : 'var(--surface-container-high)',
            color: selectedCatalog === 'ALL' && !selectedStatus ? '#ffffff' : 'var(--on-surface-variant)',
            fontWeight: 700
          }}>
            {summary?.total??'—'}
          </span>
        </button>

        <button
          onClick={() => { setSelectedCatalog('YUESHENG'); setSelectedStatus(''); }}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: selectedCatalog === 'YUESHENG' ? 'var(--primary)' : 'transparent',
            color: selectedCatalog === 'YUESHENG' ? '#ffffff' : 'var(--on-surface)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: selectedCatalog === 'YUESHENG' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17, color: selectedCatalog === 'YUESHENG' ? '#fff' : '#16a34a' }}>photo_camera</span>
          <span>Yuesheng Supplier Catalog</span>
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 10,
            background: selectedCatalog === 'YUESHENG' ? 'rgba(255,255,255,0.25)' : 'rgba(22, 163, 74, 0.15)',
            color: selectedCatalog === 'YUESHENG' ? '#ffffff' : '#16a34a',
            fontWeight: 700
          }}>
            {summary?.supplier??'—'} records
          </span>
        </button>

        <button
          onClick={() => { setSelectedCatalog('ALL'); setSelectedStatus('PUBLISHED'); }}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: selectedStatus === 'PUBLISHED' ? '#16a34a' : 'transparent',
            color: selectedStatus === 'PUBLISHED' ? '#ffffff' : 'var(--on-surface)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: selectedStatus === 'PUBLISHED' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17, color: selectedStatus === 'PUBLISHED' ? '#fff' : '#16a34a' }}>storefront</span>
          <span>Live Storefront Published</span>
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 10,
            background: selectedStatus === 'PUBLISHED' ? 'rgba(255,255,255,0.25)' : 'rgba(22, 163, 74, 0.15)',
            color: selectedStatus === 'PUBLISHED' ? '#ffffff' : '#16a34a',
            fontWeight: 700
          }}>
            {summary?.published??'—'} published
          </span>
        </button>

        <button
          onClick={() => { setSelectedCatalog('ALL'); setSelectedStatus('DRAFT'); }}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: selectedStatus === 'DRAFT' ? '#ca8a04' : 'transparent',
            color: selectedStatus === 'DRAFT' ? '#ffffff' : 'var(--on-surface)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: selectedStatus === 'DRAFT' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17, color: selectedStatus === 'DRAFT' ? '#fff' : '#ca8a04' }}>edit_note</span>
          <span>Draft Client Catalogue</span>
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 10,
            background: selectedStatus === 'DRAFT' ? 'rgba(255,255,255,0.25)' : 'rgba(202, 138, 4, 0.15)',
            color: selectedStatus === 'DRAFT' ? '#ffffff' : '#ca8a04',
            fontWeight: 700
          }}>
            {summary?.drafts?.toLocaleString()??'—'} drafts
          </span>
        </button>
      </div>

      <MasterCatalogueAdmin/>
      {/* Filter / Search Bar */}
      <div style={{
        background: 'var(--surface-container-lowest)', borderRadius: 12,
        padding: '14px 18px', border: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flex: 1,
            background: 'var(--surface-container-low)', padding: '8px 12px',
            borderRadius: 8, border: '1px solid var(--outline-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--outline)' }}>search</span>
            <input
              type="text"
              placeholder="Search products by title, SKU, or Arabic name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                width: '100%', fontSize: 13, color: 'var(--on-surface)'
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Publication Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
              fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', outline: 'none'
            }}
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published (Storefront Active)</option>
            <option value="UNPUBLISHED">Unpublished (Pending)</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
              fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', outline: 'none'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Brand */}
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
              fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', outline: 'none'
            }}
          >
            <option value="">All Brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
              fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', outline: 'none'
            }}
          >
            <option value="code">Sort by SKU</option>
            <option value="name">Sort by Name</option>
            <option value="updatedAt">Sort by Date</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title="Toggle Sort Direction"
            style={{
              padding: '8px', borderRadius: 8,
              border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
              cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Products Table */}
      <div style={{
        background: 'var(--surface-container-lowest)', borderRadius: 12,
        border: '1px solid var(--outline-variant)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
                <th style={{ padding: '12px 16px', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === templates.length && templates.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>Product</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>SKU / Page</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>Retail Price</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>Available Stock</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--on-surface-variant)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--outline)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear' }}>sync</span>
                      Loading products from PostgreSQL database...
                    </div>
                  </td>
                </tr>
              ) : sortedTemplates.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--outline)' }}>
                    No products found matching your current filter.
                  </td>
                </tr>
              ) : (
                sortedTemplates.map(tmpl => {
                  const isSelected = selectedIds.includes(tmpl.id);
                  const isPublished = tmpl.publicationStatus === 'PUBLISHED';
                  const variants = tmpl.variants || [];
                  const mediaList = tmpl.media || [];
                  
                  // Calculate display price
                  const pricedVariants = variants.filter(v => v.retailPrice != null);
                  let priceDisplay = 'Price Not Set';
                  if (pricedVariants.length > 0) {
                    const minPrice = Math.min(...pricedVariants.map(v => Number(v.retailPrice)));
                    const maxPrice = Math.max(...pricedVariants.map(v => Number(v.retailPrice)));
                    priceDisplay = minPrice === maxPrice 
                      ? `${minPrice.toFixed(3)} KWD` 
                      : `${minPrice.toFixed(3)} - ${maxPrice.toFixed(3)} KWD`;
                  }

                  // Calculate total stock
                  const totalOnHand = variants.reduce((sum, v) => {
                    const quants = v.stockQuants || [];
                    return sum + quants.reduce((qSum, q) => qSum + Number(q.quantityOnHand), 0);
                  }, 0);

                  const primaryMedia = mediaList.find(m => m.isPrimary) || mediaList[0];
                  const imgSrc = primaryMedia
                    ? (imageFormatPref === 'webp'
                        ? (primaryMedia.thumbnailUrl || primaryMedia.cardUrl || primaryMedia.webpUrl || primaryMedia.originalUrl)
                        : (primaryMedia.originalUrl || primaryMedia.thumbnailUrl || primaryMedia.cardUrl))
                    : (tmpl.imageUrl || '/placeholder.svg');
                  const sourcePage = primaryMedia?.sourcePdfPage || (tmpl.metadata as any)?.catalogPage || (tmpl.metadata as any)?.sourcePdfPage;

                  return (
                    <React.Fragment key={tmpl.id}>
                      <tr
                        style={{
                        borderBottom: '1px solid var(--outline-variant)',
                        background: isSelected ? 'rgba(4, 98, 90, 0.04)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tmpl.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Product Thumbnail & Names */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            onClick={() => setExpandedGalleryId(expandedGalleryId === tmpl.id ? null : tmpl.id)}
                            style={{
                              width: 48, height: 48, borderRadius: 8,
                              background: '#ffffff', overflow: 'hidden',
                              position: 'relative', flexShrink: 0, cursor: 'pointer',
                              border: '1px solid var(--outline-variant)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            title="Click to view full photo gallery"
                          >
                            <img
                              src={imgSrc}
                              alt={tmpl.name}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (primaryMedia?.cardUrl && !target.src.endsWith(primaryMedia.cardUrl)) {
                                  target.src = primaryMedia.cardUrl;
                                } else if (primaryMedia?.originalUrl && !target.src.endsWith(primaryMedia.originalUrl)) {
                                  target.src = primaryMedia.originalUrl;
                                } else if (tmpl.imageUrl && !target.src.endsWith(tmpl.imageUrl)) {
                                  target.src = tmpl.imageUrl;
                                } else if (!target.src.endsWith('/placeholder.svg')) {
                                  target.src = '/placeholder.svg';
                                }
                              }}
                            />
                            {mediaList.length > 1 && (
                              <span style={{
                                position: 'absolute', bottom: 2, right: 2,
                                background: 'rgba(0,0,0,0.7)', color: '#fff',
                                fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 4
                              }}>
                                +{mediaList.length - 1}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{tmpl.name}</span>
                            {tmpl.nameAr && (
                              <span style={{ fontSize: 11, color: 'var(--outline)', direction: 'rtl', marginTop: 1 }}>
                                {tmpl.nameAr}
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: 10, background: 'rgba(4, 98, 90, 0.08)', color: 'var(--primary)',
                                padding: '1px 6px', borderRadius: 4, fontWeight: 600
                              }}>
                                {tmpl.primarySupplier?.name ? 'Yuesheng' : (tmpl.brand?.name || 'Najmi Catalog')}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 600 }}>
                                {variants.length} original SKU{variants.length === 1 ? '' : 's'}
                              </span>
                              {mediaList.length === 0 && (!tmpl.imageUrl || tmpl.imageUrl.includes('placeholder')) && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 2,
                                  fontSize: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626',
                                  padding: '1px 6px', borderRadius: 4, fontWeight: 600
                                }} title="Pending photograph capture and verification">
                                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>no_photography</span>
                                  No Photos
                                </span>
                              )}
                              {((tmpl.metadata as any)?.contentApproval === 'PENDING' || (tmpl.metadata as any)?.content_approval === 'PENDING') && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 2,
                                  fontSize: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb',
                                  padding: '1px 6px', borderRadius: 4, fontWeight: 600
                                }} title="A+ editorial content draft pending review">
                                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>article</span>
                                  Content Draft
                                </span>
                              )}
                              {Boolean((tmpl.metadata as any)?.hasReviewIssues || (tmpl.metadata as any)?.group_review_decision === 'REVIEW') && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 2,
                                  fontSize: 10, background: 'rgba(245, 158, 11, 0.15)', color: '#b45309',
                                  padding: '1px 6px', borderRadius: 4, fontWeight: 600
                                }} title="Flagged for duplicate/variant collision or family grouping review">
                                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>warning</span>
                                  Variant Review
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Catalogue Page */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: 'var(--on-surface)' }}>
                            {tmpl.code}
                          </span>
                          {sourcePage && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 2,
                              fontSize: 10, background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c',
                              padding: '1px 6px', borderRadius: 4, width: 'fit-content', fontWeight: 600
                            }}>
                              Supplier Pg {sourcePage}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category & Specifications */}
                      <td style={{ padding: '12px 16px', color: 'var(--on-surface-variant)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontWeight: 600 }}>{tmpl.category?.name || 'Unassigned'}</span>
                          {(tmpl.metadata as any)?.diameter_spec?.display ? (
                            <span style={{
                              fontSize: 11,
                              color: (tmpl.metadata as any)?.diameter_spec?.kind === 'range_only' ? '#d97706' : 'var(--primary)',
                              fontWeight: 600
                            }}>
                              {(tmpl.metadata as any).diameter_spec.display}
                              {(tmpl.metadata as any).diameter_spec.kind === 'range_only' ? ' (Range)' : ''}
                            </span>
                          ) : (tmpl.metadata as any)?.pack_weight_spec?.display ? (
                            <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>
                              {(tmpl.metadata as any).pack_weight_spec.display} (Weight)
                            </span>
                          ) : (tmpl.metadata as any)?.length_spec?.display ? (
                            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                              {(tmpl.metadata as any).length_spec.display}
                            </span>
                          ) : (tmpl.metadata as any)?.material ? (
                            <span style={{ fontSize: 10, color: 'var(--outline)' }} title={(tmpl.metadata as any).material}>
                              {String((tmpl.metadata as any).material).slice(0, 24)}...
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Retail Price */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {pricedVariants.length > 0 ? (
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                {priceDisplay}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '2px 8px', borderRadius: 4,
                                background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626',
                                fontSize: 11, fontWeight: 700, letterSpacing: '0.02em'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>money_off</span>
                                Missing Price
                              </span>
                            )}
                            {variants[0] && (
                              <button
                                onClick={() => openPriceModal(variants[0])}
                                title="Edit price"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                              </button>
                            )}
                          </div>
                          <span style={{
                            fontSize: 10,
                            color: pricedVariants.length > 0 ? '#16a34a' : '#ea580c',
                            fontWeight: 600
                          }}>
                            {pricedVariants.length > 0 ? 'Pricing Approved' : 'Draft Price'}
                          </span>
                        </div>
                      </td>

                      {/* Available Stock */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600,
                            color: totalOnHand > 0 ? '#16a34a' : 'var(--outline)'
                          }}>
                            {variants.length&&variants.every(v=>v.availableStock!=null)?`${totalOnHand} units`:'Needs confirmation'}
                          </span>
                          {variants[0] && (
                            <button
                              onClick={() => openStockModal(variants[0])}
                              title="Correct verified stock"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warehouse</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Publication Status */}
                      <td style={{ padding: '12px 16px' }}>
                        {tmpl.publicationStatus === 'DRAFT' ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(202, 138, 4, 0.15)',
                            color: '#ca8a04'
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ca8a04' }} />
                            Draft
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                            background: isPublished ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 88, 12, 0.12)',
                            color: isPublished ? '#16a34a' : '#ea580c'
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPublished ? '#16a34a' : '#ea580c' }} />
                            {isPublished ? 'Published' : 'Unpublished'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {/* Toggle Publish / Unlist */}
                          <button
                            onClick={() => handleTogglePublication(tmpl)}
                            title={isPublished ? 'Unlist from Storefront' : 'Publish to Live Storefront'}
                            style={{
                              padding: '5px 10px', borderRadius: 6,
                              border: isPublished ? '1px solid #ea580c' : '1px solid #16a34a',
                              background: isPublished ? 'rgba(234, 88, 12, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                              color: isPublished ? '#ea580c' : '#16a34a',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {isPublished ? 'Unlist' : 'Publish'}
                          </button>

                          {/* Quick Photo Gallery Drawer */}
                          <button
                            onClick={() => setExpandedGalleryId(expandedGalleryId === tmpl.id ? null : tmpl.id)}
                            title={mediaList.length > 0 ? `View ${mediaList.length} Photographs` : 'Click to inspect product gallery'}
                            style={{
                              padding: '5px 8px', borderRadius: 6,
                              border: expandedGalleryId === tmpl.id ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                              background: expandedGalleryId === tmpl.id ? 'rgba(4, 98, 90, 0.12)' : 'var(--surface-container-high)',
                              color: mediaList.length > 0 ? 'var(--primary)' : 'var(--outline)',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 3
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_library</span>
                            {mediaList.length > 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700 }}>{mediaList.length}</span>
                            )}
                          </button>

                          {/* Edit Full Product */}
                          <button
                            onClick={() => openEditModal(tmpl)}
                            title="Edit Product Details & Variants"
                            style={{
                              padding: '5px 8px', borderRadius: 6,
                              border: '1px solid var(--outline-variant)',
                              background: 'var(--surface-container-high)',
                              color: 'var(--on-surface)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          </button>

                          {/* Preview in Storefront */}
                          <button
                            onClick={() => window.open(`/product/${tmpl.id}`, '_blank')}
                            title="Preview in Storefront"
                            style={{
                              padding: '5px 8px', borderRadius: 6,
                              border: '1px solid var(--outline-variant)',
                              background: 'var(--surface-container-high)',
                              color: 'var(--primary)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                          </button>

                          {/* Duplicate as Draft */}
                          <button
                            onClick={() => handleDuplicate(tmpl.id)}
                            title="Duplicate as Draft"
                            style={{
                              padding: '5px 8px', borderRadius: 6,
                              border: '1px solid var(--outline-variant)',
                              background: 'var(--surface-container-high)',
                              color: 'var(--on-surface-variant)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                          </button>

                          {/* Archive */}
                          <button
                            onClick={() => handleArchive(tmpl.id)}
                            title="Archive Product"
                            style={{
                              padding: '5px 8px', borderRadius: 6,
                              border: '1px solid var(--outline-variant)',
                              background: 'var(--surface-container-high)',
                              color: 'var(--outline)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>archive</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedGalleryId === tmpl.id && (
                      <tr key={`gallery-${tmpl.id}`} style={{ background: 'var(--surface-container-low)' }}>
                        <td colSpan={8} style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline-variant)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 18 }}>photo_library</span>
                              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                                Enhanced Supplier Photographs for {tmpl.name} ({mediaList.length} photos)
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--outline)', background: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: 4 }}>
                                1:1 Aspect Ratio • White Background • No Crop Distortion
                              </span>
                            </div>
                            <button
                              onClick={() => setExpandedGalleryId(null)}
                              style={{
                                border: 'none', background: 'transparent', cursor: 'pointer',
                                color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                              Close
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                            {mediaList.map((m, mIdx) => (
                              <div
                                key={m.id}
                                style={{
                                  flex: '0 0 160px', borderRadius: 10, overflow: 'hidden',
                                  border: m.isPrimary ? '2px solid #16a34a' : '1px solid var(--outline-variant)',
                                  background: '#ffffff', display: 'flex', flexDirection: 'column'
                                }}
                              >
                                <div style={{ width: '100%', height: 140, background: '#fff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img
                                    src={m.thumbnailUrl || m.cardUrl || m.webpUrl || m.originalUrl}
                                    alt={m.altText || ''}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (m.cardUrl && !target.src.endsWith(m.cardUrl)) {
                                        target.src = m.cardUrl;
                                      } else if (m.originalUrl && !target.src.endsWith(m.originalUrl)) {
                                        target.src = m.originalUrl;
                                      } else if (!target.src.endsWith('/placeholder.svg')) {
                                        target.src = '/placeholder.svg';
                                      }
                                    }}
                                  />
                                  {m.isPrimary && (
                                    <span style={{
                                      position: 'absolute', top: 6, left: 6, background: '#16a34a',
                                      color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4
                                    }}>
                                      PRIMARY
                                    </span>
                                  )}
                                  {m.sourcePdfPage && (
                                    <span style={{
                                      position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)',
                                      color: '#fff', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4
                                    }}>
                                      Pg {m.sourcePdfPage}
                                    </span>
                                  )}
                                </div>
                                <div style={{ padding: '8px 10px', fontSize: 11, background: 'var(--surface-container-lowest)', borderTop: '1px solid var(--outline-variant)' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {m.altText?.replace(`${tmpl.name} — `, '') || `Photo #${mIdx + 1}`}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                                    {!m.isPrimary ? (
                                      <button
                                        onClick={() => handleSetPrimaryMedia(tmpl.id, m.id)}
                                        style={{
                                          border: '1px solid var(--outline-variant)', background: 'transparent',
                                          borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer',
                                          color: 'var(--primary)', fontWeight: 600
                                        }}
                                      >
                                        Set Primary
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Active</span>
                                    )}
                                    <a
                                      href={m.webpUrl || m.originalUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Open full 1200x1200 image"
                                      style={{ fontSize: 10, color: 'var(--outline)', textDecoration: 'none' }}
                                    >
                                      1200px ↗
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-pagination" aria-label="Product pages"><span>{loading?'Loading products…':`${totalCount?Math.min(page*pageSize+1,totalCount):0}–${Math.min((page+1)*pageSize,totalCount)} of ${totalCount.toLocaleString()} products`}</span><button className="btn btn-outline" disabled={loading||page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><button className="btn btn-outline" disabled={loading||(page+1)*pageSize>=totalCount} onClick={()=>setPage(p=>p+1)}>Next</button></div>
      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--primary)', color: '#fff', padding: '10px 20px',
          borderRadius: 12, boxShadow: 'var(--shadow-xl)', display: 'flex', alignItems: 'center',
          gap: 16, zIndex: 100, border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            {selectedIds.length} product{selectedIds.length === 1 ? '' : 's'} selected
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleBulkPublish}
              disabled={bulkActionLoading}
              style={{
                background: '#16a34a', color: '#fff', border: 'none',
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>publish</span>
              Bulk Publish
            </button>

            <button
              onClick={handleBulkUnlist}
              disabled={bulkActionLoading}
              style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Unlist
            </button>

            <button
              onClick={handleBulkArchive}
              disabled={bulkActionLoading}
              style={{
                background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', border: 'none',
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Archive
            </button>

            <button
              onClick={() => setSelectedIds([])}
              style={{
                background: 'transparent', color: '#fff', border: 'none',
                cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        </div>
      )}

      {/* ── PRODUCT EDITOR MODAL / DRAWER ── */}
      {editorOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16
        }}>
          <div style={{
            background: 'var(--surface-container-lowest)', borderRadius: 16,
            width: '100%', maxWidth: 840, maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--outline-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h2 className="text-headline-sm" style={{ margin: 0, color: 'var(--primary)' }}>
                  {editingTemplate ? `Edit: ${editingTemplate.name}` : 'Create New Product Family'}
                </h2>
                <span className="text-label-sm" style={{ color: 'var(--outline)' }}>
                  {editingTemplate ? `SKU: ${editingTemplate.code}` : 'Enter specifications and publish to storefront'}
                </span>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{
              display: 'flex', borderBottom: '1px solid var(--outline-variant)',
              padding: '0 24px', gap: 24
            }}>
              {(['general', 'variants', 'media'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setEditorTab(tab)}
                  style={{
                    padding: '12px 4px', border: 'none', background: 'transparent',
                    borderBottom: editorTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    color: editorTab === tab ? 'var(--primary)' : 'var(--outline)',
                    fontWeight: 700, fontSize: 13, textTransform: 'capitalize', cursor: 'pointer'
                  }}
                >
                  {tab === 'general' ? 'General Info' : tab === 'variants' ? `Variants & Prices (${editingTemplate?.variants?.length || 0})` : `Photographs (${editingTemplate?.media?.length || 0})`}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div style={{ padding: 24 }}>
              {editorTab === 'general' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Product SKU Code *</label>
                    <input
                      type="text"
                      disabled={!!editingTemplate}
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    />
                  </div>

                  <div>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Product Name (English) *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Hemp Wick"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    />
                  </div>

                  <div>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Product Name (Arabic) *</label>
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="e.g. فتيل القنب الطبيعي"
                      dir="rtl"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Description (English)</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed product specifications..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Description (Arabic)</label>
                    <textarea
                      rows={3}
                      value={formData.descriptionAr}
                      onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
                      placeholder="الوصف باللغة العربية..."
                      dir="rtl"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    />
                  </div>

                  <div>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Country of Origin</label>
                    <input
                      type="text"
                      value={formData.countryOfOrigin}
                      onChange={e => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    />
                  </div>

                  <div>
                    <label className="text-label-sm" style={{ display: 'block', marginBottom: 6 }}>Brand</label>
                    <select
                      value={formData.brandId}
                      onChange={e => setFormData({ ...formData, brandId: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
                    >
                      <option value="">No specific brand (Supplier generic)</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {editorTab === 'variants' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--outline-variant)', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
                          <th style={{ padding: '8px 12px' }}>SKU</th>
                          <th style={{ padding: '8px 12px' }}>Diameter</th>
                          <th style={{ padding: '8px 12px' }}>Length</th>
                          <th style={{ padding: '8px 12px' }}>Color</th>
                          <th style={{ padding: '8px 12px' }}>Retail Price (KWD)</th>
                          <th style={{ padding: '8px 12px' }}>Stock</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editingTemplate?.variants || []).map(v => {
                          const stock = v.stockQuants?.reduce((sum, q) => sum + Number(q.quantityOnHand), 0) || 0;
                          return (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{v.sku}</td>
                              <td style={{ padding: '8px 12px' }}>{v.diameterMm ? `${v.diameterMm} mm` : '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{v.lengthValue ? `${v.lengthValue} ${v.lengthUnit || 'm'}` : '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{v.color || 'Natural'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--primary)' }}>
                                {v.retailPrice != null ? `${Number(v.retailPrice).toFixed(3)} KWD` : 'Unpriced (Draft)'}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ color: stock > 0 ? '#16a34a' : 'var(--outline)', fontWeight: 600 }}>
                                  {stock} units
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    onClick={() => openPriceModal(v)}
                                    style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                                  >
                                    Price
                                  </button>
                                  <button
                                    onClick={() => openStockModal(v)}
                                    style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                                  >
                                    Stock
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Variant Form */}
                  {editingTemplate && (
                    <div style={{
                      background: 'var(--surface-container-low)', padding: 16,
                      borderRadius: 8, border: '1px solid var(--outline-variant)'
                    }}>
                      <span className="text-label-md" style={{ display: 'block', marginBottom: 12 }}>+ Add Sellable Variant</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                        <input
                          placeholder="SKU (e.g. YUE-01-2MM)"
                          value={newVariantSku}
                          onChange={e => setNewVariantSku(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--outline-variant)', fontSize: 12 }}
                        />
                        <input
                          placeholder="Diameter (mm)"
                          type="number"
                          value={newVariantDiameter}
                          onChange={e => setNewVariantDiameter(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--outline-variant)', fontSize: 12 }}
                        />
                        <input
                          placeholder="Length (m)"
                          type="number"
                          value={newVariantLength}
                          onChange={e => setNewVariantLength(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--outline-variant)', fontSize: 12 }}
                        />
                        <input
                          placeholder="Color"
                          value={newVariantColor}
                          onChange={e => setNewVariantColor(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--outline-variant)', fontSize: 12 }}
                        />
                        <input
                          placeholder="Price (KWD)"
                          type="number"
                          step="0.001"
                          value={newVariantPrice}
                          onChange={e => setNewVariantPrice(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--outline-variant)', fontSize: 12 }}
                        />
                        <button
                          onClick={handleAddVariant}
                          style={{
                            padding: '8px 14px', borderRadius: 6, background: 'var(--primary)',
                            color: '#fff', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer'
                          }}
                        >
                          Add Variant
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editorTab === 'media' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="text-label-md">Gallery Photographs ({editingTemplate?.media?.length || 0})</span>
                    {editingTemplate && (
                      <button
                        onClick={() => triggerFileUpload(editingTemplate.id)}
                        style={{
                          padding: '6px 12px', borderRadius: 6, background: 'var(--primary)',
                          color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                        Upload New Photo
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                    {(editingTemplate?.media || []).map((m, idx) => {
                      const mediaIds = editingTemplate?.media?.map(x => x.id) || [];
                      return (
                        <div
                          key={m.id}
                          style={{
                            borderRadius: 10, overflow: 'hidden', border: m.isPrimary ? '2px solid #16a34a' : '1px solid var(--outline-variant)',
                            background: '#ffffff', position: 'relative', display: 'flex', flexDirection: 'column'
                          }}
                        >
                          <div style={{ width: '100%', height: 160, background: '#ffffff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={m.thumbnailUrl || m.cardUrl || m.webpUrl || m.originalUrl}
                              alt={m.altText || ''}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (m.cardUrl && !target.src.endsWith(m.cardUrl)) {
                                  target.src = m.cardUrl;
                                } else if (m.originalUrl && !target.src.endsWith(m.originalUrl)) {
                                  target.src = m.originalUrl;
                                } else if (!target.src.endsWith('/placeholder.svg')) {
                                  target.src = '/placeholder.svg';
                                }
                              }}
                            />
                            {m.isPrimary && (
                              <span style={{
                                position: 'absolute', top: 6, left: 6, background: '#16a34a',
                                color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4
                              }}>
                                PRIMARY (1:1)
                              </span>
                            )}
                            {m.sourcePdfPage && (
                              <span style={{
                                position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)',
                                color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4
                              }}>
                                Pg {m.sourcePdfPage}
                              </span>
                            )}
                          </div>
                          <div style={{ padding: '8px 10px', fontSize: 11, background: 'var(--surface-container-lowest)', borderTop: '1px solid var(--outline-variant)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.altText || m.originalFilename || 'Supplier Photo'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <span style={{ fontSize: 10, color: 'var(--outline)' }}>
                                1200px WebP
                              </span>
                              <a
                                href={m.webpUrl || m.originalUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 10, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                              >
                                View ↗
                              </a>
                            </div>
                          </div>
                          <div style={{ padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                disabled={idx === 0}
                                onClick={() => handleReorderMedia(editingTemplate!.id, mediaIds, idx, idx - 1)}
                                style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer' }}
                              >
                                ◀
                              </button>
                              <button
                                disabled={idx === mediaIds.length - 1}
                                onClick={() => handleReorderMedia(editingTemplate!.id, mediaIds, idx, idx + 1)}
                                style={{ border: 'none', background: 'transparent', cursor: idx === mediaIds.length - 1 ? 'default' : 'pointer' }}
                              >
                                ▶
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {!m.isPrimary && (
                                <button
                                  onClick={() => handleSetPrimaryMedia(editingTemplate!.id, m.id)}
                                  title="Set as Primary Thumbnail"
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#16a34a' }}
                                >
                                  ★
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMedia(editingTemplate!.id, m.id)}
                                title="Delete Photo"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--outline-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface-container-low)'
            }}>
              <button
                onClick={() => setEditorOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer' }}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  disabled={savingTemplate}
                  onClick={() => handleSaveTemplate(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--primary)',
                    background: 'transparent', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Save as Draft / Unpublished
                </button>

                <button
                  disabled={savingTemplate}
                  onClick={() => handleSaveTemplate(true)}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>publish</span>
                  Publish to Storefront
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRICE ADJUSTMENT MODAL ── */}
      {priceModalVariant && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16
        }}>
          <div style={{
            background: 'var(--surface-container-lowest)', borderRadius: 14,
            width: '100%', maxWidth: 400, padding: 24, border: '1px solid var(--outline-variant)'
          }}>
            <h3 className="text-headline-sm" style={{ margin: 0, color: 'var(--primary)', marginBottom: 4 }}>
              Update Variant Retail Price
            </h3>
            <span className="text-label-sm" style={{ color: 'var(--outline)', display: 'block', marginBottom: 16 }}>
              SKU: {priceModalVariant.sku} • Authoritative 3-Decimal KWD
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>Retail Price (KWD) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={newRetailPrice}
                  onChange={e => setNewRetailPrice(e.target.value)}
                  placeholder="0.000"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', fontSize: 14 }}
                />
              </div>



              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>Reason for Price Change (Audit Log)</label>
                <input
                  type="text"
                  value={priceReason}
                  onChange={e => setPriceReason(e.target.value)}
                  placeholder="e.g. Supplier price update, Promo discount"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setPriceModalVariant(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  disabled={savingPrice}
                  onClick={handleSavePrice}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {savingPrice ? 'Saving...' : 'Confirm & Log Price'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STOCK ADJUSTMENT MODAL ── */}
      {stockModalVariant && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16
        }}>
          <div style={{
            background: 'var(--surface-container-lowest)', borderRadius: 14,
            width: '100%', maxWidth: 400, padding: 24, border: '1px solid var(--outline-variant)'
          }}>
            <h3 className="text-headline-sm" style={{ margin: 0, color: 'var(--primary)', marginBottom: 4 }}>
              Audited Stock Adjustment
            </h3>
            <span className="text-label-sm" style={{ color: 'var(--outline)', display: 'block', marginBottom: 16 }}>
              SKU: {stockModalVariant.sku} • Verified Physical On-Hand Stock
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>Verified Stock Quantity (Units) *</label>
                <input
                  type="number"
                  min="0"
                  value={newStockQty}
                  onChange={e => setNewStockQty(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', fontSize: 14 }}
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>Reason for Correction (Required for Auditing) *</label>
                <input
                  type="text"
                  required
                  value={stockReason}
                  onChange={e => setStockReason(e.target.value)}
                  placeholder="e.g. Physical inventory count, Verified opening stock"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline-variant)', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setStockModalVariant(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  disabled={savingStock}
                  onClick={handleSaveStock}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {savingStock ? 'Saving...' : 'Confirm Stock Correction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
