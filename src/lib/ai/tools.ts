import { revalidatePath } from 'next/cache';
import { readData, writeData, readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import type { Product, ProductVariant } from '@/data/products';
import type { Review } from '@/data/reviews';
import {
  deleteRepoFile,
  isPathAllowed,
  listRepoDir,
  readRepoFile,
  searchRepoCode,
  writeRepoFile,
} from './github';

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

export interface ToolContext {
  actorEmail?: string;
  actorName?: string;
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

  /* ─── Source code editing (via GitHub API) ───────────
     NOTE: These commit directly to the `main` branch and trigger
     a Vercel rebuild (~2–3 minutes to reflect on the site).
     Use DB tools first when the edit is about content; fall back to
     source tools only when the target is hardcoded in .tsx/.ts files.
     ──────────────────────────────────────────────────── */
  {
    name: 'search_source_code',
    description:
      '레포지토리 내 소스 코드에서 문자열/패턴을 검색합니다. 하드코딩된 문구(예: "10ha")의 위치를 찾을 때 사용하세요. GitHub Code Search 기반이며 인덱싱에 약간의 지연이 있을 수 있습니다.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '검색어. 따옴표로 감싸면 exact match.' },
        limit: { type: 'number', description: '최대 결과 수 (기본 20, 최대 50).' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_source_files',
    description:
      '레포지토리의 디렉터리 목록을 반환합니다. 허용 경로: src/, public/, data/, scripts/ 와 일부 루트 설정 파일.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '디렉터리 경로 (예: "src/components/layout"). 빈 값이면 루트.' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'read_source_file',
    description:
      '레포지토리의 파일 원문을 반환합니다. 수정 전 반드시 먼저 읽어 현재 내용을 파악하세요. 반환값의 sha는 edit_source_file 호출 시 사용합니다.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '파일 경로 (예: "src/components/layout/Header.tsx").' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'edit_source_file',
    description:
      '[전체 파일 덮어쓰기] 레포지토리 파일을 새 내용으로 덮어쓰고 main 브랜치에 커밋. **이 도구는 신규 파일 생성이나 완전 재작성 시에만 사용하세요.** 기존 파일의 일부 수정은 반드시 `str_replace_source_file` 또는 `multi_str_replace_source_file`을 사용하세요 (출력 토큰·시간 20배 절감). 파일이 이미 존재하면 sha 필수. 신규 파일이면 sha 생략. 안전장치: 새 내용이 현재 파일 크기 70% 미만이면 거부 (truncated read 후 뒷부분 날림 방지). 의도된 대폭 축소면 force=true.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string', description: '파일의 최종 전체 내용 (부분 교체 아님).' },
        commit_message: { type: 'string', description: '커밋 메시지 (예: "fix: 히어로 문구 수정").' },
        sha: {
          type: 'string',
          description: '기존 파일 수정 시 필수 (read_source_file에서 얻은 blob SHA). 신규 파일이면 생략.',
        },
        force: {
          type: 'boolean',
          description: '현재 크기보다 30% 이상 줄어드는 쓰기를 강행할 때 true. 기본 false.',
        },
      },
      required: ['path', 'content', 'commit_message'],
      additionalProperties: false,
    },
  },
  {
    name: 'str_replace_source_file',
    description:
      '[부분 수정 — 권장] 파일에서 old_string을 new_string으로 **정확히 한 번** 교체하고 커밋. 모델은 바뀌는 부분만 출력하면 되므로 대용량 파일(10KB+) 편집 시 edit_source_file 대비 20배 빠름. 규칙: (1) old_string은 파일 내에서 정확히 일치하는 유일한 문자열이어야 함 (공백·탭·줄바꿈 모두 보존). (2) 여러 곳을 동시에 수정하려면 multi_str_replace_source_file 사용. (3) 신규 파일 생성에는 사용 불가 (edit_source_file 사용). commit_message는 생략 시 자동 생성됨.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '파일 경로' },
        old_string: {
          type: 'string',
          description:
            '교체 대상 문자열. 파일 안에서 **정확히 한 번** 등장해야 함. 유일성 확보를 위해 앞뒤 3~5줄 포함 권장. 탭/공백/줄바꿈 1바이트라도 다르면 매칭 실패.',
        },
        new_string: {
          type: 'string',
          description: '교체 결과 문자열. old_string과 동일해선 안 됨.',
        },
        commit_message: {
          type: 'string',
          description: '커밋 메시지. 생략하면 자동 생성 (예: "chore(admin-ai): edit <path>").',
        },
        sha: {
          type: 'string',
          description: '필수. read_source_file에서 얻은 blob SHA. 충돌 감지용.',
        },
      },
      required: ['path', 'old_string', 'new_string', 'sha'],
      additionalProperties: false,
    },
  },
  {
    name: 'multi_str_replace_source_file',
    description:
      '[부분 수정 — 다중] 한 파일에 여러 교체를 **원자적으로** 적용하고 단일 커밋. 모든 교체가 순서대로 성공해야 커밋; 한 건이라도 실패하면 전체 롤백. BrandStoryClient.tsx에 탭 2개 추가처럼 import·state·JSX 3~5곳을 한 번에 바꿀 때 이상적. 각 replacement의 old_string은 해당 시점의 파일 내용에서 정확히 한 번 등장해야 함 (이전 교체의 new_string도 고려됨).',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        replacements: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              old_string: { type: 'string' },
              new_string: { type: 'string' },
            },
            required: ['old_string', 'new_string'],
            additionalProperties: false,
          },
          description: '적용할 교체 목록. 순서대로 적용됨.',
        },
        commit_message: {
          type: 'string',
          description: '커밋 메시지. 생략하면 자동 생성.',
        },
        sha: {
          type: 'string',
          description: '필수. read_source_file에서 얻은 blob SHA.',
        },
      },
      required: ['path', 'replacements', 'sha'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_source_file',
    description:
      '레포지토리 파일을 삭제하고 커밋합니다. 파괴적 작업이므로 사용자가 명시적으로 요청했을 때만 실행.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        sha: { type: 'string', description: 'read_source_file로 얻은 blob SHA' },
        commit_message: { type: 'string' },
      },
      required: ['path', 'sha', 'commit_message'],
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

/**
 * Count non-overlapping occurrences of `needle` in `haystack`. Used by
 * str_replace tools to enforce the "exactly one match" invariant that
 * prevents silent mass-replacement bugs (same rule as Claude Code's Edit).
 */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    const found = haystack.indexOf(needle, idx);
    if (found === -1) return count;
    count += 1;
    idx = found + needle.length;
  }
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
  input: Record<string, unknown>,
  context: ToolContext = {}
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

      /* ── Source code editing (GitHub API) ─────────────── */
      case 'search_source_code': {
        const query = String(input.query ?? '').trim();
        if (!query) return { ok: false, summary: 'query 필수', error: 'empty query' };
        const limit = typeof input.limit === 'number' ? input.limit : 20;
        const results = await searchRepoCode(query, limit);
        return {
          ok: true,
          summary: `코드 검색 '${query}' — ${results.length}건`,
          data: results.map((r) => ({
            path: r.path,
            snippet: r.textMatches?.[0]?.fragment?.slice(0, 300) ?? '',
            score: r.score,
          })),
        };
      }

      case 'list_source_files': {
        const path = String(input.path ?? '');
        if (path) {
          const allow = isPathAllowed(path === '' ? 'src/' : `${path.replace(/\/+$/, '')}/`);
          // Allow listing the allow-prefixes themselves even without a trailing file
          const bareAllow =
            path === '' ||
            ['src', 'public', 'data', 'scripts'].some(
              (p) => path === p || path === `${p}/` || path.startsWith(`${p}/`)
            );
          if (!bareAllow && !allow.ok) {
            return { ok: false, summary: '허용되지 않은 경로', error: allow.ok ? '' : allow.reason };
          }
        }
        const entries = await listRepoDir(path);
        return {
          ok: true,
          summary: `${path || '/'} — ${entries.length}개 항목`,
          data: entries.map((e) => ({ name: e.name, path: e.path, type: e.type, size: e.size })),
        };
      }

      case 'read_source_file': {
        const path = String(input.path ?? '');
        const allow = isPathAllowed(path);
        if (!allow.ok) return { ok: false, summary: '허용되지 않은 경로', error: allow.reason };
        const file = await readRepoFile(path);

        // Cap content to keep per-turn input tokens bounded. A file bigger than
        // ~40 KB (~10k tokens) ballooning through the agentic loop is the usual
        // path to ITPM rate-limit hits. Truncated reads still return the sha
        // unchanged, so edit_source_file requires a full re-read first.
        const MAX_READ_BYTES = 40 * 1024;
        const truncated = file.content.length > MAX_READ_BYTES;
        const content = truncated ? file.content.slice(0, MAX_READ_BYTES) : file.content;

        return {
          ok: true,
          summary: truncated
            ? `파일 읽음(앞 ${MAX_READ_BYTES}B로 자름): ${file.path} (실제 ${file.size} B)`
            : `파일 읽음: ${file.path} (${file.size} B)`,
          data: {
            path: file.path,
            sha: file.sha,
            size: file.size,
            content,
            truncated,
            ...(truncated
              ? {
                  note:
                    '파일이 큽니다. 전체 덮어쓰기 대신 부분 수정이 필요한 위치를 명확히 파악한 뒤 edit_source_file 사용 시 수정된 전체 내용을 정확히 전달하세요. 필요하면 search_source_code로 대상 라인을 먼저 찾으세요.',
                }
              : {}),
          },
        };
      }

      case 'edit_source_file': {
        const path = String(input.path ?? '');
        const content = typeof input.content === 'string' ? input.content : '';
        const message = String(input.commit_message ?? '').trim();
        const sha = typeof input.sha === 'string' && input.sha.trim() ? input.sha.trim() : undefined;
        const force = input.force === true;
        const allow = isPathAllowed(path);
        if (!allow.ok) return { ok: false, summary: '허용되지 않은 경로', error: allow.reason };
        if (!message) return { ok: false, summary: 'commit_message 필수', error: 'commit_message required' };
        if (!content) return { ok: false, summary: 'content 필수', error: 'empty content' };

        // Safety: if the file exists and the new content is drastically smaller
        // than the current file, refuse. This catches the truncated-read data
        // loss scenario — the model saw only the first 40 KB (read cap) and
        // sends that back as the "full" file, which would delete the tail.
        if (sha && !force) {
          try {
            const current = await readRepoFile(path);
            const currentSize = current.size;
            const newSize = Buffer.byteLength(content, 'utf8');
            if (currentSize > 0 && newSize < currentSize * 0.7) {
              return {
                ok: false,
                summary: '안전장치: 대폭 축소 거부',
                error: `현재 ${currentSize}B → 제안 ${newSize}B (${Math.round((1 - newSize / currentSize) * 100)}% 감소). 의도하지 않은 데이터 손실 가능성. read_source_file로 전체 다시 읽은 뒤 필요한 부분만 수정하세요. 의도된 삭제면 force=true 플래그 추가.`,
              };
            }
            // Also guard against stale SHA: if the provided sha doesn't match
            // what's currently on main, someone else edited the file. Surface
            // this before GitHub returns a cryptic 409.
            if (current.sha !== sha) {
              return {
                ok: false,
                summary: 'SHA 불일치 (충돌)',
                error: `파일이 다른 곳에서 수정되었습니다. read_source_file로 현재 sha를 다시 받아 재시도하세요. (기대 ${sha.slice(0, 7)}, 현재 ${current.sha.slice(0, 7)})`,
              };
            }
          } catch (err) {
            // readRepoFile fails on missing — if sha was given but file is
            // gone, keep going and let GitHub surface a clearer error.
            void err;
          }
        }

        const actor = context.actorEmail ?? 'daracheon-admin-ai';
        const result = await writeRepoFile({
          path,
          content,
          message: `${message}\n\nvia daracheon admin AI (by ${actor})`,
          sha,
          authorName: context.actorName ?? 'daracheon-admin-ai',
          authorEmail: context.actorEmail ?? 'ai@daracheon.local',
        });
        await logAdmin('settings', 'update', {
          summary: `AI: 소스 수정 — ${path} (${result.commitSha.slice(0, 7)})`,
          targetId: path,
          meta: { commitSha: result.commitSha, path },
        });
        return {
          ok: true,
          summary: `'${path}' 커밋 완료 (${result.commitSha.slice(0, 7)}). Vercel 재빌드 시작 — 2~3분 후 사이트 반영.`,
          data: { path, commitSha: result.commitSha, htmlUrl: result.htmlUrl },
        };
      }

      case 'str_replace_source_file': {
        const path = String(input.path ?? '');
        const oldStr = typeof input.old_string === 'string' ? input.old_string : '';
        const newStr = typeof input.new_string === 'string' ? input.new_string : '';
        const providedMsg = String(input.commit_message ?? '').trim();
        const sha = typeof input.sha === 'string' ? input.sha.trim() : '';
        const allow = isPathAllowed(path);
        if (!allow.ok) return { ok: false, summary: '허용되지 않은 경로', error: allow.reason };
        if (!sha) return { ok: false, summary: 'sha 필수', error: 'sha required' };
        if (!oldStr) return { ok: false, summary: 'old_string 필수', error: 'empty old_string' };
        const message = providedMsg || `chore(admin-ai): edit ${path}`;
        if (oldStr === newStr) {
          return {
            ok: false,
            summary: 'old_string과 new_string이 동일',
            error: 'old_string equals new_string — no change would be made',
          };
        }

        let current: Awaited<ReturnType<typeof readRepoFile>>;
        try {
          current = await readRepoFile(path);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'read failed';
          return { ok: false, summary: '파일 읽기 실패', error: msg };
        }
        if (current.sha !== sha) {
          return {
            ok: false,
            summary: 'SHA 불일치 (충돌)',
            error: `파일이 다른 곳에서 수정되었습니다. read_source_file로 현재 sha를 다시 받아 재시도하세요. (기대 ${sha.slice(0, 7)}, 현재 ${current.sha.slice(0, 7)})`,
          };
        }

        const occurrences = countOccurrences(current.content, oldStr);
        if (occurrences === 0) {
          return {
            ok: false,
            summary: 'old_string을 찾지 못함',
            error:
              'old_string이 파일 안에 없습니다. 탭/공백/줄바꿈이 파일 원문과 정확히 일치해야 합니다. read_source_file로 실제 내용을 확인하세요.',
          };
        }
        if (occurrences > 1) {
          return {
            ok: false,
            summary: `old_string이 ${occurrences}곳 — 유일하지 않음`,
            error: `여러 곳에 매칭됩니다 (${occurrences}회). old_string에 앞뒤 컨텍스트를 더 포함해 유일성을 확보하세요. 혹은 multi_str_replace_source_file로 각 위치를 개별 지정하세요.`,
          };
        }

        const newContent = current.content.replace(oldStr, newStr);
        const actor = context.actorEmail ?? 'daracheon-admin-ai';
        const result = await writeRepoFile({
          path,
          content: newContent,
          message: `${message}\n\nvia daracheon admin AI (by ${actor})`,
          sha,
          authorName: context.actorName ?? 'daracheon-admin-ai',
          authorEmail: context.actorEmail ?? 'ai@daracheon.local',
        });
        await logAdmin('settings', 'update', {
          summary: `AI: str_replace — ${path} (${result.commitSha.slice(0, 7)})`,
          targetId: path,
          meta: {
            commitSha: result.commitSha,
            path,
            oldBytes: Buffer.byteLength(oldStr, 'utf8'),
            newBytes: Buffer.byteLength(newStr, 'utf8'),
          },
        });
        return {
          ok: true,
          summary: `'${path}' 부분 수정 완료 (${result.commitSha.slice(0, 7)}). Vercel 재빌드 시작 — 2~3분 후 사이트 반영.`,
          data: {
            path,
            commitSha: result.commitSha,
            htmlUrl: result.htmlUrl,
            newSha: result.sha,
            bytesChanged: Buffer.byteLength(newStr, 'utf8') - Buffer.byteLength(oldStr, 'utf8'),
          },
        };
      }

      case 'multi_str_replace_source_file': {
        const path = String(input.path ?? '');
        const rawReplacements = Array.isArray(input.replacements) ? input.replacements : [];
        const providedMsg = String(input.commit_message ?? '').trim();
        const sha = typeof input.sha === 'string' ? input.sha.trim() : '';
        const allow = isPathAllowed(path);
        if (!allow.ok) return { ok: false, summary: '허용되지 않은 경로', error: allow.reason };
        if (!sha) return { ok: false, summary: 'sha 필수', error: 'sha required' };
        if (rawReplacements.length === 0) {
          return { ok: false, summary: 'replacements 비어있음', error: 'empty replacements' };
        }

        const replacements: { oldStr: string; newStr: string }[] = [];
        for (let i = 0; i < rawReplacements.length; i += 1) {
          const r = rawReplacements[i] as Record<string, unknown> | null;
          const oldStr = r && typeof r.old_string === 'string' ? r.old_string : '';
          const newStr = r && typeof r.new_string === 'string' ? r.new_string : '';
          if (!oldStr) {
            return {
              ok: false,
              summary: `replacements[${i}].old_string 비어있음`,
              error: `empty old_string at index ${i}`,
            };
          }
          if (oldStr === newStr) {
            return {
              ok: false,
              summary: `replacements[${i}] 무변경`,
              error: `old_string equals new_string at index ${i}`,
            };
          }
          replacements.push({ oldStr, newStr });
        }

        let current: Awaited<ReturnType<typeof readRepoFile>>;
        try {
          current = await readRepoFile(path);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'read failed';
          return { ok: false, summary: '파일 읽기 실패', error: msg };
        }
        if (current.sha !== sha) {
          return {
            ok: false,
            summary: 'SHA 불일치 (충돌)',
            error: `파일이 다른 곳에서 수정되었습니다. read_source_file로 현재 sha를 다시 받아 재시도하세요. (기대 ${sha.slice(0, 7)}, 현재 ${current.sha.slice(0, 7)})`,
          };
        }

        let working = current.content;
        for (let i = 0; i < replacements.length; i += 1) {
          const { oldStr, newStr } = replacements[i];
          const occurrences = countOccurrences(working, oldStr);
          if (occurrences === 0) {
            return {
              ok: false,
              summary: `replacements[${i}] 매칭 실패`,
              error: `old_string이 (이전 교체 ${i}건 적용 후) 파일 안에 없습니다. 탭/공백/줄바꿈 일치 확인.`,
            };
          }
          if (occurrences > 1) {
            return {
              ok: false,
              summary: `replacements[${i}] 매칭 ${occurrences}곳 — 유일하지 않음`,
              error: `앞뒤 컨텍스트를 더 포함해 유일성을 확보하세요 (index ${i}, occurrences ${occurrences}).`,
            };
          }
          working = working.replace(oldStr, newStr);
        }

        if (working === current.content) {
          return { ok: false, summary: '변경 없음', error: '모든 교체 적용 후 내용이 동일합니다.' };
        }

        const actor = context.actorEmail ?? 'daracheon-admin-ai';
        const result = await writeRepoFile({
          path,
          content: working,
          message: `${providedMsg || `chore(admin-ai): edit ${path} (${replacements.length} replacements)`}\n\nvia daracheon admin AI (by ${actor})`,
          sha,
          authorName: context.actorName ?? 'daracheon-admin-ai',
          authorEmail: context.actorEmail ?? 'ai@daracheon.local',
        });
        await logAdmin('settings', 'update', {
          summary: `AI: multi_str_replace — ${path} (${result.commitSha.slice(0, 7)}, ${replacements.length}건)`,
          targetId: path,
          meta: {
            commitSha: result.commitSha,
            path,
            editCount: replacements.length,
          },
        });
        return {
          ok: true,
          summary: `'${path}' ${replacements.length}건 부분 수정 완료 (${result.commitSha.slice(0, 7)}). Vercel 재빌드 시작.`,
          data: {
            path,
            commitSha: result.commitSha,
            htmlUrl: result.htmlUrl,
            newSha: result.sha,
            editCount: replacements.length,
          },
        };
      }

      case 'delete_source_file': {
        const path = String(input.path ?? '');
        const sha = String(input.sha ?? '').trim();
        const message = String(input.commit_message ?? '').trim();
        const allow = isPathAllowed(path);
        if (!allow.ok) return { ok: false, summary: '허용되지 않은 경로', error: allow.reason };
        if (!sha) return { ok: false, summary: 'sha 필수', error: 'sha required' };
        if (!message) return { ok: false, summary: 'commit_message 필수', error: 'commit_message required' };

        const actor = context.actorEmail ?? 'daracheon-admin-ai';
        const result = await deleteRepoFile({
          path,
          sha,
          message: `${message}\n\nvia daracheon admin AI (by ${actor})`,
          authorName: context.actorName ?? 'daracheon-admin-ai',
          authorEmail: context.actorEmail ?? 'ai@daracheon.local',
        });
        await logAdmin('settings', 'update', {
          summary: `AI: 소스 삭제 — ${path} (${result.commitSha.slice(0, 7)})`,
          targetId: path,
          meta: { commitSha: result.commitSha, path },
        });
        return {
          ok: true,
          summary: `'${path}' 삭제 커밋 완료 (${result.commitSha.slice(0, 7)}). Vercel 재빌드 시작.`,
          data: { path, commitSha: result.commitSha },
        };
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
