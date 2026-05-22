'use client';

import { useEffect, useState } from 'react';
import { saveAdminPage } from '@/lib/adminSave';

interface HomeShoppingHero {
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
}

interface NsHead {
  kicker: string;
  titleLead: string;
  titleEmphasis: string;
  lede: string;
}

interface NsSoldOut {
  imageUrl: string;
  imageAlt: string;
  stampLabel: string;
  kicker: string;
  titleHtml: string;
  body: string;
  factChannel: string;
  factComposition: string;
  factResult: string;
}

interface NsHeroFallback {
  tag: string;
  titleHtml: string;
  body: string;
  metaChannel: string;
  metaShow: string;
  metaResult: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaPhone: string;
}

interface NsVideo {
  id: string;
  kicker: string;
  title: string;
  url: string;
}

interface HomeShoppingPageData {
  hero: HomeShoppingHero;
  nsHead?: NsHead;
  nsSoldOut?: NsSoldOut;
  nsHeroFallback?: NsHeroFallback;
  nsVideos?: NsVideo[];
}

const DEFAULT_HERO: HomeShoppingHero = {
  titleLine1: 'TV 홈쇼핑',
  titleEmphasis: '편성표 · 다시보기',
  lede: '롯데·현대·CJ·GS 홈쇼핑 정규 편성 중. 실시간 방송은 각 홈쇼핑 앱과 ZOEL LIFE 웹에서 동시 송출됩니다.',
};

const DEFAULT_NS_HEAD: NsHead = {
  kicker: 'NS Shop+ · 방송 제작 영상',
  titleLead: 'NS홈쇼핑이 담은 ',
  titleEmphasis: '대라천 침향',
  lede: 'NS홈쇼핑이 직접 제작한 브랜드 영상 4편을 다시 보실 수 있습니다. 베트남 현지 채취 현장부터 문경수 대표 인터뷰, 쇼룸 투어까지 — 방송에서 미처 다 담지 못한 ‘진짜 침향’의 디테일을 확인하세요.',
};

const DEFAULT_NS_SOLD_OUT: NsSoldOut = {
  imageUrl: '/images/ns-broadcast-soldout.jpg',
  imageAlt: 'NS홈쇼핑 창립 25주년 대고객 감사 프로젝트 — 대라천 참 침향오일 방송 매진 화면',
  stampLabel: 'SOLD OUT',
  kicker: '완판 · SOLD OUT',
  titleHtml: 'NS홈쇼핑 창립 25주년 <em>대고객 감사 프로젝트</em><br />대라천 ‘참’침향오일 — <em>방송 중 매진</em>',
  body: 'NS Shop+ 단독 편성으로 진행된 ‘대라천 참 침향오일’ 방송이 편성 시간 안에 완판되었습니다. 지원해 주신 모든 고객님께 감사드리며, 다음 편성은 확정되는 대로 본 페이지에 안내드립니다.',
  factChannel: 'NS Shop+',
  factComposition: '대라천 ‘참’침향오일 · 1병 557,650원',
  factResult: '방송 중 완판',
};

const DEFAULT_NS_HERO_FALLBACK: NsHeroFallback = {
  tag: 'REPLAY · NS 홈쇼핑 방송 다시보기',
  titleHtml: 'NS홈쇼핑 — <em>대라천 ‘참’침향오일</em><br />방송 중 <em>완판</em>되었습니다',
  body: 'NS Shop+ 창립 25주년 대고객 감사 프로젝트 단독 편성이 편성 시간 안에 매진으로 마감되었습니다. 다음 편성은 확정되는 대로 본 페이지에 안내드리며, 그 전까지는 NS홈쇼핑이 직접 제작한 방송 영상으로 대라천 ‘참’침향의 디테일을 확인하실 수 있습니다.',
  metaChannel: 'NS Shop+',
  metaShow: '창립 25주년 대고객 감사 프로젝트',
  metaResult: '방송 중 완판',
  ctaPrimaryLabel: '제작 영상 전체 보기 →',
  ctaPrimaryHref: '#ns-videos',
  ctaPhone: '070-4140-4086',
};

function LabeledInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, rows = 3, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, description, children, onSave, saving }: { title: string; description?: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {description && <p className="mb-6 mt-1 text-sm text-gray-500">{description}</p>}
      {!description && <div className="mb-6" />}
      {children}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="adm-btn-primary px-6 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </section>
  );
}

export default function AdminHomeShoppingHeroPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<null | 'hero' | 'nsHead' | 'nsSoldOut' | 'nsHeroFallback' | 'nsVideos'>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [hero, setHero] = useState<HomeShoppingHero>(DEFAULT_HERO);
  const [nsHead, setNsHead] = useState<NsHead>(DEFAULT_NS_HEAD);
  const [nsSoldOut, setNsSoldOut] = useState<NsSoldOut>(DEFAULT_NS_SOLD_OUT);
  const [nsHeroFallback, setNsHeroFallback] = useState<NsHeroFallback>(DEFAULT_NS_HERO_FALLBACK);
  const [nsVideos, setNsVideos] = useState<NsVideo[]>([]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/pages', { cache: 'no-store' });
        if (res.status === 404) return;
        const data = (await res.json()) as { pages?: { homeShopping?: Partial<HomeShoppingPageData> } };
        const d = data.pages?.homeShopping;
        if (d?.hero) setHero({ ...DEFAULT_HERO, ...d.hero });
        if (d?.nsHead) setNsHead({ ...DEFAULT_NS_HEAD, ...d.nsHead });
        if (d?.nsSoldOut) setNsSoldOut({ ...DEFAULT_NS_SOLD_OUT, ...d.nsSoldOut });
        if (d?.nsHeroFallback) setNsHeroFallback({ ...DEFAULT_NS_HERO_FALLBACK, ...d.nsHeroFallback });
        if (d?.nsVideos) setNsVideos(d.nsVideos);
      } catch (err) {
        console.error('Failed to fetch homeShopping:', err);
        setToast({ msg: '데이터 로드 실패', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function savePartial<K extends keyof HomeShoppingPageData>(key: K, value: HomeShoppingPageData[K], tag: typeof saving) {
    setSaving(tag);
    try {
      const res = await fetch('/api/admin/pages', { cache: 'no-store' });
      const body = res.ok ? ((await res.json()) as { pages?: { homeShopping?: HomeShoppingPageData } }) : { pages: {} };
      const current = (body.pages?.homeShopping ?? {}) as HomeShoppingPageData;
      const merged: HomeShoppingPageData = { ...current, [key]: value } as HomeShoppingPageData;
      const result = await saveAdminPage('homeShopping', merged);
      if (!result.ok) {
        setToast({ msg: `저장 실패: ${result.msg}`, type: 'error' });
        return;
      }
      setToast({ msg: `저장 완료${result.totalMs ? ` (${result.totalMs}ms)` : ''}`, type: 'success' });
    } catch (err) {
      console.error('Save error:', err);
      setToast({ msg: `저장 실패: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">On-Air 특별관 편집</h1>
        <p className="mb-8 text-gray-500">
          /home-shopping 공개 페이지의 히어로 + NS홈쇼핑 모듈(영상 갤러리 헤드 · 매진 배너 · Hero 재방송 카드 · 영상 4편) 을 편집합니다.
          모듈마다 개별 저장 버튼이 있으니 필요한 부분만 골라 저장하세요. <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">&lt;em&gt;...&lt;/em&gt;</code> 와 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">&lt;br /&gt;</code> 태그는 강조·줄바꿈 용으로 그대로 렌더됩니다.
        </p>

        <div className="space-y-8">
          {/* 1. HERO (featured 방송이 있을 때 노출되는 페이지 상단 헤더) */}
          <SectionCard
            title="HERO · 페이지 헤더"
            description="featured 방송(예정/라이브/최근 종료)이 등록되어 있을 때 페이지 최상단에 나오는 제목/부제목."
            onSave={() => savePartial('hero', hero, 'hero')}
            saving={saving === 'hero'}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="제목 1행 (예: TV 홈쇼핑)" value={hero.titleLine1} onChange={(v) => setHero({ ...hero, titleLine1: v })} />
                <LabeledInput label="제목 강조 (em, 예: 편성표 · 다시보기)" value={hero.titleEmphasis} onChange={(v) => setHero({ ...hero, titleEmphasis: v })} />
              </div>
              <LabeledTextarea label="부제목 (lede)" value={hero.lede} onChange={(v) => setHero({ ...hero, lede: v })} rows={3} />
            </div>
          </SectionCard>

          {/* 2. NS Hero Fallback — featured 방송이 없을 때 노출되는 재방송 카드 */}
          <SectionCard
            title="NS · Hero 재방송 카드 (Fallback)"
            description="featured 방송이 없을 때 페이지 상단에 노출됩니다. 우측 모니터에는 NS 영상 4편 중 ‘쇼룸’ 이 자동 재생됩니다."
            onSave={() => savePartial('nsHeroFallback', nsHeroFallback, 'nsHeroFallback')}
            saving={saving === 'nsHeroFallback'}
          >
            <div className="space-y-5">
              <LabeledInput
                label="상단 태그 (예: REPLAY · NS 홈쇼핑 방송 다시보기)"
                value={nsHeroFallback.tag}
                onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, tag: v })}
              />
              <LabeledTextarea
                label="제목 (HTML, em/br 사용 가능)"
                value={nsHeroFallback.titleHtml}
                onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, titleHtml: v })}
                rows={3}
                hint="예: NS홈쇼핑 — <em>대라천 ‘참’침향오일</em><br />방송 중 <em>완판</em>되었습니다"
              />
              <LabeledTextarea
                label="본문 (body)"
                value={nsHeroFallback.body}
                onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, body: v })}
                rows={4}
              />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <LabeledInput label="메타 — 채널" value={nsHeroFallback.metaChannel} onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, metaChannel: v })} />
                <LabeledInput label="메타 — 방송" value={nsHeroFallback.metaShow} onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, metaShow: v })} />
                <LabeledInput label="메타 — 결과" value={nsHeroFallback.metaResult} onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, metaResult: v })} />
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput label="CTA 버튼 라벨" value={nsHeroFallback.ctaPrimaryLabel} onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, ctaPrimaryLabel: v })} />
                <LabeledInput label="CTA 버튼 링크 (예: #ns-videos)" value={nsHeroFallback.ctaPrimaryHref} onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, ctaPrimaryHref: v })} />
              </div>
              <LabeledInput label="전화 주문 번호 (빈 값이면 버튼 숨김)" value={nsHeroFallback.ctaPhone} onChange={(v) => setNsHeroFallback({ ...nsHeroFallback, ctaPhone: v })} />
            </div>
          </SectionCard>

          {/* 3. NS Head — 영상 갤러리 헤드 */}
          <SectionCard
            title="NS · 영상 갤러리 헤드"
            description="‘NS홈쇼핑이 담은 대라천 침향’ 영상 갤러리 위에 노출되는 키커·제목·소개문구."
            onSave={() => savePartial('nsHead', nsHead, 'nsHead')}
            saving={saving === 'nsHead'}
          >
            <div className="space-y-5">
              <LabeledInput
                label="키커 (kicker, 위쪽 작은 라벨)"
                value={nsHead.kicker}
                onChange={(v) => setNsHead({ ...nsHead, kicker: v })}
              />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput
                  label="제목 — 일반 부분"
                  value={nsHead.titleLead}
                  onChange={(v) => setNsHead({ ...nsHead, titleLead: v })}
                  hint="예: ‘NS홈쇼핑이 담은 ’ (뒤에 강조어가 붙음)"
                />
                <LabeledInput
                  label="제목 — 강조 부분 (em)"
                  value={nsHead.titleEmphasis}
                  onChange={(v) => setNsHead({ ...nsHead, titleEmphasis: v })}
                  hint="예: ‘대라천 침향’"
                />
              </div>
              <LabeledTextarea
                label="소개문구 (lede)"
                value={nsHead.lede}
                onChange={(v) => setNsHead({ ...nsHead, lede: v })}
                rows={4}
              />
            </div>
          </SectionCard>

          {/* 4. NS Sold-Out — 매진 배너 */}
          <SectionCard
            title="NS · 완판(Sold-Out) 배너"
            description="영상 갤러리 위쪽에 노출되는 매진 인증 배너. 좌측 매진 이미지 + 우측 카피."
            onSave={() => savePartial('nsSoldOut', nsSoldOut, 'nsSoldOut')}
            saving={saving === 'nsSoldOut'}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput
                  label="이미지 URL"
                  value={nsSoldOut.imageUrl}
                  onChange={(v) => setNsSoldOut({ ...nsSoldOut, imageUrl: v })}
                  hint="예: /images/ns-broadcast-soldout.jpg 또는 Vercel Blob URL"
                />
                <LabeledInput
                  label="이미지 alt (대체 텍스트)"
                  value={nsSoldOut.imageAlt}
                  onChange={(v) => setNsSoldOut({ ...nsSoldOut, imageAlt: v })}
                />
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <LabeledInput
                  label="스탬프 라벨 (이미지 위 회전 배지, 빈 값이면 숨김)"
                  value={nsSoldOut.stampLabel}
                  onChange={(v) => setNsSoldOut({ ...nsSoldOut, stampLabel: v })}
                />
                <LabeledInput
                  label="키커 (kicker)"
                  value={nsSoldOut.kicker}
                  onChange={(v) => setNsSoldOut({ ...nsSoldOut, kicker: v })}
                />
              </div>
              <LabeledTextarea
                label="제목 (HTML, em/br 사용 가능)"
                value={nsSoldOut.titleHtml}
                onChange={(v) => setNsSoldOut({ ...nsSoldOut, titleHtml: v })}
                rows={3}
                hint="예: NS홈쇼핑 창립 25주년 <em>대고객 감사 프로젝트</em><br />..."
              />
              <LabeledTextarea
                label="본문 (body)"
                value={nsSoldOut.body}
                onChange={(v) => setNsSoldOut({ ...nsSoldOut, body: v })}
                rows={4}
              />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <LabeledInput label="Fact — 채널" value={nsSoldOut.factChannel} onChange={(v) => setNsSoldOut({ ...nsSoldOut, factChannel: v })} />
                <LabeledInput label="Fact — 구성" value={nsSoldOut.factComposition} onChange={(v) => setNsSoldOut({ ...nsSoldOut, factComposition: v })} />
                <LabeledInput label="Fact — 결과" value={nsSoldOut.factResult} onChange={(v) => setNsSoldOut({ ...nsSoldOut, factResult: v })} />
              </div>
            </div>
          </SectionCard>

          {/* 5. NS Videos — 영상 4편 메타 (URL 변경 가능) */}
          <SectionCard
            title="NS · 영상 4편 메타"
            description="갤러리 카드 텍스트와 mp4 URL. URL 은 Vercel Blob 에 업로드된 자체 호스팅 mp4 만 사용하세요 (외부 CDN 금지)."
            onSave={() => savePartial('nsVideos', nsVideos, 'nsVideos')}
            saving={saving === 'nsVideos'}
          >
            <div className="space-y-6">
              {nsVideos.length === 0 && (
                <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  영상 데이터가 비어있습니다 — 현재는 코드 fallback (Blob URL 4개) 으로 노출됩니다. 변경하려면 아래 폼으로 추가/저장하세요.
                </p>
              )}
              {nsVideos.map((v, i) => (
                <div key={v.id} className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-widest text-gray-500">#{i + 1} · {v.id}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <LabeledInput label="키커 (예: SHOWROOM, OPENING …)" value={v.kicker} onChange={(val) => setNsVideos(nsVideos.map((it, idx) => idx === i ? { ...it, kicker: val } : it))} />
                      <LabeledInput label="제목" value={v.title} onChange={(val) => setNsVideos(nsVideos.map((it, idx) => idx === i ? { ...it, title: val } : it))} />
                    </div>
                    <LabeledInput
                      label="영상 URL (mp4)"
                      value={v.url}
                      onChange={(val) => setNsVideos(nsVideos.map((it, idx) => idx === i ? { ...it, url: val } : it))}
                      hint="Vercel Blob URL 권장 (외부 CDN 금지)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
