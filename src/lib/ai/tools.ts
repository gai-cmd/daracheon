import { revalidatePath } from 'next/cache';
import { readData, writeData, readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import type { Product, ProductVariant } from '@/data/products';
import type { Review } from '@/data/reviews';

export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface ToolResult {
  ok: boolean;
  summary: string;
  data?: unknown;
  error?: string;
}

/* ─────────────────────────────────────────────────────────
   Tool schemas (given to Claude)
   ───────────────────────────────────────────────────────── */

export const TOOLS: ToolDef[] = [
  {
    name: 'list_pages',
    description:
      '수정 가능한 페이지 콘텐츠 키를 반환합니다. 현재 aboutAgarwood(침향 이야기), brandStory(브랜드 스토리)를 지원합니다.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_page',
    description: '지정한 페이지 콘텐츠(JSON)를 현재 상태로 반환합니다.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', enum: ['aboutAgarwood', 'brandStory'] },
      },
      required: ['key'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_page',
    description:
      '지정한 페이지 콘텐츠를 덮어씁니다. 반드시 get_page로 현재 구조를 먼저 읽고, 변경된 필드만 교체한 전체 객체를 전달하세요. 저장 후 해당 페이지가 프론트에서 즉시 갱신됩니다.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', enum: ['aboutAgarwood', 'brandStory'] },
        data: { type: 'object', description: '페이지의 최종 상태(전체 JSON).' },
      },
      required: ['key', 'data'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_products',
    description: '제품 목록(요약)을 반환합니다. 상세가 필요하면 get_product를 사용하세요.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: '이름/카테고리 부분 일치(선택).' },
        limit: { type: 'number', description: '최대 반환 개수(선택, 기본 50).' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_product',
    description: '단일 제품의 전체 필드를 반환합니다.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_product',
    description:
      '제품의 일부 필드만 병합 업데이트합니다. 전달한 필드만 덮어쓰며, 생략한 필드는 유지됩니다.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        fields: {
          type: 'object',
          description:
            '변경할 필드만 포함: name, nameEn, category, categoryEn, badge, price, priceDisplay, image, description, shortDescription, features(string[]), specs(object), inStock(boolean), variants(array).',
        },
      },
      required: ['id', 'fields'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_product',
    description: '새 제품을 생성합니다. 필수: name, category, price(가변가 없을 때).',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        price: { type: 'number' },
        priceDisplay: { type: 'string' },
        nameEn: { type: 'string' },
        categoryEn: { type: 'string' },
        badge: { type: 'string' },
        image: { type: 'string' },
        description: { type: 'string' },
        shortDescription: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        specs: { type: 'object' },
        inStock: { type: 'boolean' },
        variants: { type: 'array' },
      },
      required: ['name', 'category'],
      additionalProperties: true,
    },
  },
  {
    name: 'delete_product',
    description: '제품을 삭제합니다. 실행 전 반드시 사용자에게 의도를 확인하세요.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_faqs',
    description: 'FAQ 목록을 반환합니다.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['제품', '배송/결제', '성분', '기타'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'create_faq',
    description: 'FAQ 항목을 추가합니다.',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        answer: { type: 'string' },
        category: { type: 'string', enum: ['제품', '배송/결제', '성분', '기타'] },
      },
      required: ['question', 'answer'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_faq',
    description: 'FAQ 항목을 수정합니다.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
        category: { type: 'string', enum: ['제품', '배송/결제', '성분', '기타'] },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_faq',
    description: 'FAQ 항목을 삭제합니다.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_announcement',
    description: '상단 공지 배너 상태(enabled/text/link/variant)를 반환합니다.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'update_announcement',
    description:
      '상단 공지 배너를 업데이트합니다. enabled=true 이면 사이트 전체에 즉시 노출됩니다.',
    input_schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        text: { type: 'string' },
        link: { type: 'string' },
        linkLabel: { type: 'string' },
        variant: { type: 'string', enum: ['gold', 'dark', 'red'] },
      },
      required: ['enabled', 'text', 'link', 'linkLabel', 'variant'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_reviews',
    description: '리뷰 목록을 반환합니다.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        verifiedOnly: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'update_review_verified',
    description: '리뷰 공개 여부(verified)를 변경합니다.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        verified: { type: 'boolean' },
      },
      required: ['id', 'verified'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_review',
    description: '리뷰를 삭제합니다.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
];

/* ─────────────────────────────────────────────────────────
   Revalidation helpers — prop frontend with fresh data
   ───────────────────────────────────────────────────────── */

function revalidateAll(paths: string[]) {
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch (err) {
      console.warn('[ai-tools] revalidatePath failed', p, err);
    }
  }
  try {
    revalidatePath('/', 'layout');
  } catch {
    /* ignore */
  }
}

const PAGE_PATHS: Record<string, string[]> = {
  aboutAgarwood: ['/about-agarwood'],
  brandStory: ['/brand-story'],
};

/* ─────────────────────────────────────────────────────────
   Tool executor
   ───────────────────────────────────────────────────────── */

function normalizeVariants(raw: unknown): ProductVariant[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  if (raw.length === 0) return [];
  return raw.map((v: unknown) => {
    const item = (v ?? {}) as Record<string, unknown>;
    const id =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const price = typeof item.price === 'number' ? item.price : 0;
    const inStock = item.inStock !== false;
    const out: ProductVariant = { id, label, price, inStock };
    if (typeof item.priceDisplay === 'string' && item.priceDisplay.trim()) {
      out.priceDisplay = item.priceDisplay.trim();
    }
    if (typeof item.sku === 'string' && item.sku.trim()) {
      out.sku = item.sku.trim();
    }
    return out;
  });
}

function productSummary(p: Product) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    priceDisplay: p.priceDisplay,
    inStock: p.inStock,
    hasVariants: Array.isArray(p.variants) && p.variants.length > 0,
  };
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (name) {
      /* ── Pages ───────────────────────────── */
      case 'list_pages': {
        return {
          ok: true,
          summary: '수정 가능한 페이지: aboutAgarwood, brandStory',
          data: { keys: ['aboutAgarwood', 'brandStory'] },
        };
      }

      case 'get_page': {
        const key = String(input.key ?? '');
        if (!PAGE_PATHS[key]) return { ok: false, summary: '잘못된 페이지 키', error: `invalid key: ${key}` };
        const pages = (await readSingle('pages')) as Record<string, unknown> | null;
        const data = pages?.[key] ?? null;
        return {
          ok: true,
          summary: `페이지 조회: ${key}`,
          data,
        };
      }

      case 'update_page': {
        const key = String(input.key ?? '');
        const data = input.data;
        if (!PAGE_PATHS[key]) return { ok: false, summary: '잘못된 페이지 키', error: `invalid key: ${key}` };
        if (!data || typeof data !== 'object') {
          return { ok: false, summary: 'data가 객체가 아닙니다', error: 'data must be object' };
        }
        const existing = ((await readSingle('pages')) as Record<string, unknown>) ?? {};
        const updated = { ...existing, [key]: data };
        await writeSingle('pages', updated);
        await logAdmin('settings', 'update', {
          summary: `AI: 페이지 수정 — ${key}`,
          targetId: key,
        });
        revalidateAll(PAGE_PATHS[key]);
        return {
          ok: true,
          summary: `페이지 '${key}' 저장 완료. 프론트 반영됨.`,
        };
      }

      /* ── Products ────────────────────────── */
      case 'list_products': {
        const search = typeof input.search === 'string' ? input.search.trim().toLowerCase() : '';
        const limit = typeof input.limit === 'number' ? Math.max(1, Math.min(200, input.limit)) : 50;
        const products = await readData<Product>('products');
        const filtered = search
          ? products.filter(
              (p) =>
                p.name?.toLowerCase().includes(search) ||
                p.category?.toLowerCase().includes(search) ||
                p.id?.toLowerCase().includes(search)
            )
          : products;
        return {
          ok: true,
          summary: `제품 ${filtered.length}개 (전체 ${products.length})`,
          data: filtered.slice(0, limit).map(productSummary),
        };
      }

      case 'get_product': {
        const id = String(input.id ?? '');
        const products = await readData<Product>('products');
        const p = products.find((x) => x.id === id);
        if (!p) return { ok: false, summary: '제품을 찾지 못함', error: `not found: ${id}` };
        return { ok: true, summary: `제품 조회: ${p.name}`, data: p };
      }

      case 'update_product': {
        const id = String(input.id ?? '');
        const fields = (input.fields ?? {}) as Record<string, unknown>;
        const products = await readData<Product>('products');
        const idx = products.findIndex((p) => p.id === id);
        if (idx === -1) return { ok: false, summary: '제품 없음', error: `not found: ${id}` };

        const variantsNorm =
          fields.variants !== undefined ? normalizeVariants(fields.variants) : undefined;
        const merged: Product = {
          ...products[idx],
          ...(fields as Partial<Product>),
          ...(variantsNorm !== undefined ? { variants: variantsNorm } : {}),
        };
        products[idx] = merged;
        await writeData('products', products);
        await logAdmin('products', 'update', {
          summary: `AI: 제품 수정 — ${merged.name}`,
          targetId: id,
        });
        revalidateAll(['/products', `/products/${merged.slug ?? id}`, '/']);
        return { ok: true, summary: `제품 '${merged.name}' 저장 완료.` };
      }

      case 'create_product': {
        const f = input as Record<string, unknown>;
        if (typeof f.name !== 'string' || !f.name.trim()) {
          return { ok: false, summary: 'name 필수', error: 'name required' };
        }
        if (typeof f.category !== 'string' || !f.category.trim()) {
          return { ok: false, summary: 'category 필수', error: 'category required' };
        }
        const products = await readData<Product>('products');
        const name = (f.name as string).trim();
        const slug =
          typeof f.slug === 'string' && f.slug.trim()
            ? f.slug.trim()
            : name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-');
        const price = typeof f.price === 'number' ? f.price : 0;
        const variantsNorm = normalizeVariants(f.variants);
        const newProduct: Product = {
          id: `product-${Date.now()}`,
          slug,
          name,
          nameEn: typeof f.nameEn === 'string' ? f.nameEn.trim() : '',
          category: (f.category as string).trim(),
          categoryEn: typeof f.categoryEn === 'string' ? f.categoryEn.trim() : '',
          badge: typeof f.badge === 'string' ? f.badge.trim() : '',
          price,
          priceDisplay:
            typeof f.priceDisplay === 'string' && f.priceDisplay.trim()
              ? f.priceDisplay.trim()
              : price
              ? `${price.toLocaleString()}원`
              : '가격 문의',
          image: typeof f.image === 'string' ? f.image.trim() : '',
          description: typeof f.description === 'string' ? f.description.trim() : '',
          shortDescription: typeof f.shortDescription === 'string' ? f.shortDescription.trim() : '',
          features: Array.isArray(f.features) ? (f.features as string[]) : [],
          specs: f.specs && typeof f.specs === 'object' ? (f.specs as Record<string, string>) : {},
          inStock: f.inStock !== false,
          ...(variantsNorm !== undefined ? { variants: variantsNorm } : {}),
        };
        products.push(newProduct);
        await writeData('products', products);
        await logAdmin('products', 'create', {
          summary: `AI: 제품 등록 — ${newProduct.name}`,
          targetId: newProduct.id,
        });
        revalidateAll(['/products', `/products/${newProduct.slug}`, '/']);
        return { ok: true, summary: `제품 '${newProduct.name}' 등록. id=${newProduct.id}`, data: { id: newProduct.id, slug: newProduct.slug } };
      }

      case 'delete_product': {
        const id = String(input.id ?? '');
        const products = await readData<Product>('products');
        const idx = products.findIndex((p) => p.id === id);
        if (idx === -1) return { ok: false, summary: '제품 없음', error: `not found: ${id}` };
        const removed = products.splice(idx, 1)[0];
        await writeData('products', products);
        await logAdmin('products', 'delete', {
          summary: `AI: 제품 삭제 — ${removed?.name ?? id}`,
          targetId: id,
        });
        revalidateAll(['/products', '/']);
        return { ok: true, summary: `제품 '${removed?.name ?? id}' 삭제 완료.` };
      }

      /* ── FAQ ─────────────────────────────── */
      case 'list_faqs': {
        const faqs = await readData<{ id: string; question: string; answer: string; category?: string }>('faq');
        const cat = typeof input.category === 'string' ? input.category : '';
        const out = cat ? faqs.filter((f) => f.category === cat) : faqs;
        return { ok: true, summary: `FAQ ${out.length}건`, data: out };
      }

      case 'create_faq': {
        const q = String(input.question ?? '').trim();
        const a = String(input.answer ?? '').trim();
        if (!q || !a) return { ok: false, summary: 'question/answer 필수', error: 'required' };
        const faqs = await readData<{ id: string; question: string; answer: string; category?: string }>('faq');
        const item = {
          id: `faq-${Date.now()}`,
          question: q,
          answer: a,
          ...(typeof input.category === 'string' ? { category: input.category } : {}),
        };
        faqs.push(item);
        await writeData('faq', faqs);
        await logAdmin('faq', 'create', { summary: `AI: FAQ 등록 — ${q.slice(0, 40)}`, targetId: item.id });
        revalidateAll(['/support']);
        return { ok: true, summary: `FAQ 등록. id=${item.id}` };
      }

      case 'update_faq': {
        const id = String(input.id ?? '');
        const faqs = await readData<{ id: string; question: string; answer: string; category?: string }>('faq');
        const idx = faqs.findIndex((f) => f.id === id);
        if (idx === -1) return { ok: false, summary: 'FAQ 없음', error: `not found: ${id}` };
        const updated = {
          ...faqs[idx],
          ...(typeof input.question === 'string' ? { question: input.question.trim() } : {}),
          ...(typeof input.answer === 'string' ? { answer: input.answer.trim() } : {}),
          ...(typeof input.category === 'string' ? { category: input.category } : {}),
        };
        faqs[idx] = updated;
        await writeData('faq', faqs);
        await logAdmin('faq', 'update', { summary: `AI: FAQ 수정 — ${updated.question.slice(0, 40)}`, targetId: id });
        revalidateAll(['/support']);
        return { ok: true, summary: `FAQ '${id}' 수정 완료.` };
      }

      case 'delete_faq': {
        const id = String(input.id ?? '');
        const faqs = await readData<{ id: string; question: string; answer: string; category?: string }>('faq');
        const idx = faqs.findIndex((f) => f.id === id);
        if (idx === -1) return { ok: false, summary: 'FAQ 없음', error: `not found: ${id}` };
        const removed = faqs.splice(idx, 1)[0];
        await writeData('faq', faqs);
        await logAdmin('faq', 'delete', { summary: `AI: FAQ 삭제 — ${removed?.question.slice(0, 40) ?? id}`, targetId: id });
        revalidateAll(['/support']);
        return { ok: true, summary: `FAQ '${id}' 삭제 완료.` };
      }

      /* ── Announcement ────────────────────── */
      case 'get_announcement': {
        const data = await readSingle('announcement');
        return { ok: true, summary: '공지 배너 조회', data };
      }

      case 'update_announcement': {
        const { enabled, text, link, linkLabel, variant } = input as {
          enabled: boolean;
          text: string;
          link: string;
          linkLabel: string;
          variant: 'gold' | 'dark' | 'red';
        };
        if (!['gold', 'dark', 'red'].includes(variant)) {
          return { ok: false, summary: 'variant 값 오류', error: 'invalid variant' };
        }
        const current = ((await readSingle('announcement')) as Record<string, unknown>) ?? {};
        const updated = {
          ...current,
          enabled: !!enabled,
          text: String(text ?? ''),
          link: String(link ?? ''),
          linkLabel: String(linkLabel ?? ''),
          variant,
          updatedAt: new Date().toISOString(),
        };
        await writeSingle('announcement', updated);
        await logAdmin('announcement', 'update', {
          summary: `AI: 공지 ${enabled ? '활성화' : '비활성화'} — ${String(text ?? '').slice(0, 30)}`,
        });
        revalidateAll(['/']);
        return { ok: true, summary: `공지 배너 저장 (${enabled ? '활성' : '비활성'}).` };
      }

      /* ── Reviews ─────────────────────────── */
      case 'list_reviews': {
        const limit = typeof input.limit === 'number' ? Math.max(1, Math.min(200, input.limit)) : 50;
        const verifiedOnly = input.verifiedOnly === true;
        const reviews = await readData<Review>('reviews');
        const filtered = verifiedOnly ? reviews.filter((r) => r.verified) : reviews;
        return {
          ok: true,
          summary: `리뷰 ${filtered.length}건`,
          data: filtered.slice(0, limit).map((r) => ({
            id: r.id,
            author: r.author,
            rating: r.rating,
            verified: r.verified,
            date: r.date,
            content: typeof r.content === 'string' ? r.content.slice(0, 160) : '',
          })),
        };
      }

      case 'update_review_verified': {
        const id = String(input.id ?? '');
        const verified = !!input.verified;
        const reviews = await readData<Review>('reviews');
        const idx = reviews.findIndex((r) => r.id === id);
        if (idx === -1) return { ok: false, summary: '리뷰 없음', error: `not found: ${id}` };
        reviews[idx].verified = verified;
        await writeData('reviews', reviews);
        await logAdmin('reviews', 'update', {
          summary: `AI: 리뷰 ${verified ? '승인' : '미승인'} — ${reviews[idx].author ?? id}`,
          targetId: id,
        });
        revalidateAll(['/reviews', '/']);
        return { ok: true, summary: `리뷰 ${verified ? '승인' : '미승인'} 완료.` };
      }

      case 'delete_review': {
        const id = String(input.id ?? '');
        const reviews = await readData<Review>('reviews');
        const idx = reviews.findIndex((r) => r.id === id);
        if (idx === -1) return { ok: false, summary: '리뷰 없음', error: `not found: ${id}` };
        const removed = reviews.splice(idx, 1)[0];
        await writeData('reviews', reviews);
        await logAdmin('reviews', 'delete', {
          summary: `AI: 리뷰 삭제 — ${removed?.author ?? id}`,
          targetId: id,
        });
        revalidateAll(['/reviews', '/']);
        return { ok: true, summary: `리뷰 삭제 완료.` };
      }

      default:
        return { ok: false, summary: `알 수 없는 도구: ${name}`, error: `unknown tool: ${name}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[ai-tools] executeTool error', name, msg);
    return { ok: false, summary: `도구 실행 실패: ${msg}`, error: msg };
  }
}
