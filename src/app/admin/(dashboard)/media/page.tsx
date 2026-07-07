'use client';

import { useEffect, useState } from 'react';
import FarmStoryAdminPanel from '../pages/process/page';
import GalleryAdminPanel from './GalleryAdminPanel';
import SubmissionsAdminPanel from './SubmissionsAdminPanel';

const TABS = [
  { key: 'story' as const, label: '침향 농장 이야기' },
  { key: 'gallery' as const, label: '영상・사진 갤러리 관리' },
  { key: 'submissions' as const, label: '현장 업로드 승인' },
];

export default function MediaAdminPage() {
  const [activeTab, setActiveTab] = useState<'story' | 'gallery' | 'submissions'>('story');
  const [pendingCount, setPendingCount] = useState(0);

  // 승인 대기 건수 배지 — 탭 진입 전에도 보이도록 헤더 로드 시 1회 조회.
  useEffect(() => {
    fetch('/api/admin/media-submissions', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.pendingCount === 'number') setPendingCount(j.pendingCount);
      })
      .catch(() => {});
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 탭 헤더 */}
      <div className="border-b border-gray-200 bg-white px-6 pt-6">
        <h1 className="mb-1 text-2xl font-bold text-neutral-900 font-serif">침향 농장 이야기 관리</h1>
        <p className="mb-4 text-sm text-neutral-500">
          공개 페이지 <span className="font-mono">/media</span> 의 침향 농장 이야기와 갤러리, 베트남 현장
          업로드 승인을 관리합니다.
        </p>
        <div className="flex gap-0">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
              {key === 'submissions' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'story' ? (
        <FarmStoryAdminPanel />
      ) : activeTab === 'gallery' ? (
        <GalleryAdminPanel />
      ) : (
        <SubmissionsAdminPanel />
      )}
    </div>
  );
}
