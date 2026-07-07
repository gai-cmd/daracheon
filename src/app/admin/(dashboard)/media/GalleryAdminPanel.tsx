'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUploadField from '@/components/admin/ImageUploadField';
import VideoUploadField from '@/components/admin/VideoUploadField';
import { saveAdminPage } from '@/lib/adminSave';

/* ─── Types ─────────────────────────────────────────────
   영상은 pages.json → process.productionVideos.items 단일 출처.
   사진은 media.json (type='photo') 단일 출처.
   ──────────────────────────────────────────────────────── */
interface PhotoItem {
  id: string;
  type: 'photo';
  title: string;
  source: string;
  date: string;
  image: string;
  excerpt: string;
  url: string;
}

interface ProductionVideo {
  src: string;
  title: string;
  date?: string;
  thumbnail?: string;
}

interface ProductionVideosBlock {
  num: string;
  tag: string;
  title: string;
  body: string;
  items: ProductionVideo[];
}

const DEFAULT_VIDEOS_BLOCK: ProductionVideosBlock = {
  num: '06',
  tag: 'Videos',
  title: '생산과정 — 농장 현장',
  body: '베트남 5개 지역 직영 농장에서 식목부터 25년 자연 숙성까지, Aquilaria Agallocha Roxburgh의 하루를 영상으로 공개합니다.',
  items: [],
};

const emptyPhoto = (): PhotoItem => ({
  id: '',
  type: 'photo',
  title: '',
  source: '대라천 공식',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  excerpt: '',
  url: '',
});

const emptyVideo = (): ProductionVideo => ({
  src: '',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  thumbnail: '',
});

const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [el] = copy.splice(from, 1);
  copy.splice(to, 0, el);
  return copy;
};

/* ─── Component ──────────────────────────────────────── */
export default function GalleryAdminPanel() {
  const [activeTab, setActiveTab] = useState<'video' | 'photo'>('video');
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingVideos, setSavingVideos] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 사진 (media.json)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [isPhotoAddMode, setIsPhotoAddMode] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);

  // 영상 (pages.json → process.productionVideos)
  const [videosBlock, setVideosBlock] = useState<ProductionVideosBlock>(DEFAULT_VIDEOS_BLOCK);
  const [editingVideoIdx, setEditingVideoIdx] = useState<number | null>(null);
  const [editingVideo, setEditingVideo] = useState<ProductionVideo | null>(null);
  const [isVideoAddMode, setIsVideoAddMode] = useState(false);
  const [deleteVideoIdx, setDeleteVideoIdx] = useState<number | null>(null);

  /* ─── Toast auto-hide ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── 초기 로드 ─── */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mediaRes, pagesRes] = await Promise.all([
        fetch('/api/admin/media'),
        fetch(`/api/admin/pages?_=${Date.now()}`, { cache: 'no-store' }),
      ]);
      const mediaJson = await mediaRes.json();
      const allMedia = (mediaJson.media || mediaJson.items || mediaJson || []) as Array<PhotoItem | (PhotoItem & { type: string })>;
      setPhotos(allMedia.filter((m) => m.type === 'photo') as PhotoItem[]);

      if (pagesRes.ok) {
        const pagesJson = (await pagesRes.json()) as { pages?: { process?: { productionVideos?: ProductionVideosBlock } } };
        const block = pagesJson.pages?.process?.productionVideos;
        if (block) {
          setVideosBlock({
            ...DEFAULT_VIDEOS_BLOCK,
            ...block,
            items: (block.items ?? []).map((it) => ({
              src: it.src ?? '',
              title: it.title ?? '',
              date: it.date ?? '',
              thumbnail: it.thumbnail ?? '',
            })),
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
      setToast('갤러리 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ─── 사진 (media.json) handlers ─── */
  async function savePhoto() {
    if (!editingPhoto) return;
    setSavingPhoto(true);
    try {
      const method = isPhotoAddMode ? 'POST' : 'PUT';
      const payload = isPhotoAddMode ? { ...editingPhoto, id: `p${Date.now()}` } : editingPhoto;
      const res = await fetch('/api/admin/media', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setToast(isPhotoAddMode ? '사진이 추가되었습니다.' : '사진이 수정되었습니다.');
      setEditingPhoto(null);
      setIsPhotoAddMode(false);
      await fetchAll();
    } catch (err) {
      console.error('Photo save error:', err);
      setToast('저장에 실패했습니다.');
    } finally {
      setSavingPhoto(false);
    }
  }

  async function deletePhoto(id: string) {
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setToast('사진이 삭제되었습니다.');
      setDeletePhotoId(null);
      // 즉시 로컬 반영 — blob 전파 지연(수 초) 동안 재조회하면 삭제 전 데이터가
      // 다시 보여 "삭제 안 됨" 으로 오인된다 (2026-07-07). 재조회는 하지 않는다.
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Photo delete error:', err);
      setToast('삭제에 실패했습니다.');
    }
  }

  /* ─── 영상 (pages.process.productionVideos.items) handlers ───
     영상은 개별 항목 단위가 아니라 productionVideos 블록 전체를
     pages.json 의 process.productionVideos 에 PUT 으로 덮어써야 한다.
     → 현재 process 객체를 fetch → productionVideos 만 교체 → PUT.
     ────────────────────────────────────────────────────────── */
  async function persistVideos(nextBlock: ProductionVideosBlock) {
    setSavingVideos(true);
    try {
      const res = await fetch(`/api/admin/pages?_=${Date.now()}`, { cache: 'no-store' });
      const body = res.ok ? ((await res.json()) as { pages?: { process?: Record<string, unknown> } }) : { pages: {} };
      const currentProcess = body.pages?.process ?? {};
      const merged = { ...currentProcess, productionVideos: nextBlock };
      const result = await saveAdminPage('process', merged);
      if (!result.ok) {
        setToast(`영상 저장 실패: ${result.msg}`);
        return false;
      }
      setVideosBlock(nextBlock);
      setToast('영상 저장 완료.');
      return true;
    } catch (err) {
      console.error('Video save error:', err);
      setToast(`영상 저장 실패: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setSavingVideos(false);
    }
  }

  async function saveVideo() {
    if (!editingVideo) return;
    if (!editingVideo.src.trim()) {
      setToast('영상 파일(URL)이 비어 있습니다.');
      return;
    }
    let nextItems: ProductionVideo[];
    if (isVideoAddMode) {
      nextItems = [...videosBlock.items, editingVideo];
    } else if (editingVideoIdx !== null) {
      nextItems = [...videosBlock.items];
      nextItems[editingVideoIdx] = editingVideo;
    } else {
      return;
    }
    const ok = await persistVideos({ ...videosBlock, items: nextItems });
    if (ok) {
      setEditingVideo(null);
      setEditingVideoIdx(null);
      setIsVideoAddMode(false);
    }
  }

  async function deleteVideo(idx: number) {
    const nextItems = videosBlock.items.filter((_, i) => i !== idx);
    const ok = await persistVideos({ ...videosBlock, items: nextItems });
    if (ok) setDeleteVideoIdx(null);
  }

  async function moveVideo(idx: number, dir: -1 | 1) {
    const nextItems = moveItem(videosBlock.items, idx, idx + dir);
    if (nextItems === videosBlock.items) return;
    await persistVideos({ ...videosBlock, items: nextItems });
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 font-body">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-32 rounded bg-gray-200 animate-pulse mb-2" />
              <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="h-10 w-36 rounded-xl bg-gray-200 animate-pulse" />
          </div>
          <div className="flex gap-2 mb-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-10 w-20 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-body">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-5 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 font-serif">영상・사진 갤러리 관리</h1>
            <p className="text-sm text-neutral-500 mt-1">
              <span className="font-mono">/media</span> 갤러리 탭의 두 섹션(01 Videos · 02 Photos) 콘텐츠를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'video') {
                setEditingVideo(emptyVideo());
                setEditingVideoIdx(null);
                setIsVideoAddMode(true);
              } else {
                setEditingPhoto(emptyPhoto());
                setIsPhotoAddMode(true);
              }
            }}
            className="adm-btn-primary px-5 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {activeTab === 'video' ? '새 영상 추가' : '새 사진 추가'}
          </button>
        </div>

        {/* Type Tabs (영상 / 사진) */}
        <div className="flex gap-2 mb-8">
          {(['video', 'photo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                activeTab === t
                  ? 'bg-[#1F1F1F] text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t === 'video' ? '영상' : '사진'}
              <span className="ml-1.5 text-xs opacity-70">
                ({t === 'video' ? videosBlock.items.length : photos.length})
              </span>
            </button>
          ))}
        </div>

        {/* ─── VIDEO TAB ─── */}
        {activeTab === 'video' && (
          <VideoGrid
            items={videosBlock.items}
            saving={savingVideos}
            onEdit={(idx) => {
              setEditingVideo({ ...videosBlock.items[idx] });
              setEditingVideoIdx(idx);
              setIsVideoAddMode(false);
            }}
            onDelete={deleteVideo}
            onMove={moveVideo}
            deleteConfirmIdx={deleteVideoIdx}
            setDeleteConfirmIdx={setDeleteVideoIdx}
          />
        )}

        {/* ─── PHOTO TAB ─── */}
        {activeTab === 'photo' && (
          <PhotoGrid
            items={photos}
            onEdit={(item) => {
              setEditingPhoto({ ...item });
              setIsPhotoAddMode(false);
            }}
            onDelete={deletePhoto}
            deleteConfirmId={deletePhotoId}
            setDeleteConfirmId={setDeletePhotoId}
          />
        )}
      </div>

      {/* ─── VIDEO Edit / Add Modal ─── */}
      {editingVideo && (
        <Modal
          title={isVideoAddMode ? '새 영상 추가' : '영상 수정'}
          onClose={() => { setEditingVideo(null); setEditingVideoIdx(null); setIsVideoAddMode(false); }}
        >
          <div className="space-y-4">
            <Field label="제목">
              <input
                type="text"
                value={editingVideo.title}
                onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                placeholder="영상 제목"
              />
            </Field>

            <Field label="촬영일 (YYYY-MM-DD)">
              <input
                type="date"
                value={editingVideo.date ?? ''}
                onChange={(e) => setEditingVideo({ ...editingVideo, date: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
              <p className="mt-1 text-[11px] text-neutral-400">/media 갤러리에 표시되는 날짜.</p>
            </Field>

            <Field label="영상 파일 (mp4 / webm / mov)">
              <VideoUploadField
                value={editingVideo.src}
                onChange={(url) => setEditingVideo({ ...editingVideo, src: url })}
              />
            </Field>

            <Field label="썸네일 (선택)">
              <ImageUploadField
                value={editingVideo.thumbnail ?? ''}
                onChange={(url) => setEditingVideo({ ...editingVideo, thumbnail: url })}
                subdir="media"
              />
              <p className="mt-1 text-[11px] text-neutral-400">비우면 영상 첫 프레임을 자동 사용.</p>
            </Field>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
            <button
              onClick={() => { setEditingVideo(null); setEditingVideoIdx(null); setIsVideoAddMode(false); }}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={saveVideo}
              disabled={!editingVideo.title.trim() || savingVideos}
              className="adm-btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingVideos ? '저장 중...' : isVideoAddMode ? '추가' : '저장'}
            </button>
          </div>
        </Modal>
      )}

      {/* ─── PHOTO Edit / Add Modal ─── */}
      {editingPhoto && (
        <Modal
          title={isPhotoAddMode ? '새 사진 추가' : '사진 수정'}
          onClose={() => { setEditingPhoto(null); setIsPhotoAddMode(false); }}
        >
          <div className="space-y-4">
            <Field label="제목">
              <input
                type="text"
                value={editingPhoto.title}
                onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                placeholder="사진 제목"
              />
            </Field>

            <Field label="출처">
              <input
                type="text"
                value={editingPhoto.source}
                onChange={(e) => setEditingPhoto({ ...editingPhoto, source: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                placeholder="출처"
              />
            </Field>

            <Field label="날짜">
              <input
                type="date"
                value={editingPhoto.date}
                onChange={(e) => setEditingPhoto({ ...editingPhoto, date: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
            </Field>

            <ImageUploadField
              label="이미지"
              value={editingPhoto.image}
              onChange={(url) => setEditingPhoto({ ...editingPhoto, image: url })}
              subdir="media"
            />

            <Field label="요약">
              <textarea
                value={editingPhoto.excerpt}
                onChange={(e) => setEditingPhoto({ ...editingPhoto, excerpt: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                placeholder="사진 요약..."
              />
            </Field>

            <Field label="링크 URL (선택)">
              <input
                type="text"
                value={editingPhoto.url}
                onChange={(e) => setEditingPhoto({ ...editingPhoto, url: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                placeholder="/path or https://..."
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
            <button
              onClick={() => { setEditingPhoto(null); setIsPhotoAddMode(false); }}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={savePhoto}
              disabled={!editingPhoto.title.trim() || savingPhoto}
              className="adm-btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingPhoto ? '저장 중...' : isPhotoAddMode ? '추가' : '저장'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

function VideoGrid({
  items, saving, onEdit, onDelete, onMove, deleteConfirmIdx, setDeleteConfirmIdx,
}: {
  items: ProductionVideo[];
  saving: boolean;
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  deleteConfirmIdx: number | null;
  setDeleteConfirmIdx: (idx: number | null) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 px-6 py-20 text-center text-neutral-400 text-sm">
        등록된 영상이 없습니다.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((v, idx) => {
        const thumb = v.thumbnail || '';
        return (
          <div
            key={`${v.src}-${idx}`}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="relative h-48 overflow-hidden bg-neutral-900">
              {thumb ? (
                <Image src={thumb} alt={v.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-neutral-500 text-xs">썸네일 없음</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute top-3 left-3 px-2.5 py-1 text-[0.6rem] tracking-wider uppercase rounded-md font-semibold adm-badge adm-badge-luxury">
                {String(idx + 1).padStart(2, '0')} 영상
              </span>
            </div>

            <div className="p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1.5 line-clamp-2 leading-snug">{v.title || '(제목 없음)'}</h3>
              <div className="flex items-center gap-2 text-[0.7rem] text-neutral-400 mb-3">
                <span>{v.date || '날짜 미지정'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1 leading-relaxed mb-4 break-all font-mono">{v.src}</p>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onMove(idx, -1)}
                  disabled={idx === 0 || saving}
                  className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="위로"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => onMove(idx, 1)}
                  disabled={idx === items.length - 1 || saving}
                  className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="아래로"
                >
                  ▼
                </button>
                <button onClick={() => onEdit(idx)} className="adm-btn-secondary flex-1 px-3">수정</button>
                {deleteConfirmIdx === idx ? (
                  <div className="flex gap-1">
                    <button onClick={() => onDelete(idx)} className="adm-btn-destructive-solid px-3" disabled={saving}>확인</button>
                    <button onClick={() => setDeleteConfirmIdx(null)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">취소</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirmIdx(idx)} className="adm-btn-destructive px-3">삭제</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PhotoGrid({
  items, onEdit, onDelete, deleteConfirmId, setDeleteConfirmId,
}: {
  items: PhotoItem[];
  onEdit: (item: PhotoItem) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 px-6 py-20 text-center text-neutral-400 text-sm">
        등록된 사진이 없습니다.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="relative h-48 overflow-hidden">
            {item.image && <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute top-3 left-3 px-2.5 py-1 text-[0.6rem] tracking-wider uppercase rounded-md font-semibold adm-badge adm-badge-default">사진</span>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5 line-clamp-2 leading-snug">{item.title}</h3>
            <div className="flex items-center gap-2 text-[0.7rem] text-neutral-400 mb-3">
              <span>{item.source}</span>
              <span className="text-neutral-200">|</span>
              <span>{item.date}</span>
            </div>
            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">{item.excerpt}</p>
            <div className="flex gap-2">
              <button onClick={() => onEdit(item)} className="adm-btn-secondary flex-1 px-3">수정</button>
              {deleteConfirmId === item.id ? (
                <div className="flex gap-1">
                  <button onClick={() => onDelete(item.id)} className="adm-btn-destructive-solid px-3">확인</button>
                  <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">취소</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirmId(item.id)} className="adm-btn-destructive px-3">삭제</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold text-neutral-900 font-serif mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

