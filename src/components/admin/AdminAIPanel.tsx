'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

interface Attachment {
  id: string;
  type: 'image' | 'pdf';
  mediaType: string;
  data: string;
  name: string;
  size: number;
  previewUrl?: string;
}

interface ToolEvent {
  id: string;
  name: string;
  status: 'running' | 'ok' | 'error';
  summary?: string;
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  tools?: ToolEvent[];
}

interface ModelOption {
  value: string;
  label: string;
  hint?: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: 'claude-opus-4-7', label: 'Claude Opus 4.7', hint: '최고 성능 (기본)' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', hint: '균형' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', hint: '빠른 응답' },
];

const DEFAULT_MODEL = 'claude-opus-4-7';
const STORAGE_KEY = 'zoel_admin_ai_panel_v2';

const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

interface PersistedState {
  open: boolean;
  model: string;
  width: number;
  messages: Message[];
}

function loadPersisted(): Partial<PersistedState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (Array.isArray(parsed.messages)) {
      parsed.messages = parsed.messages.map((m) => {
        if (!m.attachments || m.attachments.length === 0) return m;
        const valid = m.attachments.filter((a) => typeof a.data === 'string' && a.data.length > 0);
        const restored = valid.map((a) => ({
          ...a,
          previewUrl: a.type === 'image' && a.data ? a.data : undefined,
        }));
        if (restored.length === 0) {
          const { attachments: _drop, ...rest } = m;
          void _drop;
          return rest;
        }
        return { ...m, attachments: restored };
      });
    }
    return parsed;
  } catch {
    return {};
  }
}

function trySetItem(value: string): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

function savePersisted(state: PersistedState) {
  if (typeof window === 'undefined') return;

  const stripPreview: PersistedState = {
    ...state,
    messages: state.messages.map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({ ...a, previewUrl: undefined })),
    })),
  };

  if (trySetItem(JSON.stringify(stripPreview))) return;

  // Quota exceeded — progressively drop oldest attachment binary data
  const working = stripPreview.messages.map((m) => ({
    ...m,
    attachments: m.attachments?.map((a) => ({ ...a })),
  }));

  for (let i = 0; i < working.length; i++) {
    const msg = working[i];
    if (!msg.attachments || msg.attachments.length === 0) continue;
    msg.attachments = msg.attachments.map((a) => ({ ...a, data: '' }));
    const candidate: PersistedState = { ...stripPreview, messages: working };
    if (trySetItem(JSON.stringify(candidate))) return;
  }

  // Last resort: strip all attachment data
  const fullStripped: PersistedState = {
    ...stripPreview,
    messages: stripPreview.messages.map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({ ...a, data: '' })),
    })),
  };
  trySetItem(JSON.stringify(fullStripped));
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function fileToAttachment(file: File): Promise<Attachment | { error: string }> {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { error: `지원하지 않는 형식: ${file.type || file.name}` };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: `파일이 너무 큽니다 (최대 5MB): ${file.name}` };
  }
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
    r.onerror = () => reject(r.error ?? new Error('read error'));
    r.readAsDataURL(file);
  });
  const type: 'image' | 'pdf' = file.type === 'application/pdf' ? 'pdf' : 'image';
  return {
    id: makeId(),
    type,
    mediaType: file.type,
    data: dataUrl,
    name: file.name || (type === 'pdf' ? 'document.pdf' : 'image'),
    size: file.size,
    previewUrl: type === 'image' ? dataUrl : undefined,
  };
}

async function captureScreen(): Promise<Attachment | { error: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return { error: '이 브라우저는 화면 캡쳐를 지원하지 않습니다.' };
  }
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 1 },
      audio: false,
    });
    const track = stream.getVideoTracks()[0];
    if (!track) return { error: '화면 트랙을 찾지 못했습니다.' };

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise((r) => setTimeout(r, 250));

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return { error: '영상 크기를 읽지 못했습니다.' };

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'Canvas 2D context 실패' };
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 0.92)
    );
    if (!blob) return { error: '이미지 변환 실패' };
    if (blob.size > MAX_ATTACHMENT_BYTES) {
      return { error: '캡쳐 이미지가 5MB를 초과했습니다.' };
    }
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
      r.onerror = () => reject(r.error ?? new Error('read error'));
      r.readAsDataURL(blob);
    });
    return {
      id: makeId(),
      type: 'image',
      mediaType: 'image/png',
      data: dataUrl,
      name: `screen-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
      size: blob.size,
      previewUrl: dataUrl,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '화면 캡쳐 취소됨';
    return { error: msg };
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

export default function AdminAIPanel() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [open, setOpen] = useState(false);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [width, setWidth] = useState<number>(420);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch('/api/admin/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (cancelled) return;
        setIsAdmin(res.ok);
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const root = document.documentElement;
    if (open) {
      root.style.setProperty('--ai-panel-width', `${width}px`);
      document.body.style.paddingLeft = `${width}px`;
    } else {
      root.style.removeProperty('--ai-panel-width');
      document.body.style.paddingLeft = '';
    }
    return () => {
      root.style.removeProperty('--ai-panel-width');
      document.body.style.paddingLeft = '';
    };
  }, [open, width, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const persisted = loadPersisted();
    if (typeof persisted.open === 'boolean') setOpen(persisted.open);
    if (typeof persisted.model === 'string') setModel(persisted.model);
    if (typeof persisted.width === 'number' && persisted.width >= 320 && persisted.width <= 720) {
      setWidth(persisted.width);
    }
    if (Array.isArray(persisted.messages)) setMessages(persisted.messages);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !authChecked) return;
    savePersisted({ open, model, width, messages });
  }, [isAdmin, authChecked, open, model, width, messages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending, pending.length]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const startDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragStateRef.current = { startX: e.clientX, startWidth: width };

      function onMove(ev: MouseEvent) {
        const state = dragStateRef.current;
        if (!state) return;
        const delta = ev.clientX - state.startX;
        const next = Math.min(720, Math.max(320, state.startWidth + delta));
        setWidth(next);
      }
      function onUp() {
        dragStateRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [width]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
  }, []);

  const addAttachments = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      const room = MAX_ATTACHMENTS - pending.length;
      if (room <= 0) {
        setError(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.`);
        return;
      }
      const slice = list.slice(0, room);
      const results = await Promise.all(slice.map(fileToAttachment));
      const added: Attachment[] = [];
      const errors: string[] = [];
      for (const r of results) {
        if ('error' in r) errors.push(r.error);
        else added.push(r);
      }
      if (added.length > 0) setPending((prev) => [...prev, ...added]);
      if (errors.length > 0) setError(errors.join(' / '));
      else setError(null);
    },
    [pending.length]
  );

  const handleFileInput = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      await addAttachments(e.target.files);
      e.target.value = '';
    },
    [addAttachments]
  );

  const handleCapture = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    setError(null);
    try {
      const r = await captureScreen();
      if ('error' in r) {
        setError(r.error);
        return;
      }
      if (pending.length >= MAX_ATTACHMENTS) {
        setError(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.`);
        return;
      }
      setPending((prev) => [...prev, r]);
    } finally {
      setCapturing(false);
    }
  }, [capturing, pending.length]);

  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const it of items) {
        if (it.kind === 'file') {
          const f = it.getAsFile();
          if (f && ALLOWED_MIME.includes(f.type)) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        await addAttachments(files);
      }
    },
    [addAttachments]
  );

  const removePending = useCallback((id: string) => {
    setPending((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if ((!trimmed && pending.length === 0) || sending) return;

    setError(null);
    const attachments = pending;
    const userMsg: Message = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      ...(attachments.length > 0 ? { attachments } : {}),
    };
    const assistantId = makeId();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };

    const nextHistory = [...messages, userMsg];
    setMessages([...nextHistory, assistantPlaceholder]);
    setInput('');
    setPending([]);
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments
              ?.filter((a) => typeof a.data === 'string' && a.data.length > 0)
              .map((a) => ({
                type: a.type,
                mediaType: a.mediaType,
                data: a.data,
                name: a.name,
              })),
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `요청 실패 (${res.status})`);
      }
      if (!res.body) throw new Error('응답 본문이 비어있습니다.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let textAcc = '';
      const tools: ToolEvent[] = [];
      let streamError: string | null = null;

      const handleEvent = (evt: Record<string, unknown>) => {
        const t = evt.type;
        if (t === 'text' && typeof evt.delta === 'string') {
          textAcc += evt.delta;
        } else if (t === 'tool_start' && typeof evt.id === 'string' && typeof evt.name === 'string') {
          tools.push({ id: evt.id, name: evt.name, status: 'running' });
        } else if (t === 'tool_result' && typeof evt.id === 'string') {
          const idx = tools.findIndex((x) => x.id === evt.id);
          const ok = evt.ok !== false;
          const entry: ToolEvent = {
            id: String(evt.id),
            name: idx >= 0 ? tools[idx].name : String(evt.name ?? 'tool'),
            status: ok ? 'ok' : 'error',
            summary: typeof evt.summary === 'string' ? evt.summary : undefined,
            error: typeof evt.error === 'string' ? evt.error : undefined,
          };
          if (idx >= 0) tools[idx] = entry;
          else tools.push(entry);
        } else if (t === 'error' && typeof evt.message === 'string') {
          streamError = evt.message;
        }
        // 'done' — no-op; loop will exit
      };

      const flushRender = () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: textAcc,
                  tools: tools.length > 0 ? tools.map((x) => ({ ...x })) : undefined,
                }
              : m
          )
        );
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl = buffer.indexOf('\n');
        while (nl !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line) {
            try {
              handleEvent(JSON.parse(line) as Record<string, unknown>);
            } catch {
              // malformed event — skip
            }
          }
          nl = buffer.indexOf('\n');
        }
        flushRender();
      }
      // flush remainder
      const tail = buffer.trim();
      if (tail) {
        try {
          handleEvent(JSON.parse(tail) as Record<string, unknown>);
        } catch {
          /* ignore */
        }
      }
      flushRender();

      if (streamError) throw new Error(streamError);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: (m.content || '') + '\n\n_[중단됨]_' }
              : m
          )
        );
      } else {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  }, [input, messages, model, pending, sending]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void sendMessage();
    },
    [sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  const clearConversation = useCallback(() => {
    if (sending) stopStreaming();
    setMessages([]);
    setPending([]);
    setError(null);
  }, [sending, stopStreaming]);

  const modelLabel = useMemo(
    () => MODEL_OPTIONS.find((m) => m.value === model)?.label ?? model,
    [model]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
      await addAttachments(e.dataTransfer.files);
    },
    [addAttachments]
  );

  if (!authChecked || !isAdmin) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-[60] flex items-center gap-2 rounded-full border border-amber-300 bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-900/20 transition hover:scale-105 hover:shadow-amber-900/30"
          aria-label="AI 어시스턴트 열기"
        >
          <SparkleIcon />
          <span>AI 어시스턴트</span>
        </button>
      )}

      {open && (
        <aside
          className="fixed left-0 top-0 z-[60] flex h-screen flex-col border-r border-gray-800 bg-[#0f1115] text-gray-100 shadow-2xl"
          style={{ width }}
          aria-label="관리자 AI 어시스턴트"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-amber-500/15 ring-2 ring-amber-500">
              <p className="text-sm font-semibold text-amber-100">
                파일을 놓으면 첨부됩니다
              </p>
            </div>
          )}

          <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                <SparkleIcon small />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">AI 어시스턴트</p>
                <p className="truncate text-[11px] text-gray-400">{modelLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearConversation}
                disabled={messages.length === 0 && pending.length === 0}
                className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="대화 초기화"
                aria-label="대화 초기화"
              >
                <TrashIcon />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-gray-100"
                title="닫기"
                aria-label="닫기"
              >
                <CloseIcon />
              </button>
            </div>
          </header>

          <div className="border-b border-gray-800 px-4 py-2.5">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">
              모델
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={sending}
              className="mt-1 w-full rounded-md border border-gray-700 bg-[#1a1d23] px-2.5 py-1.5 text-sm text-gray-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.hint ? ` — ${opt.hint}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 text-sm">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    streaming={sending && m.role === 'assistant' && idx === messages.length - 1}
                  />
                ))}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-800 bg-[#0b0d11] p-3">
            {pending.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pending.map((a) => (
                  <AttachmentChip key={a.id} attachment={a} onRemove={() => removePending(a.id)} />
                ))}
              </div>
            )}

            <div className="rounded-lg border border-gray-700 bg-[#1a1d23] focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                rows={1}
                placeholder={
                  sending
                    ? '응답 생성 중...'
                    : '지시하거나 질문하세요. (Enter 전송 · 이미지 붙여넣기 · 파일 드래그)'
                }
                disabled={sending}
                className="block max-h-[200px] min-h-[40px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none disabled:opacity-60"
              />
              <div className="flex items-center justify-between border-t border-gray-800 px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_MIME.join(',')}
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || pending.length >= MAX_ATTACHMENTS}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-800 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    title="파일 첨부 (이미지 · PDF, 최대 5MB)"
                    aria-label="파일 첨부"
                  >
                    <PaperclipIcon />
                  </button>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={sending || capturing || pending.length >= MAX_ATTACHMENTS}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-800 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    title="화면 캡쳐"
                    aria-label="화면 캡쳐"
                  >
                    {capturing ? <SpinnerIcon /> : <CameraIcon />}
                  </button>
                  <span className="ml-1 text-[11px] text-gray-500">
                    {sending ? '생성 중' : pending.length > 0 ? `${pending.length}/${MAX_ATTACHMENTS} 첨부` : '준비됨'}
                  </span>
                </div>
                {sending ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    className="rounded-md bg-gray-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-gray-600"
                  >
                    중단
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() && pending.length === 0}
                    className="flex items-center gap-1 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 px-3 py-1 text-xs font-semibold text-white transition hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500"
                  >
                    전송
                    <ArrowUpIcon />
                  </button>
                )}
              </div>
            </div>
          </form>

          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={startDrag}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent transition hover:bg-amber-500/40"
            title="드래그하여 너비 조절"
          />
        </aside>
      )}
    </>
  );
}

function EmptyState() {
  const examples = [
    '이 화면 캡쳐해서 히어로 섹션 개선안 제안해줘',
    '첨부한 PDF 카탈로그 내용으로 제품 상세 페이지 카피 다듬어줘',
    '제품 카드 호버 인터랙션을 부드럽게 개선하고 싶어',
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 ring-1 ring-amber-500/30">
        <SparkleIcon />
      </div>
      <p className="text-sm font-semibold text-gray-200">무엇을 도와드릴까요?</p>
      <p className="mt-1 text-xs text-gray-500">
        화면 캡쳐 · 파일 첨부 · 붙여넣기 지원
      </p>
      <ul className="mt-6 w-full space-y-1.5 text-left">
        {examples.map((ex) => (
          <li
            key={ex}
            className="rounded-md border border-gray-800 bg-gray-900/40 px-3 py-2 text-xs text-gray-400"
          >
            “{ex}”
          </li>
        ))}
      </ul>
    </div>
  );
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) {
  return (
    <div className="group relative flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/60 p-1.5 pr-6">
      {attachment.type === 'image' && attachment.previewUrl ? (
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-800 text-gray-400">
          <FileIcon />
        </div>
      )}
      <div className="min-w-0 max-w-[120px]">
        <p className="truncate text-[11px] font-medium text-gray-200">{attachment.name}</p>
        <p className="text-[10px] text-gray-500">{formatBytes(attachment.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-gray-300 opacity-80 transition hover:bg-red-600 hover:text-white group-hover:opacity-100"
        aria-label="첨부 제거"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function MessageBubble({ message, streaming }: { message: Message; streaming: boolean }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser ? 'bg-amber-500/90 text-white' : 'bg-gray-800/80 text-gray-100'
        }`}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.attachments.map((a) =>
              a.type === 'image' && a.previewUrl ? (
                <img
                  key={a.id}
                  src={a.previewUrl}
                  alt={a.name}
                  className="max-h-40 rounded-lg border border-white/20 object-cover"
                />
              ) : (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 rounded-md bg-black/20 px-2 py-1 text-[11px]"
                >
                  <FileIcon small />
                  <span className="truncate max-w-[160px]">{a.name}</span>
                </div>
              )
            )}
          </div>
        )}
        {message.tools && message.tools.length > 0 && (
          <div className="mb-2 space-y-1">
            {message.tools.map((t) => (
              <ToolChip key={t.id} tool={t} />
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap">
          {message.content || (streaming ? <TypingDots /> : null)}
          {streaming && message.content && <BlinkingCaret />}
        </div>
      </div>
    </div>
  );
}

function ToolChip({ tool }: { tool: ToolEvent }) {
  const isRunning = tool.status === 'running';
  const isOk = tool.status === 'ok';
  const isErr = tool.status === 'error';
  const ring = isErr
    ? 'border-red-700/60 bg-red-950/40 text-red-200'
    : isOk
    ? 'border-emerald-700/60 bg-emerald-950/30 text-emerald-200'
    : 'border-amber-700/60 bg-amber-950/30 text-amber-200';
  return (
    <div className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[11px] ${ring}`}>
      <span className="mt-[1px] shrink-0">
        {isRunning ? <SpinnerIcon /> : isOk ? <CheckIcon /> : <XIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-semibold tracking-tight">
          {tool.name}
          {isRunning && <span className="ml-1 opacity-70">실행 중…</span>}
        </p>
        {(tool.summary || tool.error) && (
          <p className="mt-0.5 truncate opacity-90">{tool.error ?? tool.summary}</p>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
    </span>
  );
}

function BlinkingCaret() {
  return <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-current align-middle" />;
}

function SparkleIcon({ small = false }: { small?: boolean }) {
  const size = small ? 14 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h4l2-3h6l2 3h4" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function FileIcon({ small = false }: { small?: boolean }) {
  const size = small ? 12 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
