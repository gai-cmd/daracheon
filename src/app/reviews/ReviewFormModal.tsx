'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProductOption {
  id: string;
  name: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const AGE_OPTIONS = [
  { value: '', label: '선택 안 함' },
  { value: '20대', label: '20대' },
  { value: '30대', label: '30대' },
  { value: '40대', label: '40대' },
  { value: '50대', label: '50대' },
  { value: '60대 이상', label: '60대 이상' },
];

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" role="group" aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star}점`}
          className="text-2xl transition-colors focus:outline-none"
        >
          <span
            className={
              star <= (hovered || value)
                ? 'text-amber-400'
                : 'text-neutral-300'
            }
          >
            ★
          </span>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-neutral-500 self-center">{value}점</span>
      )}
    </div>
  );
}

export default function ReviewFormModal() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // 폼 상태
  const [author, setAuthor] = useState('');
  const [age, setAge] = useState('');
  const [product, setProduct] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 제품 목록 fetch
  useEffect(() => {
    if (!open) return;
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: { products?: ProductOption[] }) => {
        if (Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.products.length > 0 && !product) {
            setProduct(data.products[0].name);
          }
        }
      })
      .catch(() => {
        // 실패 시 정적 목록 사용
        const fallback: ProductOption[] = [
          { id: 'p1', name: '침향 오일 캡슐' },
          { id: 'p2', name: '침향단 (환)' },
          { id: 'p3', name: '침향 선향' },
          { id: 'p4', name: '침향수' },
          { id: 'p5', name: '침향차' },
        ];
        setProducts(fallback);
        if (!product) setProduct(fallback[0].name);
      });
  // product을 deps에 포함하면 무한루프 — 의도적으로 제외
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ESC 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  function resetForm() {
    setAuthor('');
    setAge('');
    setProduct(products[0]?.name ?? '');
    setRating(0);
    setTitle('');
    setContent('');
    setSubmitState('idle');
    setErrorMsg('');
  }

  function handleClose() {
    setOpen(false);
    if (submitState !== 'submitting') resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!author.trim()) { setErrorMsg('이름을 입력해주세요.'); return; }
    if (!product) { setErrorMsg('제품을 선택해주세요.'); return; }
    if (rating < 1) { setErrorMsg('별점을 선택해주세요.'); return; }
    if (!title.trim()) { setErrorMsg('제목을 입력해주세요.'); return; }
    if (content.trim().length < 10) { setErrorMsg('내용은 최소 10자 이상 입력해주세요.'); return; }

    setSubmitState('submitting');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, age, product, rating, title, content }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? '서버 오류가 발생했습니다.');
      }
      setSubmitState('success');
      // 3초 후 자동 닫힘
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setErrorMsg(msg);
      setSubmitState('error');
    }
  }

  return (
    <>
      {/* 리뷰 작성하기 버튼 (우측 하단 고정) */}
      <button
        onClick={() => { resetForm(); setOpen(true); }}
        className="fixed bottom-8 right-8 z-40 inline-flex items-center gap-2 px-5 py-3 bg-[#0a0b10] text-white text-sm font-medium tracking-wider shadow-lg hover:bg-neutral-800 transition-colors"
        aria-label="리뷰 작성하기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        리뷰 작성하기
      </button>

      {/* 모달 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="relative w-full max-w-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="font-serif text-xl">리뷰 작성</h2>
                <p className="text-xs text-neutral-400 mt-0.5">소중한 후기를 남겨주세요</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 성공 화면 */}
            {submitState === 'success' ? (
              <div className="px-8 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-3">리뷰가 접수되었습니다</h3>
                <p className="text-sm text-neutral-500 leading-7">
                  소중한 후기 감사드립니다.<br />
                  관리자 검토 후 <span className="text-neutral-700 font-medium">영업일 기준 1-2일 이내</span> 게시됩니다.
                </p>
                <p className="text-xs text-neutral-400 mt-4">3초 후 자동으로 닫힙니다.</p>
              </div>
            ) : (
              /* 폼 */
              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                {/* 안내 문구 */}
                <div className="bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 leading-6">
                  작성하신 리뷰는 관리자 승인 후 게시됩니다 (영업일 기준 1-2일 소요)
                </div>

                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    이름 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    maxLength={20}
                    placeholder="홍*동"
                    className="w-full px-3 py-2.5 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* 나이대 (optional) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    나이대 <span className="text-neutral-400 text-xs font-normal">(선택)</span>
                  </label>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
                  >
                    {AGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 구매한 제품 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    구매한 제품 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
                  >
                    {products.length === 0 && (
                      <option value="">불러오는 중...</option>
                    )}
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* 별점 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    별점 <span className="text-red-400">*</span>
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    제목 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder="한 줄로 요약해주세요"
                    className="w-full px-3 py-2.5 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    내용 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="제품 사용 경험을 자세히 알려주세요 (최소 10자)"
                    className="w-full px-3 py-2.5 border border-neutral-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
                  />
                  <p className="text-right text-xs text-neutral-400 mt-1">{content.length} / 2000</p>
                </div>

                {/* 에러 메시지 */}
                {errorMsg && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 border border-red-100">
                    {errorMsg}
                  </p>
                )}

                {/* 제출 버튼 */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitState === 'submitting'}
                    className="w-full py-3 bg-[#0a0b10] text-white text-sm font-medium tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitState === 'submitting' ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>
                        제출 중...
                      </span>
                    ) : '리뷰 제출하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
