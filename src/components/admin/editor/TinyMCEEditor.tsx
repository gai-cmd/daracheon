'use client';

import { Editor, type IAllProps } from '@tinymce/tinymce-react';
import { useRef } from 'react';

/**
 * TinyMCE 7 self-host 에디터.
 *
 * `node_modules/tinymce` 의 정적 자산을 빌드 시점에 `public/tinymce/` 로
 * 복사(scripts/copy-tinymce.mjs) 해 두고, 클라이언트에서 base_url='/tinymce'
 * 로 동적 로드. tinymceScriptSrc 를 명시하면 React wrapper 가 cdn 대신
 * 우리 도메인 스크립트를 사용 — API key 불필요.
 *
 * 사용자 사양:
 *   - plugins: link, image, table, lists, code, media
 *   - toolbar: undo/redo · 블록 서식 · 굵게/이탤릭 · 정렬 · 리스트 · 링크/이미지/표 · 코드 보기
 *   - height: 1000px
 *   - 이미지 업로드: /api/admin/upload 사용 (Vercel Blob 으로 자동 업로드)
 */

interface Props {
  value: string;
  onChange: (html: string) => void;
}

type EditorInstance = Parameters<NonNullable<IAllProps['onInit']>>[1];

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  form.append('subdir', 'blog');
  try {
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean; url?: string; message?: string };
    if (!res.ok || !data.success || !data.url) {
      console.error('[TinyMCE] upload failed:', data?.message);
      return null;
    }
    return data.url;
  } catch (err) {
    console.error('[TinyMCE] upload threw:', err);
    return null;
  }
}

export default function TinyMCEEditor({ value, onChange }: Props) {
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      onInit={(_evt, editor) => {
        editorRef.current = editor;
      }}
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        base_url: '/tinymce',
        suffix: '.min',
        height: 1000,
        menubar: false,
        branding: false,
        promotion: false,
        statusbar: true,
        language: 'ko_KR',
        // 한국어 language pack 은 self-host 안에 포함 안 되어 있어 미설치
        // 시 영문으로 fallback. 필요하면 별도 추가.
        plugins: 'link image table lists code media',
        toolbar:
          'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image table | code',
        block_formats:
          '본문=p; 제목 1=h1; 제목 2=h2; 제목 3=h3; 인용=blockquote; 코드=pre',
        content_style: [
          'body { font-family: "Noto Sans KR", sans-serif; font-size: 16px; line-height: 1.85; color: #333; }',
          'h1, h2, h3 { font-family: "Noto Serif KR", serif; }',
          'h1 { font-size: 1.8em; font-weight: 300; margin: 1em 0 0.5em; }',
          'h2 { font-size: 1.4em; font-weight: 500; color: #b8862c; margin: 1.6em 0 0.6em; padding-top: 0.6em; border-top: 1px solid rgba(212,168,67,0.2); }',
          'h3 { font-size: 1.15em; font-weight: 500; margin: 1.2em 0 0.4em; }',
          'p { margin: 0 0 1em; }',
          'a { color: #b8862c; text-decoration: underline; }',
          'blockquote { border-left: 3px solid #d4a843; padding-left: 16px; margin: 1em 0; color: #555; font-style: italic; }',
          'img { max-width: 100%; height: auto; border: 1px solid rgba(212,168,67,0.2); }',
          'figure { margin: 1.5em 0; }',
          'figcaption { font-family: "JetBrains Mono", monospace; font-size: 0.75em; letter-spacing: 0.15em; text-transform: uppercase; color: #888; text-align: center; margin-top: 8px; }',
          'table { border-collapse: collapse; width: 100%; }',
          'th, td { border: 1px solid #ddd; padding: 8px 12px; }',
          'th { background: rgba(212,168,67,0.08); color: #b8862c; }',
        ].join('\n'),
        // 이미지 — 붙여넣기/드래그/파일선택 모두 Vercel Blob 으로 업로드.
        // 외부 CDN 의존 금지 정책(CLAUDE.md) 준수.
        images_upload_handler: async (blobInfo) => {
          const file = new File([blobInfo.blob()], blobInfo.filename(), {
            type: blobInfo.blob().type,
          });
          const url = await uploadImage(file);
          if (!url) throw new Error('이미지 업로드 실패');
          return url;
        },
        automatic_uploads: true,
        paste_data_images: true,
        file_picker_types: 'image',
        file_picker_callback: (cb, _value, meta) => {
          if (meta.filetype !== 'image') return;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.addEventListener('change', async (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) return;
            const url = await uploadImage(file);
            if (!url) {
              alert('이미지 업로드에 실패했습니다.');
              return;
            }
            cb(url, { alt: file.name });
          });
          input.click();
        },
        // 링크 — 새 창 열기 옵션
        link_default_target: '_blank',
        link_assume_external_targets: 'https',
        // 테이블 디폴트 옵션
        table_default_attributes: { class: 'blog-table' },
      }}
    />
  );
}
