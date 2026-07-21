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
    mySubmissions: '내 갤러리 · 제출 내역',
    status: { pending: '승인 대기', approved: '게시됨', rejected: '반려' } as Record<string, string>,
    rejectReason: '반려 사유',
    empty: '아직 제출한 내역이 없습니다.',
    removeFile: '제거',
    weather: '날씨',
    edit: '수정',
    del: '삭제',
    delConfirm: '정말 삭제',
    delCancel: '취소',
    save: '저장',
    cancel: '취소',
    addFiles: '사진·영상 추가',
    resubmitNote: '수정 후 저장하면 다시 승인 대기 상태가 되어 관리자가 재검토합니다.',
    resubmitted: '수정되어 다시 승인 대기로 접수되었습니다.',
    editUploading: '파일 업로드 중…',
    saved: '수정되었습니다.',
    deleted: '삭제되었습니다.',
    approvedLock: '게시된 항목의 삭제는 관리자에게 문의하세요.',
    actionFailed: '처리에 실패했습니다. 다시 시도해주세요.',
    pwChange: '비밀번호 변경',
    pwCurrent: '현재 비밀번호',
    pwNew: '새 비밀번호 (4자 이상)',
    pwNew2: '새 비밀번호 확인',
    pwSubmit: '변경하기',
    pwBusy: '변경 중…',
    pwDone: '비밀번호가 변경되었습니다. 다른 기기에서는 다시 로그인해야 합니다.',
    pwMismatch: '새 비밀번호가 일치하지 않습니다.',
    pwShort: '새 비밀번호는 4자 이상이어야 합니다.',
    wifiTip: '대용량 영상은 네트워크에 따라 오래 걸립니다 — Wi-Fi 권장',
    preparing: '파일 준비 중…',
    stalled: '네트워크 응답이 없어 업로드를 중단했습니다. 다시 시도해주세요.',
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
    mySubmissions: 'Thư viện của tôi · Lịch sử gửi',
    status: { pending: 'Chờ duyệt', approved: 'Đã đăng', rejected: 'Bị từ chối' } as Record<string, string>,
    rejectReason: 'Lý do từ chối',
    empty: 'Chưa có mục nào được gửi.',
    removeFile: 'Xóa',
    weather: 'Thời tiết',
    edit: 'Sửa',
    del: 'Xóa',
    delConfirm: 'Xóa thật',
    delCancel: 'Hủy',
    save: 'Lưu',
    cancel: 'Hủy',
    addFiles: 'Thêm ảnh·video',
    resubmitNote: 'Sau khi lưu, mục sẽ chuyển lại trạng thái chờ duyệt để quản trị viên xem lại.',
    resubmitted: 'Đã lưu và gửi lại để chờ duyệt.',
    editUploading: 'Đang tải tệp…',
    saved: 'Đã cập nhật.',
    deleted: 'Đã xóa.',
    approvedLock: 'Mục đã đăng — liên hệ quản trị viên để xóa.',
    actionFailed: 'Thao tác thất bại. Vui lòng thử lại.',
    pwChange: 'Đổi mật khẩu',
    pwCurrent: 'Mật khẩu hiện tại',
    pwNew: 'Mật khẩu mới (tối thiểu 4 ký tự)',
    pwNew2: 'Xác nhận mật khẩu mới',
    pwSubmit: 'Cập nhật',
    pwBusy: 'Đang cập nhật…',
    pwDone: 'Đã đổi mật khẩu. Các thiết bị khác cần đăng nhập lại.',
    pwMismatch: 'Mật khẩu mới không khớp.',
    pwShort: 'Mật khẩu mới tối thiểu 4 ký tự.',
    wifiTip: 'Video dung lượng lớn có thể mất nhiều thời gian — nên dùng Wi-Fi',
    preparing: 'Đang chuẩn bị tệp…',
    stalled: 'Mạng không phản hồi, đã dừng tải lên. Vui lòng thử lại.',
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
  note?: string;
  files: { url: string; type: 'photo' | 'video'; contentType?: string; size?: number; name?: string }[];
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
/** 동시 업로드 파일 수 — 순차 업로드의 토큰왕복 누적 지연 제거 */
const UPLOAD_CONCURRENCY = 3;
/** 이 크기 이상 사진은 클라이언트에서 리사이즈 후 전송 (현장 모바일 업링크 절약) */
const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024;
const COMPRESS_MAX_DIM = 2560;

function typeFromExt(name: string): string {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    heic: 'image/heic', heif: 'image/heif',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  };
  return map[ext] ?? '';
}

/**
 * 사진 클라이언트 압축 — 최대 2560px JPEG 로 리사이즈.
 * 폰 원본(4~12MB)이 갤러리 노출에 과한 해상도라 전송량을 1/5~1/10 로 줄인다.
 * 촬영시각·GPS 는 압축 전에 EXIF 에서 이미 추출해 별도 전송하므로 손실 없음.
 * HEIC 미지원 브라우저 등 디코드 실패 시 null → 원본 그대로 업로드.
 */
async function compressPhoto(
  file: File
): Promise<{ blob: Blob; contentType: string; name: string } | null> {
  if (file.size < COMPRESS_THRESHOLD) return null;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, COMPRESS_MAX_DIM / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return null;
    return {
      blob,
      contentType: 'image/jpeg',
      name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
    };
  } catch {
    return null;
  }
}

function fmtMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}

interface UploadedFile {
  url: string;
  type: 'photo' | 'video';
  contentType: string;
  size: number;
  name: string;
}

/**
 * 선택된 파일들을 압축(사진)→Vercel Blob 병렬 업로드(동시 3)한다.
 * 최초 제출과 반려 후 파일 교체가 공유하는 재사용 헬퍼.
 * 60초간 진행이 없으면 중단하고 'stalled' 를 throw 한다.
 * onProgress 로 바이트/파일 진행 상황을 알린다(옵션).
 */
async function uploadPickedFiles(
  items: PickedFile[],
  onProgress?: (done: number, total: number, filesDone: number, filesTotal: number) => void
): Promise<UploadedFile[]> {
  // 1) 사진 압축 (영상·소용량은 원본). iOS 가 file.type 을 비워 보내는
  //    경우가 있어 확장자 기반으로 contentType 을 보정한다.
  const payloads: { p: PickedFile; blob: Blob; contentType: string; name: string }[] = [];
  for (const p of items) {
    let blob: Blob = p.file;
    let contentType = p.file.type || typeFromExt(p.file.name);
    let name = p.file.name;
    if (p.type === 'photo') {
      const compressed = await compressPhoto(p.file);
      if (compressed) {
        blob = compressed.blob;
        contentType = compressed.contentType;
        name = compressed.name;
      }
    }
    if (!contentType) contentType = p.type === 'video' ? 'video/mp4' : 'image/jpeg';
    payloads.push({ p, blob, contentType, name });
  }

  const totalBytes = payloads.reduce((s, x) => s + x.blob.size, 0);
  const perFileLoaded = new Array<number>(payloads.length).fill(0);
  // 60초간 1바이트도 진행이 없으면 중단 — 무한 0% 대신 명확한 오류 표시
  const controller = new AbortController();
  let lastProgressAt = Date.now();
  const watchdog = setInterval(() => {
    if (Date.now() - lastProgressAt > 60_000) controller.abort();
  }, 5_000);
  const report = () => {
    lastProgressAt = Date.now();
    const done = perFileLoaded.reduce((a, b) => a + b, 0);
    onProgress?.(
      done,
      totalBytes,
      perFileLoaded.filter((b, i) => b >= payloads[i].blob.size).length,
      payloads.length
    );
  };
  report();

  // 2) 병렬 업로드 (동시 3) — 순차 방식의 파일당 토큰왕복 누적 지연 제거.
  const urls = new Array<string>(payloads.length);
  let nextIdx = 0;
  const worker = async () => {
    for (;;) {
      const i = nextIdx++;
      if (i >= payloads.length) return;
      const x = payloads[i];
      const safeName = x.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
      const pathname = `uploads/partner/${Date.now()}-${i}-${safeName}`;
      try {
        const blob = await upload(pathname, x.blob, {
          access: 'public',
          handleUploadUrl: '/api/partner/upload',
          contentType: x.contentType,
          multipart: x.blob.size > 8 * 1024 * 1024,
          abortSignal: controller.signal,
          onUploadProgress: ({ percentage }) => {
            perFileLoaded[i] = Math.min(x.blob.size, (x.blob.size * percentage) / 100);
            report();
          },
        });
        urls[i] = blob.url;
      } catch (err) {
        // 클라이언트 직행 업로드 실패 (로컬 dev 등) → 소용량은 서버 경유 폴백
        if (x.blob.size <= DIRECT_FALLBACK_MAX) {
          const fd = new FormData();
          fd.append('file', new File([x.blob], x.name, { type: x.contentType }));
          const res = await fetch('/api/partner/upload-direct', { method: 'POST', body: fd });
          const json = await res.json();
          if (!res.ok || !json.success) throw err;
          urls[i] = json.url;
        } else {
          throw err;
        }
      }
      perFileLoaded[i] = x.blob.size;
      report();
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, payloads.length) }, worker));
  } finally {
    clearInterval(watchdog);
  }
  if (controller.signal.aborted) throw new Error('stalled');

  return payloads.map((x, i) => ({
    url: urls[i],
    type: x.p.type,
    contentType: x.contentType,
    size: x.blob.size,
    name: x.name,
  }));
}

/* ─── Styles (조엘라이프 디자인 토큰) ───────────────────── */

const card: React.CSSProperties = {
  background: '#14161f',
  border: '1px solid rgba(212,168,67,0.22)',
  borderRadius: '16px',
  padding: '20px 18px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 15px',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  border: '1px solid rgba(212,168,67,0.25)',
  borderRadius: '10px',
  fontSize: '1rem',
  outline: 'none',
};

const monoKicker: React.CSSProperties = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: '0.66rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: '#b88c2d',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: 'rgba(212,168,67,0.15)', fg: '#d4a843' },
  approved: { bg: 'rgba(74,103,65,0.3)', fg: '#8fbf82' },
  rejected: { bg: 'rgba(240,114,106,0.15)', fg: '#f0726a' },
};

const actionBtn = (bg: string, fg: string, outline = false): React.CSSProperties => ({
  padding: '7px 16px',
  background: bg,
  color: fg,
  border: outline ? `1px solid ${fg === 'rgba(255,255,255,0.6)' ? 'rgba(255,255,255,0.25)' : fg}` : 0,
  borderRadius: '999px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
});

/* ─── Component ────────────────────────────────────────── */

export default function PartnerUploadClient({ partnerName }: { partnerName: string }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('ko');
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [deviceLoc, setDeviceLoc] = useState<DeviceLoc | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'waiting' | 'ok' | 'denied'>('idle');
  const [busy, setBusy] = useState<'no' | 'preparing' | 'uploading' | 'saving'>('no');
  const [overallProgress, setOverallProgress] = useState(0);
  const [byteProgress, setByteProgress] = useState<{
    done: number;
    total: number;
    filesDone: number;
    filesTotal: number;
  } | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionView[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 갤러리 편집/삭제
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editFiles, setEditFiles] = useState<SubmissionView['files']>([]);
  const [editPicked, setEditPicked] = useState<PickedFile[]>([]);
  const [editUploading, setEditUploading] = useState(false);
  const [deleteArmId, setDeleteArmId] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 비밀번호 변경
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwNew2, setPwNew2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

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

    setBusy('preparing');
    setMessage(null);
    setOverallProgress(0);
    setByteProgress(null);

    try {
      let switchedToUploading = false;
      const uploadedFiles = await uploadPickedFiles(picked, (done, total, filesDone, filesTotal) => {
        if (!switchedToUploading) {
          switchedToUploading = true;
          setBusy('uploading');
        }
        setOverallProgress(Math.min(99, total > 0 ? Math.round((done / total) * 100) : 0));
        setByteProgress({ done, total, filesDone, filesTotal });
      });

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
      const stalled = err instanceof Error && err.message === 'stalled';
      const detail = err instanceof Error ? err.message : String(err);
      setMessage({
        kind: 'err',
        text: (stalled ? t.stalled : t.failed) + (stalled ? '' : `\n[${detail.slice(0, 180)}]`),
      });
    } finally {
      setBusy('no');
      setOverallProgress(0);
      setByteProgress(null);
    }
  };

  const onLogout = async () => {
    await fetch('/api/partner/auth/logout', { method: 'POST' });
    router.replace('/partner/login');
  };

  /* ─── 갤러리 편집/삭제 ─── */

  const startEdit = (s: SubmissionView) => {
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditNote(s.note ?? '');
    setEditFiles(s.files.map((f) => ({ ...f })));
    setEditPicked([]);
    setDeleteArmId(null);
    setMessage(null);
  };

  const cancelEdit = () => {
    editPicked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setEditPicked([]);
    setEditingId(null);
  };

  const onPickEditFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setEditPicked((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const removeEditFile = (url: string) => setEditFiles((prev) => prev.filter((f) => f.url !== url));

  const removeEditPicked = (idx: number) =>
    setEditPicked((prev) => {
      URL.revokeObjectURL(prev[idx]?.previewUrl ?? '');
      return prev.filter((_, i) => i !== idx);
    });

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim() || rowBusyId) return;
    if (editFiles.length + editPicked.length === 0) {
      setMessage({ kind: 'err', text: t.needFiles });
      return;
    }
    const wasRejected = submissions.find((s) => s.id === editingId)?.status === 'rejected';
    setRowBusyId(editingId);
    try {
      // 새로 추가된 파일 업로드 → 기존 유지분과 합쳐 전체 목록 교체
      let uploaded: UploadedFile[] = [];
      if (editPicked.length > 0) {
        setEditUploading(true);
        uploaded = await uploadPickedFiles(editPicked);
      }
      const mergedFiles = [
        ...editFiles.map((f) => ({
          url: f.url,
          type: f.type,
          contentType: f.contentType ?? (f.type === 'video' ? 'video/mp4' : 'image/jpeg'),
          size: f.size ?? 0,
          ...(f.name ? { name: f.name } : {}),
        })),
        ...uploaded,
      ];

      // 새로 추가한 사진에 GPS/촬영시각이 있으면 함께 갱신 (날씨 재조회 트리거)
      const gpsPick = editPicked.find(
        (p) => typeof p.exif.lat === 'number' && typeof p.exif.lng === 'number'
      );
      const newLocation = gpsPick
        ? { lat: gpsPick.exif.lat!, lng: gpsPick.exif.lng!, source: 'exif' as const }
        : undefined;
      const exifTimes = editPicked.map((p) => p.exif.capturedAt).filter(Boolean) as string[];
      const newCaptured = exifTimes.length > 0 ? [...exifTimes].sort()[0] : undefined;

      const res = await fetch('/api/partner/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title: editTitle.trim(),
          note: editNote,
          files: mergedFiles,
          ...(newLocation ? { location: newLocation } : {}),
          ...(newCaptured ? { capturedAt: newCaptured } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMessage({ kind: 'err', text: json.message ?? t.actionFailed });
        return;
      }
      editPicked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setEditPicked([]);
      setEditingId(null);
      setMessage({ kind: 'ok', text: wasRejected ? t.resubmitted : t.saved });
      loadSubmissions();
    } catch (err) {
      const stalled = err instanceof Error && err.message === 'stalled';
      setMessage({ kind: 'err', text: stalled ? t.stalled : t.actionFailed });
    } finally {
      setEditUploading(false);
      setRowBusyId(null);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (rowBusyId) return;
    setRowBusyId(id);
    try {
      const res = await fetch('/api/partner/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMessage({ kind: 'err', text: json.message ?? t.actionFailed });
        return;
      }
      setDeleteArmId(null);
      setMessage({ kind: 'ok', text: t.deleted });
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setMessage({ kind: 'err', text: t.actionFailed });
    } finally {
      setRowBusyId(null);
    }
  };

  /* ─── 비밀번호 변경 ─── */

  const changePassword = async () => {
    if (pwBusy) return;
    setPwMsg(null);
    if (pwNew.length < 4) {
      setPwMsg({ kind: 'err', text: t.pwShort });
      return;
    }
    if (pwNew !== pwNew2) {
      setPwMsg({ kind: 'err', text: t.pwMismatch });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch('/api/partner/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPwMsg({ kind: 'err', text: json.message ?? t.actionFailed });
        return;
      }
      setPwCurrent('');
      setPwNew('');
      setPwNew2('');
      setPwMsg({ kind: 'ok', text: t.pwDone });
    } catch {
      setPwMsg({ kind: 'err', text: t.actionFailed });
    } finally {
      setPwBusy(false);
    }
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
                borderRadius: '999px',
                border: `1px solid ${lang === l ? '#b88c2d' : 'rgba(255,255,255,0.2)'}`,
                background: lang === l ? 'rgba(212,168,67,0.15)' : 'transparent',
                color: lang === l ? '#d4a843' : 'rgba(255,255,255,0.6)',
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
        <h1 style={{ fontSize: '1.35rem', fontWeight: 600, fontFamily: "var(--font-serif), serif", margin: 0 }}>
          {t.title}
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => { setPwOpen((v) => !v); setPwMsg(null); }}
            style={{
              background: 'transparent',
              border: 0,
              color: '#d4a843',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {t.pwChange}
          </button>
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
      </div>

      {/* 비밀번호 변경 */}
      {pwOpen && (
        <div style={{ ...card, display: 'grid', gap: 10, marginBottom: 20 }}>
          <div style={{ ...monoKicker, fontSize: '0.62rem' }}>{t.pwChange}</div>
          <input
            type="password"
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
            placeholder={t.pwCurrent}
            autoComplete="current-password"
            style={inputStyle}
          />
          <input
            type="password"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            placeholder={t.pwNew}
            autoComplete="new-password"
            style={inputStyle}
          />
          <input
            type="password"
            value={pwNew2}
            onChange={(e) => setPwNew2(e.target.value)}
            placeholder={t.pwNew2}
            autoComplete="new-password"
            style={inputStyle}
          />
          {pwMsg && (
            <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: pwMsg.kind === 'ok' ? '#8fbf82' : '#f0726a' }}>
              {pwMsg.text}
            </div>
          )}
          <button
            type="button"
            onClick={changePassword}
            disabled={pwBusy || !pwCurrent || !pwNew || !pwNew2}
            style={{
              padding: '12px',
              background: pwBusy ? 'rgba(212,168,67,0.35)' : '#b88c2d',
              color: '#0a0b10',
              border: 0,
              borderRadius: '999px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: pwBusy ? 'default' : 'pointer',
              opacity: !pwCurrent || !pwNew || !pwNew2 ? 0.5 : 1,
            }}
          >
            {pwBusy ? t.pwBusy : t.pwSubmit}
          </button>
        </div>
      )}

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
              borderRadius: '16px',
              color: '#d4a843',
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
                    borderRadius: '10px',
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
            borderRadius: '10px',
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
                  borderRadius: '999px',
                  color: '#d4a843',
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
              borderRadius: '10px',
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
            background: busy !== 'no' ? 'rgba(212,168,67,0.35)' : '#b88c2d',
            color: '#0a0b10',
            border: 0,
            borderRadius: '999px',
            fontSize: '1.02rem',
            fontWeight: 700,
            cursor: busy !== 'no' ? 'default' : 'pointer',
          }}
        >
          {busy === 'preparing' ? t.preparing : busy === 'uploading' ? t.submitting(overallProgress) : busy === 'saving' ? t.saving : t.submit}
        </button>
        {busy === 'uploading' && (
          <>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${overallProgress}%`,
                  background: '#b88c2d',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            {byteProgress && (
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.6 }}>
                {fmtMB(byteProgress.done)} / {fmtMB(byteProgress.total)} MB · {byteProgress.filesDone}/{byteProgress.filesTotal}
                {byteProgress.total > 50 * 1024 * 1024 && (
                  <div style={{ color: 'rgba(212,168,67,0.7)' }}>{t.wifiTip}</div>
                )}
              </div>
            )}
          </>
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
              const isEditing = editingId === s.id;
              const isRowBusy = rowBusyId === s.id;
              return (
                <div key={s.id} style={{ ...card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          maxLength={120}
                          style={{ ...inputStyle, padding: '9px 12px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                        {s.files.length} file · {(s.capturedAt ?? s.submittedAt).replace('T', ' ').slice(0, 16)}
                        {s.weather && ` · ${t.weather} ${Math.round(s.weather.tempC)}°C${s.weather.text ? ` (${s.weather.text})` : ''}`}
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: c.bg,
                        color: c.fg,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {t.status[s.status] ?? s.status}
                    </span>
                  </div>

                  {/* 파일 갤러리 — 보기: 탭하면 원본 열기 / 편집: 추가·삭제 */}
                  {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 6, marginTop: 10 }}>
                      {/* 기존 유지 파일 */}
                      {editFiles.map((f) => (
                        <div key={f.url} style={{ position: 'relative' }}>
                          <div style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: '#1a1d29', border: '1px solid rgba(212,168,67,0.18)', position: 'relative' }}>
                            {f.type === 'photo' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <>
                                <video src={f.url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', textShadow: '0 1px 4px #000' }}>▶</span>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditFile(f.url)}
                            disabled={isRowBusy}
                            aria-label={t.removeFile}
                            style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 0, background: '#f0726a', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {/* 새로 추가한 파일 */}
                      {editPicked.map((p, i) => (
                        <div key={`${p.file.name}-${i}`} style={{ position: 'relative' }}>
                          <div style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: '#1a1d29', border: '1px solid rgba(143,191,130,0.5)', position: 'relative' }}>
                            {p.type === 'photo' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <video src={p.previewUrl} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditPicked(i)}
                            disabled={isRowBusy}
                            aria-label={t.removeFile}
                            style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 0, background: '#f0726a', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {/* 파일 추가 버튼 */}
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={isRowBusy}
                        style={{ aspectRatio: '1', borderRadius: '8px', border: '1.5px dashed rgba(212,168,67,0.45)', background: 'rgba(212,168,67,0.06)', color: '#d4a843', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 4, lineHeight: 1.3 }}
                      >
                        + {t.addFiles}
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={onPickEditFiles}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 6, marginTop: 10 }}>
                      {s.files.map((f, i) => (
                        <a
                          key={`${s.id}-${i}`}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#1a1d29',
                            border: '1px solid rgba(212,168,67,0.18)',
                            position: 'relative',
                          }}
                        >
                          {f.type === 'photo' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <>
                              <video src={f.url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', textShadow: '0 1px 4px #000' }}>▶</span>
                            </>
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* 메모 (편집 모드) */}
                  {isEditing && (
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder={t.notePlaceholder}
                      rows={2}
                      maxLength={2000}
                      style={{ ...inputStyle, marginTop: 10, padding: '9px 12px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  )}
                  {!isEditing && s.note && (
                    <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-line' }}>
                      {s.note}
                    </div>
                  )}

                  {s.status === 'rejected' && s.rejectReason && (
                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#f0726a' }}>
                      {t.rejectReason}: {s.rejectReason}
                    </div>
                  )}

                  {/* 반려 건 수정 시: 저장하면 다시 승인 대기로 돌아간다는 안내 */}
                  {isEditing && s.status === 'rejected' && (
                    <div style={{ marginTop: 10, fontSize: '0.74rem', color: '#d4a843', lineHeight: 1.5 }}>
                      ⟳ {t.resubmitNote}
                    </div>
                  )}

                  {/* 액션: pending/rejected=수정+삭제, approved=잠금 안내 */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    {isEditing ? (
                      <>
                        <button type="button" onClick={saveEdit} disabled={isRowBusy || !editTitle.trim() || editFiles.length + editPicked.length === 0} style={actionBtn('#b88c2d', '#0a0b10')}>
                          {isRowBusy ? (editUploading ? t.editUploading : t.saving) : t.save}
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={isRowBusy} style={actionBtn('transparent', 'rgba(255,255,255,0.6)', true)}>
                          {t.cancel}
                        </button>
                      </>
                    ) : (
                      <>
                        {(s.status === 'pending' || s.status === 'rejected') && (
                          <button type="button" onClick={() => startEdit(s)} disabled={isRowBusy} style={actionBtn('transparent', '#d4a843', true)}>
                            {t.edit}
                          </button>
                        )}
                        {s.status !== 'approved' &&
                          (deleteArmId === s.id ? (
                            <>
                              <button type="button" onClick={() => deleteSubmission(s.id)} disabled={isRowBusy} style={actionBtn('#c0392b', '#fff')}>
                                {isRowBusy ? '…' : t.delConfirm}
                              </button>
                              <button type="button" onClick={() => setDeleteArmId(null)} disabled={isRowBusy} style={actionBtn('transparent', 'rgba(255,255,255,0.6)', true)}>
                                {t.delCancel}
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => { setDeleteArmId(s.id); setEditingId(null); }} style={actionBtn('transparent', '#f0726a', true)}>
                              {t.del}
                            </button>
                          ))}
                        {s.status === 'approved' && (
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{t.approvedLock}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ opacity: 0.28, fontSize: '0.62rem', textAlign: 'center', marginTop: 28, letterSpacing: '0.1em' }}>
        ZOEL FIELD UPLOAD v1.5
      </div>
    </div>
  );
}
