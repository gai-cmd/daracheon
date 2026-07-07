'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { extractJpegExif, type ExifMeta } from '@/lib/exif-client';

/* ─── i18n ─────────────────────────────────────────────── */

const STRINGS = {
  ko: {
    kicker: 'ZOEL LIFE · Field Upload',
    title: '현장 사진·영상 업로드',
    hello: (name: string) => `${name} 님`,
    logout: '로그아웃',
    pickFiles: '사진 / 영상 선택',
    pickHint: '카메라 촬영 또는 갤러리에서 여러 개 선택 가능',
    titleLabel: '제목 (필수)',
    titlePlaceholder: '예: 하띤 농장 침향 채취 작업',
    noteLabel: '메모 (선택)',
    notePlaceholder: '현장 상황, 작업 내용 등',
    gpsWaiting: '위치 확인 중…',
    gpsDenied: '위치 권한이 거부되었습니다. 사진 메타데이터의 GPS 를 사용합니다.',
    gpsOk: (acc: number) => `기기 위치 확보 (±${Math.round(acc)}m)`,
    gpsRetry: '위치 다시 가져오기',
    exifGps: '사진 메타데이터 GPS 사용',
    capturedAt: '촬영 시각',
    autoMeta: '자동 수집 정보',
    submit: '업로드 및 제출',
    submitting: (p: number) => `업로드 중… ${p}%`,
    saving: '제출 저장 중…',
    needFiles: '파일을 선택해주세요.',
    needTitle: '제목을 입력해주세요.',
    done: '제출 완료! 관리자 승인 후 사이트에 게시됩니다.',
    failed: '업로드에 실패했습니다. 네트워크 확인 후 다시 시도해주세요.',
    tooBigFallback: '이 파일은 크기가 커서 업로드할 수 없습니다.',
    mySubmissions: '내 제출 내역',
    status: { pending: '승인 대기', approved: '게시됨', rejected: '반려' } as Record<string, string>,
    rejectReason: '반려 사유',
    empty: '아직 제출한 내역이 없습니다.',
    removeFile: '제거',
    weather: '날씨',
  },
  vi: {
    kicker: 'ZOEL LIFE · Field Upload',
    title: 'Tải lên ảnh & video hiện trường',
    hello: (name: string) => `Xin chào, ${name}`,
    logout: 'Đăng xuất',
    pickFiles: 'Chọn ảnh / video',
    pickHint: 'Chụp bằng camera hoặc chọn nhiều tệp từ thư viện',
    titleLabel: 'Tiêu đề (bắt buộc)',
    titlePlaceholder: 'VD: Thu hoạch trầm hương tại trang trại Hà Tĩnh',
    noteLabel: 'Ghi chú (tùy chọn)',
    notePlaceholder: 'Tình hình hiện trường, nội dung công việc…',
    gpsWaiting: 'Đang xác định vị trí…',
    gpsDenied: 'Quyền vị trí bị từ chối. Sẽ dùng GPS trong metadata ảnh.',
    gpsOk: (acc: number) => `Đã lấy vị trí thiết bị (±${Math.round(acc)}m)`,
    gpsRetry: 'Lấy lại vị trí',
    exifGps: 'Dùng GPS từ metadata ảnh',
    capturedAt: 'Thời điểm chụp',
    autoMeta: 'Thông tin thu thập tự động',
    submit: 'Tải lên & Gửi',
    submitting: (p: number) => `Đang tải lên… ${p}%`,
    saving: 'Đang lưu…',
    needFiles: 'Vui lòng chọn tệp.',
    needTitle: 'Vui lòng nhập tiêu đề.',
    done: 'Đã gửi! Sau khi quản trị viên duyệt sẽ hiển thị trên website.',
    failed: 'Tải lên thất bại. Kiểm tra mạng và thử lại.',
    tooBigFallback: 'Tệp này quá lớn, không thể tải lên.',
    mySubmissions: 'Lịch sử gửi của tôi',
    status: { pending: 'Chờ duyệt', approved: 'Đã đăng', rejected: 'Bị từ chối' } as Record<string, string>,
    rejectReason: 'Lý do từ chối',
    empty: 'Chưa có mục nào được gửi.',
    removeFile: 'Xóa',
    weather: 'Thời tiết',
  },
} as const;

type Lang = keyof typeof STRINGS;

/* ─── Types ────────────────────────────────────────────── */

interface PickedFile {
  file: File;
  previewUrl: string;
  type: 'photo' | 'video';
  exif: ExifMeta;
  progress: number;
}

interface SubmissionView {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  files: { url: string; type: 'photo' | 'video' }[];
  submittedAt: string;
  capturedAt?: string;
  rejectReason?: string;
  weather?: { tempC: number; text?: string; humidity?: number };
  location?: { lat: number; lng: number; source?: string };
}

interface DeviceLoc {
  lat: number;
  lng: number;
  accuracy: number;
}

const DIRECT_FALLBACK_MAX = 4 * 1024 * 1024;

/* ─── Styles (조엘라이프 디자인 토큰) ───────────────────── */

const card: React.CSSProperties = {
  background: 'var(--lx-ink, #14161f)',
  border: '1px solid rgba(212,168,67,0.22)',
  borderRadius: 'var(--r-md, 16px)',
  padding: '20px 18px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 15px',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  border: '1px solid rgba(212,168,67,0.25)',
  borderRadius: 'var(--r-sm, 10px)',
  fontSize: '1rem',
  outline: 'none',
};

const monoKicker: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: '0.66rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--accent, #b88c2d)',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: 'rgba(212,168,67,0.15)', fg: '#d4a843' },
  approved: { bg: 'rgba(74,103,65,0.3)', fg: '#8fbf82' },
  rejected: { bg: 'rgba(240,114,106,0.15)', fg: '#f0726a' },
};

/* ─── Component ────────────────────────────────────────── */

export default function PartnerUploadClient({ partnerName }: { partnerName: string }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('ko');
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [deviceLoc, setDeviceLoc] = useState<DeviceLoc | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'waiting' | 'ok' | 'denied'>('idle');
  const [busy, setBusy] = useState<'no' | 'uploading' | 'saving'>('no');
  const [overallProgress, setOverallProgress] = useState(0);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionView[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = STRINGS[lang];

  /* 언어 복원 */
  useEffect(() => {
    const saved = localStorage.getItem('partner_lang');
    if (saved === 'vi' || saved === 'ko') setLang(saved);
  }, []);

  const switchLang = (next: Lang) => {
    setLang(next);
    localStorage.setItem('partner_lang', next);
  };

  /* 기기 GPS */
  const requestGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsState('denied');
      return;
    }
    setGpsState('waiting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsState('ok');
      },
      () => setGpsState('denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestGps();
  }, [requestGps]);

  /* 제출 내역 */
  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/partner/submissions', { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/partner/login');
        return;
      }
      const json = await res.json();
      if (Array.isArray(json.submissions)) setSubmissions(json.submissions);
    } catch {
      /* 목록 로드 실패는 치명적이지 않음 */
    }
  }, [router]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  /* 파일 선택 → EXIF 추출 */
  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const next: PickedFile[] = [];
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const exif = isVideo ? {} : await extractJpegExif(file);
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'photo',
        exif,
        progress: 0,
      });
    }
    setPicked((prev) => [...prev, ...next]);
    setMessage(null);
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setPicked((prev) => {
      URL.revokeObjectURL(prev[idx]?.previewUrl ?? '');
      return prev.filter((_, i) => i !== idx);
    });
  };

  /* 자동 수집 메타 요약 */
  const exifGps = useMemo(() => {
    const withGps = picked.find((p) => typeof p.exif.lat === 'number' && typeof p.exif.lng === 'number');
    return withGps ? { lat: withGps.exif.lat!, lng: withGps.exif.lng! } : null;
  }, [picked]);

  const capturedAt = useMemo(() => {
    const exifTimes = picked.map((p) => p.exif.capturedAt).filter(Boolean) as string[];
    if (exifTimes.length > 0) return [...exifTimes].sort()[0];
    if (picked.length === 0) return undefined;
    const earliest = Math.min(...picked.map((p) => p.file.lastModified));
    const d = new Date(earliest);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, [picked]);

  const effectiveLocation = exifGps
    ? { lat: exifGps.lat, lng: exifGps.lng, source: 'exif' as const }
    : deviceLoc
      ? { lat: deviceLoc.lat, lng: deviceLoc.lng, accuracy: deviceLoc.accuracy, source: 'device' as const }
      : undefined;

  /* 업로드 + 제출 */
  const onSubmit = async () => {
    if (busy !== 'no') return;
    if (picked.length === 0) {
      setMessage({ kind: 'err', text: t.needFiles });
      return;
    }
    if (!title.trim()) {
      setMessage({ kind: 'err', text: t.needTitle });
      return;
    }

    setBusy('uploading');
    setMessage(null);
    setOverallProgress(0);

    const totalBytes = picked.reduce((s, p) => s + p.file.size, 0);
    const uploadedFiles: { url: string; type: 'photo' | 'video'; contentType: string; size: number; name?: string }[] = [];

    try {
      let doneBytes = 0;
      for (const p of picked) {
        const safeName = p.file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
        const pathname = `uploads/partner/${Date.now()}-${safeName}`;
        let url: string;
        try {
          const blob = await upload(pathname, p.file, {
            access: 'public',
            handleUploadUrl: '/api/partner/upload',
            multipart: p.file.size > 8 * 1024 * 1024,
            onUploadProgress: ({ percentage }) => {
              const current = doneBytes + (p.file.size * percentage) / 100;
              setOverallProgress(Math.min(99, Math.round((current / totalBytes) * 100)));
            },
          });
          url = blob.url;
        } catch (err) {
          // 클라이언트 직행 업로드 실패 (로컬 dev 등) → 소용량은 서버 경유 폴백
          if (p.file.size <= DIRECT_FALLBACK_MAX) {
            const fd = new FormData();
            fd.append('file', p.file);
            const res = await fetch('/api/partner/upload-direct', { method: 'POST', body: fd });
            const json = await res.json();
            if (!res.ok || !json.success) throw err;
            url = json.url;
          } else {
            throw err;
          }
        }
        doneBytes += p.file.size;
        setOverallProgress(Math.min(99, Math.round((doneBytes / totalBytes) * 100)));
        uploadedFiles.push({
          url,
          type: p.type,
          contentType: p.file.type || 'application/octet-stream',
          size: p.file.size,
          name: p.file.name,
        });
      }

      setBusy('saving');
      const res = await fetch('/api/partner/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          note: note.trim() || undefined,
          files: uploadedFiles,
          location: effectiveLocation,
          capturedAt,
          clientTime: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'submit failed');
      }

      picked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPicked([]);
      setTitle('');
      setNote('');
      setMessage({ kind: 'ok', text: t.done });
      loadSubmissions();
    } catch (err) {
      console.error('[partner] submit failed:', err);
      setMessage({ kind: 'err', text: t.failed });
    } finally {
      setBusy('no');
      setOverallProgress(0);
    }
  };

  const onLogout = async () => {
    await fetch('/api/partner/auth/logout', { method: 'POST' });
    router.replace('/partner/login');
  };

  /* ─── Render ─── */

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={monoKicker}>{t.kicker}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ko', 'vi'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLang(l)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--r-pill, 999px)',
                border: `1px solid ${lang === l ? 'var(--accent, #b88c2d)' : 'rgba(255,255,255,0.2)'}`,
                background: lang === l ? 'rgba(212,168,67,0.15)' : 'transparent',
                color: lang === l ? 'var(--accent-soft, #d4a843)' : 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {l === 'ko' ? '한국어' : 'Việt'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 600, fontFamily: "'Noto Serif KR', serif", margin: 0 }}>
          {t.title}
        </h1>
        <button
          type="button"
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: 0,
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {t.hello(partnerName)} · {t.logout}
        </button>
      </div>

      {/* 업로드 카드 */}
      <div style={{ ...card, display: 'grid', gap: 16 }}>
        {/* 파일 선택 */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onPickFiles}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== 'no'}
            style={{
              width: '100%',
              padding: '18px',
              background: 'rgba(212,168,67,0.08)',
              border: '1.5px dashed rgba(212,168,67,0.45)',
              borderRadius: 'var(--r-md, 16px)',
              color: 'var(--accent-soft, #d4a843)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + {t.pickFiles}
            <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
              {t.pickHint}
            </div>
          </button>
        </div>

        {/* 선택된 파일 미리보기 */}
        {picked.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
            {picked.map((p, i) => (
              <div key={`${p.file.name}-${i}`} style={{ position: 'relative' }}>
                <div
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--r-sm, 10px)',
                    overflow: 'hidden',
                    background: '#1a1d29',
                    border: '1px solid rgba(212,168,67,0.2)',
                    position: 'relative',
                  }}
                >
                  {p.type === 'photo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.previewUrl}
                      alt={p.file.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      src={p.previewUrl}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  {p.type === 'video' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: '1.2rem' }}>▶</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={busy !== 'no'}
                  aria-label={t.removeFile}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: 0,
                    background: '#f0726a',
                    color: '#fff',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 자동 수집 정보 */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--r-sm, 10px)',
            padding: '12px 14px',
            fontSize: '0.8rem',
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <div style={{ ...monoKicker, fontSize: '0.6rem', marginBottom: 6 }}>{t.autoMeta}</div>
          <div>
            📍{' '}
            {exifGps
              ? `${t.exifGps}: ${exifGps.lat.toFixed(5)}, ${exifGps.lng.toFixed(5)}`
              : gpsState === 'ok' && deviceLoc
                ? `${t.gpsOk(deviceLoc.accuracy)}: ${deviceLoc.lat.toFixed(5)}, ${deviceLoc.lng.toFixed(5)}`
                : gpsState === 'waiting' || gpsState === 'idle'
                  ? t.gpsWaiting
                  : t.gpsDenied}
            {gpsState === 'denied' && !exifGps && (
              <button
                type="button"
                onClick={requestGps}
                style={{
                  marginLeft: 8,
                  background: 'transparent',
                  border: '1px solid rgba(212,168,67,0.4)',
                  borderRadius: 'var(--r-pill, 999px)',
                  color: 'var(--accent-soft, #d4a843)',
                  fontSize: '0.72rem',
                  padding: '2px 10px',
                  cursor: 'pointer',
                }}
              >
                {t.gpsRetry}
              </button>
            )}
          </div>
          {capturedAt && (
            <div>
              🕒 {t.capturedAt}: {capturedAt.replace('T', ' ').slice(0, 16)}
            </div>
          )}
        </div>

        {/* 제목 / 메모 */}
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {t.titleLabel}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              maxLength={120}
              disabled={busy !== 'no'}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {t.noteLabel}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              rows={3}
              maxLength={2000}
              disabled={busy !== 'no'}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </label>
        </div>

        {/* 메시지 */}
        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--r-sm, 10px)',
              background: message.kind === 'ok' ? 'rgba(74,103,65,0.25)' : 'rgba(240,114,106,0.12)',
              color: message.kind === 'ok' ? '#8fbf82' : '#f0726a',
              fontSize: '0.85rem',
              lineHeight: 1.6,
            }}
          >
            {message.text}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy !== 'no'}
          style={{
            padding: '15px',
            background: busy !== 'no' ? 'rgba(212,168,67,0.35)' : 'var(--accent, #b88c2d)',
            color: '#0a0b10',
            border: 0,
            borderRadius: 'var(--r-pill, 999px)',
            fontSize: '1.02rem',
            fontWeight: 700,
            cursor: busy !== 'no' ? 'default' : 'pointer',
          }}
        >
          {busy === 'uploading' ? t.submitting(overallProgress) : busy === 'saving' ? t.saving : t.submit}
        </button>
        {busy === 'uploading' && (
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${overallProgress}%`,
                background: 'var(--accent, #b88c2d)',
                transition: 'width 300ms ease',
              }}
            />
          </div>
        )}
      </div>

      {/* 내 제출 내역 */}
      <div style={{ marginTop: 32 }}>
        <div style={{ ...monoKicker, marginBottom: 12 }}>{t.mySubmissions}</div>
        {submissions.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{t.empty}</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {submissions.map((s) => {
              const c = STATUS_COLORS[s.status] ?? STATUS_COLORS.pending;
              return (
                <div key={s.id} style={{ ...card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                        {s.files.length} file · {(s.capturedAt ?? s.submittedAt).replace('T', ' ').slice(0, 16)}
                        {s.weather && ` · ${t.weather} ${Math.round(s.weather.tempC)}°C${s.weather.text ? ` (${s.weather.text})` : ''}`}
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '4px 12px',
                        borderRadius: 'var(--r-pill, 999px)',
                        background: c.bg,
                        color: c.fg,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {t.status[s.status] ?? s.status}
                    </span>
                  </div>
                  {s.status === 'rejected' && s.rejectReason && (
                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#f0726a' }}>
                      {t.rejectReason}: {s.rejectReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
