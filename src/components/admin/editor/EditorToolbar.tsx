'use client';

import { useRef, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import { uploadImage } from './extensions/ImageWithUpload';

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}

function TBtn({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={[
        'inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-1.5 text-sm transition-colors',
        active ? 'bg-gold-100 text-gold-800' : 'text-warm-700 hover:bg-warm-100',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-warm-300" aria-hidden />;
}

interface EditorToolbarProps {
  editor: Editor;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [ytOpen, setYtOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState('');

  async function handleFile(file: File) {
    setImgUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } finally {
      setImgUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function openLinkForm() {
    const prev = editor.getAttributes('link').href as string | undefined;
    setLinkUrl(prev ?? '');
    setLinkOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  }

  function applyYoutube() {
    const url = ytUrl.trim();
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
    setYtOpen(false);
    setYtUrl('');
  }

  return (
    <div className="sticky top-0 z-10 -mx-px flex flex-wrap items-center gap-0.5 border-b border-warm-200 bg-warm-50/95 px-2 py-1.5 backdrop-blur">
      {/* Headings */}
      <select
        value={
          editor.isActive('heading', { level: 1 })
            ? '1'
            : editor.isActive('heading', { level: 2 })
              ? '2'
              : editor.isActive('heading', { level: 3 })
                ? '3'
                : editor.isActive('heading', { level: 4 })
                  ? '4'
                  : 'p'
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 | 4 }).run();
        }}
        className="h-8 rounded border border-warm-300 bg-white px-1.5 text-xs text-warm-800"
        aria-label="블록 타입"
      >
        <option value="p">본문</option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
        <option value="4">H4</option>
      </select>

      <Divider />

      {/* Marks */}
      <TBtn title="굵게 (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </TBtn>
      <TBtn title="기울임 (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </TBtn>
      <TBtn title="밑줄 (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </TBtn>
      <TBtn title="취소선" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </TBtn>
      <TBtn title="인라인 코드" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        {'<>'}
      </TBtn>

      <Divider />

      {/* Lists */}
      <TBtn title="글머리 목록" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •≡
      </TBtn>
      <TBtn title="번호 목록" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </TBtn>
      <TBtn title="체크리스트" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        ☑
      </TBtn>

      <Divider />

      {/* Align */}
      <TBtn title="좌측 정렬" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        ⇤
      </TBtn>
      <TBtn title="가운데 정렬" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        ↔
      </TBtn>
      <TBtn title="우측 정렬" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        ⇥
      </TBtn>

      <Divider />

      {/* Blocks */}
      <TBtn title="인용" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </TBtn>
      <TBtn title="코드 블록" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        {'{}'}
      </TBtn>
      <TBtn title="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ─
      </TBtn>
      <TBtn
        title="표 삽입"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        ▦
      </TBtn>

      <Divider />

      {/* Embeds */}
      <TBtn title="링크" active={editor.isActive('link')} onClick={openLinkForm}>
        🔗
      </TBtn>
      <TBtn title="이미지 업로드" onClick={() => setImgOpen((v) => !v)}>
        🖼
      </TBtn>
      <TBtn title="YouTube 임베드" onClick={() => setYtOpen((v) => !v)}>
        ▶
      </TBtn>

      <Divider />

      <TBtn title="실행 취소 (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </TBtn>
      <TBtn title="다시 실행 (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </TBtn>

      {/* Link popover */}
      {linkOpen && (
        <div className="absolute left-2 top-12 z-20 w-80 rounded-md border border-warm-300 bg-white p-3 shadow-lg">
          <label className="mb-1 block text-xs font-semibold text-warm-800">링크 URL</label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyLink();
              if (e.key === 'Escape') setLinkOpen(false);
            }}
            className="w-full rounded border border-warm-300 px-2 py-1 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
          />
          <div className="mt-2 flex justify-end gap-1">
            <button type="button" onClick={() => setLinkOpen(false)} className="rounded px-2 py-1 text-xs text-warm-700 hover:bg-warm-100">
              취소
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkOpen(false);
                  setLinkUrl('');
                }}
                className="rounded px-2 py-1 text-xs text-terracotta hover:bg-terracotta-bg"
              >
                링크 제거
              </button>
            )}
            <button type="button" onClick={applyLink} className="rounded bg-warm-900 px-3 py-1 text-xs font-semibold text-warm-50 hover:bg-warm-800">
              적용
            </button>
          </div>
        </div>
      )}

      {/* Image popover */}
      {imgOpen && (
        <div className="absolute left-2 top-12 z-20 w-80 rounded-md border border-warm-300 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-warm-800">이미지 업로드</p>
          <p className="mb-2 text-[11px] text-warm-600">
            파일 선택, 드래그, 또는 Ctrl+V 붙여넣기로 추가합니다. 외부 URL 직접 삽입은 지원하지 않습니다 — 모든
            이미지는 Vercel Blob 으로 업로드됩니다.
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={imgUploading}
            className="w-full rounded border border-warm-300 px-2 py-2 text-sm text-warm-800 hover:bg-warm-100 disabled:opacity-50"
          >
            {imgUploading ? '업로드 중…' : '파일 선택'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f).then(() => setImgOpen(false));
            }}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setImgOpen(false)}
              className="rounded px-2 py-1 text-xs text-warm-700 hover:bg-warm-100"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* YouTube popover */}
      {ytOpen && (
        <div className="absolute left-2 top-12 z-20 w-80 rounded-md border border-warm-300 bg-white p-3 shadow-lg">
          <label className="mb-1 block text-xs font-semibold text-warm-800">YouTube URL</label>
          <input
            type="url"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyYoutube();
              if (e.key === 'Escape') setYtOpen(false);
            }}
            className="w-full rounded border border-warm-300 px-2 py-1 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
          />
          <div className="mt-2 flex justify-end gap-1">
            <button type="button" onClick={() => setYtOpen(false)} className="rounded px-2 py-1 text-xs text-warm-700 hover:bg-warm-100">
              취소
            </button>
            <button type="button" onClick={applyYoutube} className="rounded bg-warm-900 px-3 py-1 text-xs font-semibold text-warm-50 hover:bg-warm-800">
              삽입
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
