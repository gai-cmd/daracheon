'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import DarkModeToggle from '@/components/admin/DarkModeToggle';

const pageTitles: Record<string, string> = {
  '/admin': '대시보드',
  '/admin/products': '제품 관리',
  '/admin/reviews': '리뷰 관리',
  '/admin/inquiries': '문의 관리',
  '/admin/media': '미디어 관리',
  '/admin/broadcasts': '홈쇼핑 방송',
  '/admin/faq': 'FAQ 관리',
  '/admin/settings': '설정',
};

const MODULE_LABELS: Record<string, string> = {
  products: '제품',
  inquiries: '문의',
  reviews: '리뷰',
  media: '미디어',
  broadcasts: '홈쇼핑',
  faq: 'FAQ',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(
    ([key]) => pathname.startsWith(key) && key !== '/admin'
  );
  return match ? match[1] : '관리자';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface SearchResults {
  products: SearchResultItem[];
  inquiries: SearchResultItem[];
  reviews: SearchResultItem[];
  media: SearchResultItem[];
  broadcasts: SearchResultItem[];
  faq: SearchResultItem[];
}

interface SearchResponse {
  query: string;
  results: SearchResults;
  total: number;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const today = formatDate(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl+K / Cmd+K 단축키
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const mod = isMac() ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setSearchOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  // 외부 클릭 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 실행 (debounce)
  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults(null);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setSearchError(body.error ?? '검색 실패');
        setDropdownOpen(true);
        return;
      }
      const data = (await res.json()) as SearchResponse;
      setSearchResults(data);
      setDropdownOpen(true);
    } catch {
      setSearchError('네트워크 오류가 발생했습니다.');
      setDropdownOpen(true);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(val);
    }, 300);
  }

  function handleResultClick(href: string) {
    setDropdownOpen(false);
    setSearchQuery('');
    setSearchResults(null);
    router.push(href);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('[AdminHeader] logout error:', error);
      setLoggingOut(false);
    }
  }

  const hasResults =
    searchResults !== null &&
    Object.values(searchResults.results).some((arr) => arr.length > 0);

  const shortcut = isMac() ? '⌘K' : 'Ctrl K';

  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 lg:px-8">
      {/* 왼쪽: 페이지 제목 */}
      <div className="flex min-w-0 items-center gap-4 pl-12 lg:pl-0">
        <h1 className="shrink-0 font-serif text-lg font-semibold text-gray-900">{title}</h1>

        {/* 검색바 — sm 이상에서 노출 */}
        <div ref={searchRef} className="relative hidden sm:block">
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
              dropdownOpen
                ? 'border-gold-400 ring-1 ring-gold-300'
                : 'border-gray-200 hover:border-gray-300'
            } bg-gray-50`}
          >
            {/* 돋보기 아이콘 */}
            <svg
              className="h-4 w-4 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => {
                if (searchQuery.length >= 2) setDropdownOpen(true);
              }}
              placeholder="검색..."
              className="w-44 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none lg:w-56"
            />
            {/* 단축키 힌트 */}
            {!searchQuery && (
              <kbd className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-mono text-gray-400 shadow-sm lg:inline">
                {shortcut}
              </kbd>
            )}
            {/* 로딩 스피너 */}
            {searching && (
              <svg
                className="h-4 w-4 shrink-0 animate-spin text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
          </div>

          {/* 검색 드롭다운 */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl lg:w-96">
              {searchError ? (
                <p className="px-4 py-3 text-sm text-red-500">{searchError}</p>
              ) : !hasResults ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  {searchQuery.length < 2
                    ? '2자 이상 입력하세요.'
                    : `"${searchResults?.query ?? searchQuery}"에 대한 결과가 없습니다.`}
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {(
                    Object.entries(searchResults!.results) as [
                      keyof SearchResults,
                      SearchResultItem[],
                    ][]
                  )
                    .filter(([, items]) => items.length > 0)
                    .map(([module, items]) => (
                      <div key={module}>
                        <div className="sticky top-0 bg-gray-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {MODULE_LABELS[module] ?? module}{' '}
                          <span className="font-normal text-gray-400">{items.length}건</span>
                        </div>
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleResultClick(item.href)}
                            className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          >
                            <span className="line-clamp-1 text-sm font-medium text-gray-800">
                              {highlight(item.title, searchQuery)}
                            </span>
                            {item.subtitle && (
                              <span className="line-clamp-1 mt-0.5 text-xs text-gray-400">
                                {highlight(item.subtitle, searchQuery)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
                    총 {searchResults!.total}건
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 모바일 검색 아이콘 버튼 */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-700 sm:hidden"
          aria-label="검색"
          onClick={() => {
            setSearchOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </button>
      </div>

      {/* 모바일 전체 검색 오버레이 */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 z-50 flex h-16 items-center gap-3 bg-white px-4 sm:hidden">
          <div ref={searchRef} className="relative flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-gold-400 bg-gray-50 px-3 py-1.5 ring-1 ring-gold-300">
              <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="검색..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {searching && (
                <svg className="h-4 w-4 shrink-0 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
            </div>
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {searchError ? (
                  <p className="px-4 py-3 text-sm text-red-500">{searchError}</p>
                ) : !hasResults ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    {searchQuery.length < 2
                      ? '2자 이상 입력하세요.'
                      : `"${searchResults?.query ?? searchQuery}"에 대한 결과가 없습니다.`}
                  </p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {(Object.entries(searchResults!.results) as [keyof SearchResults, SearchResultItem[]][])
                      .filter(([, items]) => items.length > 0)
                      .map(([module, items]) => (
                        <div key={module}>
                          <div className="sticky top-0 bg-gray-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {MODULE_LABELS[module] ?? module}{' '}
                            <span className="font-normal text-gray-400">{items.length}건</span>
                          </div>
                          {items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                handleResultClick(item.href);
                                setSearchOpen(false);
                              }}
                              className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-gray-50 focus:outline-none"
                            >
                              <span className="line-clamp-1 text-sm font-medium text-gray-800">
                                {highlight(item.title, searchQuery)}
                              </span>
                              {item.subtitle && (
                                <span className="line-clamp-1 mt-0.5 text-xs text-gray-400">
                                  {highlight(item.subtitle, searchQuery)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
                      총 {searchResults!.total}건
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setDropdownOpen(false);
              setSearchQuery('');
              setSearchResults(null);
            }}
            className="shrink-0 text-sm text-gray-500 hover:text-gray-700"
          >
            취소
          </button>
        </div>
      )}

      {/* 오른쪽: 날짜 + 사용자 메뉴 */}
      <div className="flex items-center gap-4">
        <time className="hidden text-sm text-gray-500 sm:block">{today}</time>

        <DarkModeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full px-1 py-1 transition hover:bg-gray-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white">
              관
            </span>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">관리자</span>
            <span className="hidden text-xs text-gray-400 sm:block">▾</span>
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-hidden="true"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              >
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ↗ 사이트 보기
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {loggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
