'use client';

import { useState, useEffect, useMemo } from 'react';
import { productCategories as fallbackCategories, type Product, type ProductVariant } from '@/data/products';
import ImageUploadField from '@/components/admin/ImageUploadField';
import PageHeroEditor from '@/components/admin/PageHeroEditor';
import ProductCategoryEditor from '@/components/admin/ProductCategoryEditor';

interface ProductCategory {
  id: string;
  label: string;
  labelEn: string;
}

const PRODUCTS_DEFAULT_HERO = {
  kicker: '제품 소개 · Products',
  titleLine1: '수십 년 숙성의 시간을',
  titleEmphasis: '담은 고귀한 제품',
  lede: '베트남 Ha Tinh 직영 농장에서 25년간 연구한 침향을, 전통 제법과 현대 과학으로 완성한 라인업. 모든 제품은 Lot 번호로 농장·가공·검사 이력을 조회할 수 있습니다.',
};

/** Badge text → CSS class 매핑. 대소문자 무관. */
function getBadgeClass(badge: string): string {
  if (!badge) return 'adm-badge adm-badge-default';
  const b = badge.toLowerCase();
  if (b.includes('signature'))                        return 'adm-badge adm-badge-signature';
  if (b.includes('premium'))                          return 'adm-badge adm-badge-premium';
  if (b.includes('traditional') || b.includes('전통')) return 'adm-badge adm-badge-traditional';
  if (b.includes('luxury'))                           return 'adm-badge adm-badge-luxury';
  if (b.includes('daily'))                            return 'adm-badge adm-badge-daily';
  if (b.includes('wellness'))                         return 'adm-badge adm-badge-wellness';
  if (b.includes('gift') || b.includes('선물'))        return 'adm-badge adm-badge-gift';
  if (b.includes('new') || b.includes('신상'))         return 'adm-badge adm-badge-new';
  if (b.includes('best') || b.includes('베스트'))      return 'adm-badge adm-badge-best';
  if (b.includes('limited') || b.includes('한정'))    return 'adm-badge adm-badge-limited';
  return 'adm-badge adm-badge-default';
}

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>(fallbackCategories);
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
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      setProductList(data.products || data.items || data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setToast('제품 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Fetch categories (live, replaces hardcoded fallback) ─── */
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/product-categories', { cache: 'no-store' });
      const data = await res.json();
      const list: ProductCategory[] = Array.isArray(data?.categories) ? data.categories : [];
      if (list.length > 0) {
        const withoutAll = list.filter((c) => c.id !== 'all');
        const all = list.find((c) => c.id === 'all') ?? { id: 'all', label: '전체', labelEn: 'All' };
        setCategories([all, ...withoutAll]);
      }
    } catch (err) {
      console.error('Failed to fetch product categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
    // 카테고리 기본값을 라이브 categories 첫 항목('all' 제외)로 동적 설정.
    // 하드코딩이 실제 등록된 카테고리와 불일치해 렌더 필터에서 누락되는 사고 방지.
    const firstReal = categories.find((c) => c.id !== 'all');
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
      originalPrice: undefined,
      discountRate: undefined,
      image: '',
      description: '',
      shortDescription: '',
      features: [],
      specs: {},
      inStock: true,
      published: true,
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

  function updateVariant(index: number, field: keyof ProductVariant, value: string | number | boolean | undefined) {
    if (!editingProduct) return;
    const updated = [...(editingProduct.variants ?? [])];
    const nextVariant = { ...updated[index], [field]: value } as ProductVariant;

    // 원가/할인율/할인가 세 필드는 서로 연동된다.
    if (field === 'price' || field === 'originalPrice' || field === 'discountRate') {
      const op = typeof nextVariant.originalPrice === 'number' && nextVariant.originalPrice > 0
        ? nextVariant.originalPrice
        : 0;
      const sp = typeof nextVariant.price === 'number' ? nextVariant.price : 0;
      const dr = typeof nextVariant.discountRate === 'number' ? nextVariant.discountRate : 0;

      if (field === 'discountRate' && op > 0) {
        // 원가 + 할인율 -> 할인가 산출
        nextVariant.price = Math.round(op * (1 - dr / 100));
      } else if (field === 'price' && op > 0 && sp >= 0) {
        // 원가 + 할인가 -> 할인율 산출
        nextVariant.discountRate = op > sp ? Math.round(((op - sp) / op) * 100) : 0;
      } else if (field === 'originalPrice') {
        // 원가 변경 시 — 기존 할인율 우선 적용해 할인가 재산출.
        if (op > 0 && dr > 0) {
          nextVariant.price = Math.round(op * (1 - dr / 100));
        } else if (op > 0 && sp > 0) {
          nextVariant.discountRate = op > sp ? Math.round(((op - sp) / op) * 100) : 0;
        }
      }

      // 할인 무의미 케이스 정리
      if (!nextVariant.originalPrice || nextVariant.originalPrice <= (nextVariant.price ?? 0)) {
        nextVariant.discountRate = nextVariant.originalPrice && nextVariant.originalPrice === nextVariant.price ? 0 : nextVariant.discountRate;
      }

      const finalPrice = nextVariant.price ?? 0;
      if (finalPrice > 0) nextVariant.priceDisplay = `${finalPrice.toLocaleString('ko-KR')}원`;
      else delete nextVariant.priceDisplay;
    }

    updated[index] = nextVariant;
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
      const data = await res.json().catch(() => null);
      const saved: Product | undefined = data?.product;

      // 서버가 saved product 를 돌려주면 그것을 source of truth 로 삼고
      // 추가 GET 은 하지 않는다. 이유: PUT 직후 GET 은 blob CDN edge 의
      // 전파 지연으로 stale 을 돌려받아 방금 저장한 값(inStock=false 등)을
      // 다시 덮어쓰는 사고가 발생함.
      if (saved) {
        setProductList((prev) =>
          isAddMode ? [...prev, saved] : prev.map((p) => (p.id === saved.id ? saved : p))
        );
      } else {
        // 서버가 product 를 안 돌려준 비정상 경로에서만 GET 으로 동기화.
        await fetchProducts();
      }

      setToast(isAddMode ? '제품이 추가되었습니다.' : '제품이 수정되었습니다.');
      setIsEditOpen(false);
      setEditingProduct(null);
      setIsAddMode(false);
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

    // 원가/할인율/할인가 세 필드는 서로 연동.
    if (key === 'price' || key === 'originalPrice' || key === 'discountRate') {
      const draft: Product = { ...editingProduct, [key]: value };
      const op = typeof draft.originalPrice === 'number' && draft.originalPrice > 0 ? draft.originalPrice : 0;
      const sp = typeof draft.price === 'number' ? draft.price : 0;
      const dr = typeof draft.discountRate === 'number' ? draft.discountRate : 0;

      if (key === 'discountRate' && op > 0) {
        draft.price = Math.round(op * (1 - dr / 100));
      } else if (key === 'price' && op > 0 && sp >= 0) {
        draft.discountRate = op > sp ? Math.round(((op - sp) / op) * 100) : 0;
      } else if (key === 'originalPrice') {
        if (op > 0 && dr > 0) {
          draft.price = Math.round(op * (1 - dr / 100));
        } else if (op > 0 && sp > 0) {
          draft.discountRate = op > sp ? Math.round(((op - sp) / op) * 100) : 0;
        }
      }

      const finalPrice = draft.price ?? 0;
      draft.priceDisplay = finalPrice > 0 ? `${finalPrice.toLocaleString('ko-KR')}원` : '가격 문의';
      setEditingProduct(draft);
      return;
    }

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

      {/* HERO EDITOR — 공개 /products 페이지의 히어로 (섹션 태그·제목·부제목·배경 이미지) */}
      <div className="mb-6">
        <PageHeroEditor
          pageKey="products"
          publicPath="/products"
          defaultHero={PRODUCTS_DEFAULT_HERO}
          title="Hero · /products 히어로"
        />
      </div>

      {/* CATEGORY EDITOR — 제품 분류 탭의 라벨·순서·추가/삭제 */}
      <ProductCategoryEditor
        onSaved={(saved) => {
          const withoutAll = saved.filter((c) => c.id !== 'all');
          const all = saved.find((c) => c.id === 'all') ?? { id: 'all', label: '전체', labelEn: 'All' };
          setCategories([all, ...withoutAll]);
          // 기존 필터가 사라진 카테고리를 가리키면 'all' 로 리셋.
          if (categoryFilter !== 'all' && !saved.some((c) => c.id === categoryFilter)) {
            setCategoryFilter('all');
          }
        }}
      />

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
            className="adm-btn-primary px-5"
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
            {categories.map((cat) => (
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
              <tr className="bg-[#FAF8F3] border-b border-[#E5E1D8]">
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">이미지</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">제품명</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">카테고리</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">가격</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">배지</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">재고상태</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">공개</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#1F1F1F]">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
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
                    <td className="px-4 py-3 text-gray-600">
                      {(() => {
                        const cat = categories.find((c) => c.id === product.category);
                        if (cat) return cat.label;
                        return (
                          <span className="inline-flex items-center gap-1 text-amber-700" title="카테고리 사전에 없는 값입니다. '카테고리 관리'에서 추가하거나 제품의 카테고리를 변경하세요.">
                            ⚠ {product.category || '(없음)'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium align-top">
                      {(() => {
                        const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`;
                        const hasVariants = (product.variants?.length ?? 0) > 0;
                        if (!hasVariants) {
                          const op = product.originalPrice ?? 0;
                          const sp = product.price ?? 0;
                          const dr = product.discountRate ?? 0;
                          if (op > 0 && op > sp && sp > 0) {
                            return (
                              <div className="flex flex-col gap-0.5 leading-tight">
                                <span className="text-[11px] text-gray-400 line-through">{fmt(op)}</span>
                                <span className="flex items-center gap-1.5">
                                  {dr > 0 && (
                                    <span className="text-[11px] font-semibold text-rose-600">-{dr}%</span>
                                  )}
                                  <span>{product.priceDisplay}</span>
                                </span>
                              </div>
                            );
                          }
                          return <span>{product.priceDisplay}</span>;
                        }
                        return (
                          <div className="flex flex-col gap-1.5">
                            {product.variants!.map((v) => {
                              const op = v.originalPrice ?? 0;
                              const sp = v.price ?? 0;
                              const dr = v.discountRate ?? 0;
                              return (
                                <div key={v.id} className="flex flex-col leading-tight">
                                  <span className="text-[11px] text-gray-500 truncate" title={v.label}>
                                    {v.label || '(라벨 없음)'}
                                    {!v.inStock && <span className="ml-1 text-rose-500">·품절</span>}
                                  </span>
                                  {op > 0 && op > sp && sp > 0 ? (
                                    <span className="flex items-baseline gap-1.5">
                                      <span className="text-[11px] text-gray-400 line-through">{fmt(op)}</span>
                                      {dr > 0 && (
                                        <span className="text-[11px] font-semibold text-rose-600">-{dr}%</span>
                                      )}
                                      <span className="text-sm">{sp > 0 ? fmt(sp) : '—'}</span>
                                    </span>
                                  ) : (
                                    <span className="text-sm">{sp > 0 ? fmt(sp) : '—'}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getBadgeClass(product.badge)}>
                        {product.badge || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.inStock ? (
                        <span className="adm-status-instock">
                          <span className="adm-status-dot-green" />
                          재고 있음
                        </span>
                      ) : (
                        <span className="adm-status-outstock">
                          <span className="adm-status-dot-red" />
                          품절
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.published !== false ? (
                        <span className="adm-status-public">
                          <span className="adm-status-dot-green" />
                          공개
                        </span>
                      ) : (
                        <span className="adm-status-private">
                          <span className="adm-status-dot-gray" />
                          비공개
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="adm-btn-secondary"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="adm-btn-destructive"
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
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
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
                  {/* 현재 값이 카테고리 사전에 없으면 옵션을 임시 추가 — 저장 시 손실 방지 */}
                  {editingProduct.category &&
                    !categories.some((c) => c.id === editingProduct.category) && (
                      <option value={editingProduct.category}>
                        ⚠ {editingProduct.category} (사전에 없음 — 카테고리 관리에서 추가 필요)
                      </option>
                    )}
                  {categories
                    .filter((c) => c.id !== 'all')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  옵션 목록은 상단 <strong>카테고리 관리</strong> 패널에서 추가/편집할 수 있습니다.
                </p>
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

              {/* Price — 원가 / 할인율 / 할인가 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">가격 (원)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">원가 (정가)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={editingProduct.originalPrice ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        updateEditField('originalPrice', raw === '' ? undefined : Number(raw));
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">할인율 (%)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      value={editingProduct.discountRate ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        updateEditField('discountRate', raw === '' ? undefined : Number(raw));
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">할인가 (판매가)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={editingProduct.price === 0 ? '' : editingProduct.price}
                      onChange={(e) => {
                        const raw = e.target.value;
                        updateEditField('price', raw === '' ? 0 : Number(raw));
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                    />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  원가 + 할인율 = 할인가 자동 계산. 할인가 직접 입력 시 할인율 재계산. 원가가 비어 있으면 할인 표기 없이 판매가만 노출됩니다.
                </p>
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

              {/* Published Toggle — undefined/true 는 공개, false 면 관리자에게만 보임 */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">공개 여부</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    OFF 면 공개 /products 에서 숨김 (관리자 로그인 상태에서만 /products/[slug] 접근 가능)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateEditField('published', editingProduct.published === false ? true : false)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editingProduct.published !== false ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      editingProduct.published !== false ? 'translate-x-6' : 'translate-x-1'
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
                  <div className="space-y-3">
                    {(editingProduct.variants ?? []).map((variant, i) => (
                      <div
                        key={variant.id}
                        className="rounded-lg border border-gray-200 bg-gray-50/40 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={variant.label}
                            onChange={(e) => updateVariant(i, 'label', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                            placeholder="예: 500mg 30캡슐"
                          />
                          <button
                            type="button"
                            onClick={() => updateVariant(i, 'inStock', !variant.inStock)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                              variant.inStock ? 'bg-gold-500' : 'bg-gray-300'
                            }`}
                            title={variant.inStock ? '재고 있음' : '품절'}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                                variant.inStock ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => removeVariant(i)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="옵션 삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">원가 (원)</label>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={variant.originalPrice ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                updateVariant(i, 'originalPrice', raw === '' ? undefined : Number(raw));
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">할인율 (%)</label>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={100}
                              value={variant.discountRate ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                updateVariant(i, 'discountRate', raw === '' ? undefined : Number(raw));
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">할인가 (원)</label>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={variant.price === 0 ? '' : variant.price}
                              onChange={(e) => {
                                const raw = e.target.value;
                                updateVariant(i, 'price', raw === '' ? 0 : Number(raw));
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                            />
                          </div>
                        </div>
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
                className="flex-1 adm-btn-primary"
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
              <div className="w-12 h-12 rounded-full bg-[#FBEDE9] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#B4452F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="flex-1 adm-btn-destructive-solid"
                >
                  삭제 확인
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 adm-btn-secondary"
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
