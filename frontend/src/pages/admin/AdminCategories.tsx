import React, { useState, useEffect } from 'react';
import { useStore } from '../../StoreContext';
import { api } from '../../services/api';

interface CategoryItem {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  children?: CategoryItem[];
  _count?: { templates: number };
}

interface BrandItem {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  _count?: { templates: number };
}

export default function AdminCategories() {
  const { showToast } = useStore();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [catForm, setCatForm] = useState({ code: '', name: '', nameAr: '', parentId: '' });
  const [savingCat, setSavingCat] = useState(false);

  // Brand Modal
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [brandForm, setBrandForm] = useState({ code: '', name: '', nameAr: '', description: '' });
  const [savingBrand, setSavingBrand] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, brs] = await Promise.all([
        api.getCategories(),
        api.getBrands(),
      ]);
      setCategories(cats);
      setBrands(brs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load categories/brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Category Handlers ──
  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm({ code: `CAT-${Date.now().toString().slice(-4)}`, name: '', nameAr: '', parentId: '' });
    setCatModalOpen(true);
  };

  const openEditCat = (cat: CategoryItem) => {
    setEditingCat(cat);
    setCatForm({ code: cat.code, name: cat.name, nameAr: cat.nameAr || '', parentId: cat.parentId || '' });
    setCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.code) {
      showToast('Name and unique code are required', 'warning');
      return;
    }
    setSavingCat(true);
    try {
      if (editingCat) {
        await api.updateCategory(editingCat.id, {
          name: catForm.name,
          nameAr: catForm.nameAr || undefined,
          code: catForm.code,
          parentId: catForm.parentId || undefined,
        });
        showToast('Category updated successfully', 'check_circle');
      } else {
        await api.createCategory({
          name: catForm.name,
          nameAr: catForm.nameAr || undefined,
          code: catForm.code,
          parentId: catForm.parentId || undefined,
        });
        showToast('Category created successfully', 'check_circle');
      }
      setCatModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCat = async (cat: CategoryItem) => {
    if (cat._count && cat._count.templates > 0) {
      alert(`Cannot delete category "${cat.name}": ${cat._count.templates} products are assigned to it. Please reassign products first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await api.deleteCategory(cat.id);
      showToast('Category deleted', 'check_circle');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  // ── Brand Handlers ──
  const openCreateBrand = () => {
    setEditingBrand(null);
    setBrandForm({ code: `BR-${Date.now().toString().slice(-4)}`, name: '', nameAr: '', description: '' });
    setBrandModalOpen(true);
  };

  const openEditBrand = (brand: BrandItem) => {
    setEditingBrand(brand);
    setBrandForm({
      code: brand.code,
      name: brand.name,
      nameAr: brand.nameAr || '',
      description: brand.description || '',
    });
    setBrandModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name || !brandForm.code) {
      showToast('Name and unique code are required', 'warning');
      return;
    }
    setSavingBrand(true);
    try {
      if (editingBrand) {
        await api.updateBrand(editingBrand.id, {
          name: brandForm.name,
          nameAr: brandForm.nameAr || undefined,
          code: brandForm.code,
          description: brandForm.description || undefined,
        });
        showToast('Brand updated successfully', 'check_circle');
      } else {
        await api.createBrand({
          name: brandForm.name,
          nameAr: brandForm.nameAr || undefined,
          code: brandForm.code,
          description: brandForm.description || undefined,
        });
        showToast('Brand created successfully', 'check_circle');
      }
      setBrandModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save brand', 'error');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (brand: BrandItem) => {
    if (brand._count && brand._count.templates > 0) {
      alert(`Cannot delete brand "${brand.name}": ${brand._count.templates} products are assigned to it.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete brand "${brand.name}"?`)) return;

    try {
      await api.deleteBrand(brand.id);
      showToast('Brand deleted', 'check_circle');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete brand', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 8px 32px 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--primary)' }}>category</span>
            <h1 className="text-headline-md" style={{ color: 'var(--primary)', margin: 0, fontWeight: 700 }}>
              Catalog Structure & Taxonomy
            </h1>
          </div>
          <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4, display: 'block' }}>
            Manage authoritative product categories, hierarchy, and brand manufacturers for Kuwait storefront.
          </span>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchData}
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
          {activeTab === 'categories' ? (
            <button
              onClick={openCreateCat}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Add Category
            </button>
          ) : (
            <button
              onClick={openCreateBrand}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Add Brand
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, borderBottom: '1px solid var(--outline-variant)', paddingBottom: 2
      }}>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '10px 20px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeTab === 'categories' ? 'var(--surface-container-high)' : 'transparent',
            color: activeTab === 'categories' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: activeTab === 'categories' ? 700 : 500, fontSize: 14, cursor: 'pointer',
            borderBottom: activeTab === 'categories' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>folder</span>
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          style={{
            padding: '10px 20px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeTab === 'brands' ? 'var(--surface-container-high)' : 'transparent',
            color: activeTab === 'brands' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: activeTab === 'brands' ? 700 : 500, fontSize: 14, cursor: 'pointer',
            borderBottom: activeTab === 'brands' ? '3px solid var(--primary)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>branding_watermark</span>
          Brands & Manufacturers ({brands.length})
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'categories' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', background: 'var(--surface-container-low)', borderRadius: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>category</span>
              <p style={{ marginTop: 12, color: 'var(--on-surface-variant)' }}>No categories configured yet.</p>
            </div>
          ) : (
            categories.map(cat => (
              <div
                key={cat.id}
                className="card"
                style={{
                  padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderRadius: 12, border: '1px solid var(--outline-variant)', background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(4, 98, 90, 0.08)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--primary)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>folder_open</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>{cat.name}</span>
                      {cat.nameAr && (
                        <span style={{ fontSize: 13, color: 'var(--outline)', direction: 'rtl' }}>
                          ({cat.nameAr})
                        </span>
                      )}
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)',
                        fontWeight: 600, fontFamily: 'monospace'
                      }}>
                        {cat.code}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                        {cat._count?.templates || 0} Products Assigned
                      </span>
                      {cat.children && cat.children.length > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--outline)' }}>
                          • {cat.children.length} Sub-categories
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => openEditCat(cat)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, border: '1px solid var(--outline-variant)',
                      background: 'var(--surface-container-high)', color: 'var(--on-surface)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCat(cat)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, border: '1px solid var(--outline-variant)',
                      background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {brands.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', background: 'var(--surface-container-low)', borderRadius: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>branding_watermark</span>
              <p style={{ marginTop: 12, color: 'var(--on-surface-variant)' }}>No brands configured yet.</p>
            </div>
          ) : (
            brands.map(brand => (
              <div
                key={brand.id}
                className="card"
                style={{
                  padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderRadius: 12, border: '1px solid var(--outline-variant)', background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(234, 88, 12, 0.08)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#ea580c'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>verified</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>{brand.name}</span>
                      {brand.nameAr && (
                        <span style={{ fontSize: 13, color: 'var(--outline)', direction: 'rtl' }}>
                          ({brand.nameAr})
                        </span>
                      )}
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)',
                        fontWeight: 600, fontFamily: 'monospace'
                      }}>
                        {brand.code}
                      </span>
                    </div>
                    {brand.description && (
                      <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, display: 'block' }}>
                        {brand.description}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 4, display: 'block' }}>
                      {brand._count?.templates || 0} Products Catalogued
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => openEditBrand(brand)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, border: '1px solid var(--outline-variant)',
                      background: 'var(--surface-container-high)', color: 'var(--on-surface)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(brand)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, border: '1px solid var(--outline-variant)',
                      background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {catModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480,
            padding: 24, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                {editingCat ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setCatModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCat} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Steel Wire Ropes"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Category Name (Arabic)
                </label>
                <input
                  type="text"
                  value={catForm.nameAr}
                  onChange={e => setCatForm({ ...catForm, nameAr: e.target.value })}
                  placeholder="e.g. حبال أسلاك الفولاذ"
                  dir="rtl"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Unique Code *
                </label>
                <input
                  type="text"
                  value={catForm.code}
                  onChange={e => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CAT-WIRE-ROPE"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14, fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Parent Category (Optional)
                </label>
                <select
                  value={catForm.parentId}
                  onChange={e => setCatForm({ ...catForm, parentId: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14, background: '#fff'
                  }}
                >
                  <option value="">-- None (Top Level Category) --</option>
                  {categories.filter(c => c.id !== editingCat?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--outline-variant)',
                    background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}
                >
                  {savingCat ? 'Saving...' : (editingCat ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Create/Edit Modal */}
      {brandModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480,
            padding: 24, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                {editingBrand ? 'Edit Brand' : 'Create New Brand'}
              </h3>
              <button
                onClick={() => setBrandModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBrand} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Brand Name (English) *
                </label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={e => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="e.g. STAR ROPE"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Brand Name (Arabic)
                </label>
                <input
                  type="text"
                  value={brandForm.nameAr}
                  onChange={e => setBrandForm({ ...brandForm, nameAr: e.target.value })}
                  placeholder="e.g. ستار روب"
                  dir="rtl"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Unique Brand Code *
                </label>
                <input
                  type="text"
                  value={brandForm.code}
                  onChange={e => setBrandForm({ ...brandForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. STAR-ROPE"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14, fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--on-surface)' }}>
                  Description / Origin
                </label>
                <textarea
                  value={brandForm.description}
                  onChange={e => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="e.g. Premium rigging and lifting equipment manufactured under certified standards"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--outline-variant)', fontSize: 14
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--outline-variant)',
                    background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBrand}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}
                >
                  {savingBrand ? 'Saving...' : (editingBrand ? 'Update Brand' : 'Create Brand')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
