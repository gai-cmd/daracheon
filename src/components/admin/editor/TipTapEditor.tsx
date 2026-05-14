'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import EditorToolbar from './EditorToolbar';
import { buildExtensions, MAX_CHARS } from './extensions';
import './editor.css';

export interface TipTapEditorProps {
  /** Current HTML content. Used as the initial value; subsequent re-renders
   *  do NOT re-mount the editor — call `setContent` from a parent ref if you
   *  need to programmatically reset. */
  value: string;
  /** Optional JSON content. If provided, takes precedence over `value` on
   *  initial load (lossless re-edit). */
  jsonValue?: JSONContent;
  /** Fired on every transaction with the sanitized output. */
  onChange: (next: { html: string; json: JSONContent; text: string; chars: number }) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function TipTapEditor({
  value,
  jsonValue,
  onChange,
  placeholder,
  autoFocus,
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: buildExtensions({ placeholder }),
    content: jsonValue ?? value ?? '',
    autofocus: autoFocus ?? false,
    // Critical for Next.js App Router — Next renders the page on the server
    // first; without this flag TipTap hydrates twice and throws.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap-content prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const json = e.getJSON();
      const text = e.getText();
      const chars = e.storage.characterCount?.characters?.() ?? text.length;
      onChange({ html, json, text, chars });
    },
  });

  // External programmatic resets (e.g. loading a different post) — only
  // apply when the incoming content is materially different from current,
  // otherwise we'd thrash the editor on every parent re-render.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (jsonValue) {
      const incomingHtml = JSON.stringify(jsonValue);
      const currentJson = JSON.stringify(editor.getJSON());
      if (incomingHtml !== currentJson) {
        editor.commands.setContent(jsonValue, { emitUpdate: false });
      }
      return;
    }
    if (value !== undefined && value !== current && value !== '') {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value, jsonValue]);

  if (!editor) {
    return (
      <div className="min-h-[400px] rounded border border-warm-300 bg-white p-4 text-sm text-warm-600">
        에디터 로딩 중…
      </div>
    );
  }

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className={['relative rounded border border-warm-300 bg-white', className ?? ''].join(' ')}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-warm-200 bg-warm-50 px-3 py-1.5 text-[11px] text-warm-600">
        <span>
          글자 {chars.toLocaleString()} · 단어 {words.toLocaleString()}
        </span>
        <span className={chars > MAX_CHARS * 0.9 ? 'font-semibold text-terracotta' : ''}>
          최대 {MAX_CHARS.toLocaleString()}자
        </span>
      </div>
    </div>
  );
}
