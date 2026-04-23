'use client';

import { useState, useEffect, useMemo } from 'react';
import { productCategories, type Product, type ProductVariant } from '@/data/products';
import ImageUploadField from '@/components/admin/ImageUploadField';

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // CSV import
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const SAMPLE_CSV = `id,name,nameEn,slug,category,categoryEn,price,priceDisplay,badge,image,shortDescription,description,inStock
,침향 오일 10ml,Agarwood Oil 10ml,,오일,Oil,120000,120000원,NEW,https://example.com/oil.jpg,프리미엄 침향 오일,순수 추출 침향 오일 10ml 제품,true
,침향 환 60g,Agarwood Pill 60g,,환,Pill,85000,85000원,,https://example.com/pill.jpg,전통 침향환,전통 제법으로 만든 침향환 60g,true`;

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', importFile);
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.message ?? 'CSV 가져오기에 실패했습니다.');
        return;
      }
      setImportResult({
        created: data.created,
        updated: data.updated,
        skipped: data.skipped,
        errors: data.errors ?? [],
      });
      await fetchProducts();
    } catch (err) {
      console.error('[Admin Products Import] error:', err);
      setToast('네트워크 오류가 발생했습니다.');
    } finally {
      setImporting(false);
    }
  }

  function closeImport() {
    setImportOpen(false);
    setImportFile(null);
    setImportResult(null);
  }

  function downloadSample() {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Toast auto-hide ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Fetch products ─── */
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProductList(data.products || data.items || data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setToast('제품 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (stockFilter === 'inStock' && !p.inStock) return false;
      if (stockFilter === 'outOfStock' && p.inStock) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.nameEn.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [productList, categoryFilter, searchQuery, stockFilter]);

  function openEdit(product: Product) {
    setEditingProduct(JSON.parse(JSON.stringify(product)));
    setIsEditOpen(true);
    setIsAddMode(false);
  }

  function openAdd() {
    // 카테고리 기본값을 productCategories 첫 항목('all' 제외)로 동적 설정.
    // 하드코딩('원목')이 실제 등록된 카테고리와 불일치해 렌더 필터에서 누락되는 사고 방지.
    const firstReal = productCategories.find((c) => c.id !== 'all');
    setEditingProduct({
      id: '',
      slug: '',
      name: '',
      nameEn: '',
      category: firstReal?.id ?? '',
      categoryEn: firstReal?.labelEn ?? '',
      badge: '',
      price: 0,
      priceDisplay: '',
      image: '',
      description: '',
      shortDescription: '',
      features: [],
      specs: {},
      inStock: true,
      variants: [],
    });
    setIsEditOpen(true);
    setIsAddMode(true);
  }

  /* ─── Variant helpers ─── */
  function addVariant() {
    if (!editingProduct) return;
    const newVariant: ProductVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: '',
      price: 0,
      inStock: true,
    };
    setEditingProduct({
      ...editingProduct,
      variants: [...(editingProduct.variants ?? []), newVariant],
    });
  }

  function updateVariant(index: number, field: keyof ProductVariant, value: string | number | boolean) {
    if (!editingProduct) return;
    const updated = [...(editingProduct.variants ?? [])];
    updated[index] = { ...updated[index], [field]: value } as ProductVariant;
    setEditingProduct({ ...editingProduct, variants: updated });
  }

  function removeVariant(index: number) {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      variants: (editingProduct.variants ?? []).filter((_, i) => i !== index),
    });
  }

  async function handleSave() {
    if (!editingProduct) return;
    setSaving(true);
    try {
      const method = isAddMode ? 'POST' : 'PUT';
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });
      if (!res.ok) throw new Error('Save failed');
      setToast(isAddMode ? '제품이 추가되었습니다.' : '제품이 수정되었습니다.');
      setIsEditOpen(false);
      setEditingProduct(null);
      setIsAddMode(false);
      await fetchProducts();
    } catch (err) {
      console.error('Save error:', err);
      setToast('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setToast('제품이 삭제되었습니다.');
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      setToast('삭제에 실패했습니다.');
    }
  }

  function updateEditField<K extends keyof Product>(key: K, value: Product[K]) {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, [key]: value });
  }

  function addFeature() {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      features: [...editingProduct.features, ''],
    });
  }

  function updateFeature(index: number, value: string) {
    if (!editingProduct) return;
    const updated = [...editingProduct.features];
    updated[index] = value;
    setEditingProduct({ ...editingProduct, features: updated });
  }

  function removeFeature(index: number) {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      features: editingProduct.features.filter((_, i) => i !== index),
    });
  }

  function addSpec() {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      specs: { ...editingProduct.specs, '': '' },
    });
  }

  function updateSpecKey(oldKey: string, newKey: string) {
    if (!editingProduct) return;
    const entries = Object.entries(editingProduct.specs);
    const updated = Object.fromEntries(
      entries.map(([k, v]) => (k === oldKey ? [newKey, v] : [k, v]))
    );
    setEditingProduct({ ...editingProduct, specs: updated });
  }

  function updateSpecValue(key: string, value: string) {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      specs: { ...editingProduct.specs, [key]: value },
    });
  }

  function removeSpec(key: string) {
    if (!editingProduct) return;
    const { [key]: _, ...rest } = editingProduct.specs;
    void _;
    setEditingProduct({ ...editingProduct, specs: rest });
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-body">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="h-8 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="h-10 w-36 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 animate-pulse">
          <div className="h-10 w-full rounded bg-gray-200" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-body">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-5 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v12m0 0l-4-4m4 4l4-4M14 4h6a2 2 0 012 2v14a2 2 0 01-2 2H14" />
            </svg>
            CSV 가져오기
          </button>
          <a
            href="/api/admin/export/products"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV 내보내기
          </a>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 text-white rounded-lg font-medium hover:bg-gold-600 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 제품 추가
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
          >
            {productCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="제품명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'inStock' | 'outOfStock')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
          >
            <option value="all">전체 재고</option>
            <option value="inStock">재고 있음</option>
            <option value="outOfStock">품절</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">이미지</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">제품명</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">카테고리</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">가격</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">배지</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">재고상태</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p>조건에 맞는 제품이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-50 hover:bg-gold-50/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.nameEn}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{product.priceDisplay}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-gold-700 text-white">
                        {product.badge}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.inStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          재고 있음
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          품절
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-700 shadow-sm transition-colors"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            총 {filteredProducts.length}개 제품
          </div>
        )}
      </div>

      {/* Edit Slide-over Panel */}
      {isEditOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsEditOpen(false)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {isAddMode ? '새 제품 추가' : '제품 편집'}
              </h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제품명 (한글)</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => updateEditField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                />
              </div>

              {/* Name En */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제품명 (영문)</label>
                <input
                  type="text"
                  value={editingProduct.nameEn}
                  onChange={(e) => updateEditField('nameEn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => updateEditField('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                >
                  {productCategories
                    .filter((c) => c.id !== 'all')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배지</label>
                <input
                  type="text"
                  value={editingProduct.badge}
                  onChange={(e) => updateEditField('badge', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => updateEditField('price', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                />
              </div>

              {/* Image */}
              <ImageUploadField
                label="대표 이미지"
                value={editingProduct.image}
                onChange={(url) => updateEditField('image', url)}
                subdir="products"
              />

              {/* Image Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">이미지 갤러리 (추가 이미지)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingProduct.gallery ?? [];
                      updateEditField('gallery', [...current, '']);
                    }}
                    className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                  >
                    + 이미지 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {(editingProduct.gallery ?? []).map((url, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1">
                        <ImageUploadField
                          value={url}
                          onChange={(newUrl) => {
                            const updated = [...(editingProduct.gallery ?? [])];
                            updated[idx] = newUrl;
                            updateEditField('gallery', updated);
                          }}
                          subdir="products"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingProduct.gallery ?? []).filter((_, i) => i !== idx);
                          updateEditField('gallery', updated);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 mt-2 flex-shrink-0"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  {(editingProduct.gallery ?? []).length === 0 && (
                    <p className="text-xs text-gray-400">추가 이미지가 없습니다. 상세 페이지에서 썸네일로 함께 표시됩니다.</p>
                  )}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">짧은 설명</label>
                <input
                  type="text"
                  value={editingProduct.shortDescription}
                  onChange={(e) => updateEditField('shortDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                <textarea
                  rows={4}
                  value={editingProduct.description}
                  onChange={(e) => updateEditField('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                />
              </div>

              {/* In Stock Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">재고 여부</label>
                <button
                  type="button"
                  onClick={() => updateEditField('inStock', !editingProduct.inStock)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editingProduct.inStock ? 'bg-gold-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      editingProduct.inStock ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">특징</label>
                  <button
                    onClick={addFeature}
                    className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                  >
                    + 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {editingProduct.features.map((feat, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                        placeholder={`특징 ${i + 1}`}
                      />
                      <button
                        onClick={() => removeFeature(i)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">상세 스펙</label>
                  <button
                    onClick={addSpec}
                    className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                  >
                    + 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(editingProduct.specs).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => updateSpecKey(key, e.target.value)}
                        className="w-1/3 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                        placeholder="항목명"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateSpecValue(key, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                        placeholder="값"
                      />
                      <button
                        onClick={() => removeSpec(key)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">용량/옵션</label>
                  <button
                    onClick={addVariant}
                    className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                  >
                    + 옵션 추가
                  </button>
                </div>
                {(editingProduct.variants ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                    단일 가격 제품으로 관리됩니다. 옵션을 추가하면 다중 용량 관리가 가능합니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_90px_60px_32px] gap-1.5 px-1 mb-1">
                      <span className="text-xs text-gray-400">라벨</span>
                      <span className="text-xs text-gray-400">가격(원)</span>
                      <span className="text-xs text-gray-400 text-center">재고</span>
                      <span />
                    </div>
                    {(editingProduct.variants ?? []).map((variant, i) => (
                      <div key={variant.id} className="grid grid-cols-[1fr_90px_60px_32px] gap-1.5 items-center">
                        <input
                          type="text"
                          value={variant.label}
                          onChange={(e) => updateVariant(i, 'label', e.target.value)}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                          placeholder="예: 500mg 30캡슐"
                        />
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(i, 'price', Number(e.target.value))}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                          min={0}
                        />
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => updateVariant(i, 'inStock', !variant.inStock)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              variant.inStock ? 'bg-gold-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                                variant.inStock ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                        <button
                          onClick={() => removeVariant(i)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-gold-500 text-white rounded-lg font-medium hover:bg-gold-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? '저장 중...' : isAddMode ? '추가' : '저장'}
              </button>
              <button
                onClick={() => setIsEditOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">제품 삭제</h3>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium text-gray-700">{deleteTarget.name}</span>을(를) 정말 삭제하시겠습니까?
                <br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  삭제
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline style for slide animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

      {/* CSV Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">CSV 일괄 가져오기</h2>
              <button type="button" onClick={closeImport} className="text-2xl leading-none text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-lg border border-gold-200 bg-gold-50/50 p-4 text-xs text-neutral-700">
                <p className="mb-2 font-semibold text-neutral-900">CSV 형식</p>
                <p className="mb-2 leading-6">
                  첫 행은 헤더 (<code className="rounded bg-white px-1">name</code>,{' '}
                  <code className="rounded bg-white px-1">category</code>,{' '}
                  <code className="rounded bg-white px-1">price</code> 필수).{' '}
                  <code className="rounded bg-white px-1">id</code> 또는{' '}
                  <code className="rounded bg-white px-1">slug</code>이 기존 제품과 일치하면 업데이트, 아니면 신규 생성.
                </p>
                <button type="button" onClick={downloadSample} className="font-medium text-gold-700 hover:underline">
                  샘플 CSV 다운로드
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">파일 선택</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportResult(null);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-gold-500 file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-widest file:text-white hover:file:bg-gold-600"
                />
              </div>

              {importResult && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <p className="font-medium text-gray-900">결과</p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-700">
                    <li>신규 등록: <span className="font-semibold text-emerald-700">{importResult.created}</span>건</li>
                    <li>수정: <span className="font-semibold text-blue-700">{importResult.updated}</span>건</li>
                    <li>건너뜀: <span className="font-semibold text-amber-700">{importResult.skipped}</span>건</li>
                  </ul>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <p className="mb-1.5 text-xs font-semibold text-red-600">오류 {importResult.errors.length}건</p>
                      <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-red-700">
                        {importResult.errors.map((e, i) => (
                          <li key={i}>· {e.row}행: {e.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={closeImport}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {importResult ? '닫기' : '취소'}
              </button>
              {!importResult && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? '가져오는 중...' : '가져오기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
