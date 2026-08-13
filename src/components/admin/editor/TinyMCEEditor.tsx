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
        // 한국어 language pack 은 npm tinymce 패키지에 포함되어 있지 않음.
        // 필요하면 https://www.tiny.cloud/get-tiny/language-packages/ 에서
        // 다운로드해 public/tinymce/langs/ko_KR.js 로 배치 후 아래 주석 해제.
        // language: 'ko_KR',
        plugins: 'link image table lists code media quickbars',
        toolbar:
          'undo redo | blocks fontsize | bold italic forecolor | alignleft aligncenter alignright | bullist numlist | link image imgcaption imgalt media table | code',
        // 플로팅 퀵바 — 이미지 클릭 시 캡션 토글이 바로 보이게 한다.
        // (텍스트 선택/삽입 퀵바는 메인 툴바와 중복이라 끈다.)
        quickbars_insert_toolbar: false,
        quickbars_selection_toolbar: false,
        quickbars_image_toolbar: 'imgcaption imgalt | alignleft aligncenter alignright',
        // 이미지 선택 시 캡션(figure/figcaption)을 넣고 빼는 토글 버튼.
        // image_caption 대화상자 체크박스와 동일한 마크업(<figure class="image">)을
        // 만들므로 새니타이저·공개 렌더 CSS 와 그대로 호환된다.
        setup: (editor) => {
          const findImg = (): HTMLImageElement | null => {
            const node = editor.selection.getNode();
            if (node.nodeName === 'IMG') return node as HTMLImageElement;
            return node.querySelector?.('img') ?? null;
          };
          const hasCaption = (): boolean =>
            !!findImg()?.closest('figure')?.querySelector('figcaption');
          editor.ui.registry.addToggleButton('imgcaption', {
            icon: 'comment',
            tooltip: '이미지 캡션 넣기/빼기',
            onSetup: (api) => {
              const update = () => {
                api.setEnabled(!!findImg());
                api.setActive(hasCaption());
              };
              editor.on('NodeChange', update);
              update();
              return () => editor.off('NodeChange', update);
            },
            onAction: () => {
              const img = findImg();
              if (!img) return;
              const fig = img.closest('figure');
              if (fig && fig.querySelector('figcaption')) {
                // 캡션 제거 — figure 를 벗겨 원래의 단독 이미지로 되돌린다.
                fig.parentNode?.insertBefore(img, fig);
                fig.remove();
                editor.selection.select(img);
              } else {
                const figure = editor.dom.create('figure', { class: 'image' });
                const caption = editor.dom.create('figcaption', {}, '캡션을 입력하세요');
                img.parentNode?.insertBefore(figure, img);
                figure.appendChild(img);
                figure.appendChild(caption);
                // 커서를 캡션으로 옮겨 바로 타이핑할 수 있게 한다.
                editor.selection.select(caption, true);
              }
              editor.undoManager.add();
              editor.fire('change');
            },
          });
          // 이미지 대체텍스트(alt) 입력 — SEO 체커의 "이미지 대체텍스트" 항목과
          // 스크린리더 접근성을 위한 필드. 작은 대화상자로 편집한다.
          editor.ui.registry.addToggleButton('imgalt', {
            icon: 'accessibility-check',
            tooltip: '대체텍스트(alt) 입력',
            onSetup: (api) => {
              const update = () => {
                const img = findImg();
                api.setEnabled(!!img);
                api.setActive(!!img?.getAttribute('alt'));
              };
              editor.on('NodeChange', update);
              update();
              return () => editor.off('NodeChange', update);
            },
            onAction: () => {
              const img = findImg();
              if (!img) return;
              editor.windowManager.open({
                title: '이미지 대체텍스트 (alt)',
                body: {
                  type: 'panel',
                  items: [
                    {
                      type: 'input',
                      name: 'alt',
                      label: '이미지 내용을 설명하는 문장 (검색엔진·스크린리더용)',
                    },
                  ],
                },
                initialData: { alt: img.getAttribute('alt') ?? '' },
                buttons: [
                  { type: 'cancel', text: '취소' },
                  { type: 'submit', text: '저장', primary: true },
                ],
                onSubmit: (api) => {
                  const alt = (api.getData() as { alt: string }).alt.trim();
                  if (alt) img.setAttribute('alt', alt);
                  else img.removeAttribute('alt');
                  api.close();
                  editor.undoManager.add();
                  editor.fire('change');
                  editor.nodeChanged();
                },
              });
            },
          });
        },
        block_formats:
          '본문=p; 제목 1=h1; 제목 2=h2; 제목 3=h3; 인용=blockquote; 코드=pre',
        // 폰트 크기 — px 고정 목록 (본문 기본 16px 기준)
        font_size_formats: '12px 14px 16px 18px 20px 24px 28px 32px',
        // 폰트 색 — 다크 리딩 표면에서 읽히는 밝은 톤 위주의 브랜드 팔레트.
        // 공개 렌더는 명도 정규화(lib/blog/theme-normalize.ts)가 어두운 글자색
        // (luminance < 0.35)을 제거하므로, 여기서 어두운 색을 골라도 발행
        // 화면에는 반영되지 않는다 — 팔레트를 밝은 톤으로 큐레이션한 이유.
        color_map: [
          'D4A843', '골드',
          'E8C97A', '연골드',
          'FDFBF7', '크림',
          'C9C4B8', '밝은 회색',
          'E06A5A', '레드',
          'F0A98E', '살구',
          '8FBF8F', '그린',
          '8FB8E0', '블루',
        ],
        // 이미지 캡션 — 이미지 대화상자의 "캡션 표시" 체크 시
        // <figure class="image"><img/><figcaption/></figure> 로 감싼다.
        // 새니타이저(figure/figcaption 허용)와 공개 렌더 CSS(.article figcaption)
        // 모두 이미 지원.
        image_caption: true,
        // 행간은 블록 서식별로 다르게 — 공개 렌더(BlogArticle.module.css)와 동일 비율.
        // 큰 제목일수록 조이고(1.3~1.4), 본문은 넉넉하게(1.85) — 균형 유지.
        content_style: [
          'body { font-family: "Noto Sans KR", sans-serif; font-size: 16px; line-height: 1.85; color: #333; }',
          'h1, h2, h3 { font-family: "Noto Serif KR", serif; }',
          'h1 { font-size: 1.8em; font-weight: 300; margin: 1em 0 0.5em; line-height: 1.3; }',
          'h2 { font-size: 1.4em; font-weight: 500; color: #b8862c; margin: 1.6em 0 0.6em; padding-top: 0.6em; border-top: 1px solid rgba(212,168,67,0.2); line-height: 1.35; }',
          'h3 { font-size: 1.15em; font-weight: 500; margin: 1.2em 0 0.4em; line-height: 1.4; }',
          'p { margin: 0 0 1em; }',
          'a { color: #b8862c; text-decoration: underline; }',
          'blockquote { border-left: 3px solid #d4a843; padding-left: 16px; margin: 1em 0; color: #555; font-style: italic; line-height: 1.75; }',
          'pre { line-height: 1.7; }',
          'img { max-width: 100%; height: auto; border: 1px solid rgba(212,168,67,0.2); }',
          'iframe { max-width: 100%; aspect-ratio: 16 / 9; height: auto; border: 0; display: block; margin: 1.5em 0; }',
          'figure { margin: 1.5em 0; }',
          'figcaption { font-family: "Noto Sans KR", sans-serif; font-size: 0.85em; line-height: 1.6; color: #777; text-align: center; margin-top: 8px; }',
          'table { border-collapse: collapse; width: 100%; }',
          'th, td { border: 1px solid #ddd; padding: 8px 12px; line-height: 1.65; }',
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
        // 영상 — YouTube 임베드 전용 (URL 붙여넣기 → iframe 변환; 파일 업로드 아님).
        // 공개 렌더 새니타이저(lib/blog/sanitize.ts)가 youtube/youtube-nocookie/
        // drive.google.com iframe 만 허용하므로 다른 호스트는 발행 시 제거된다.
        media_alt_source: false,
        media_poster: false,
        media_dimensions: false,
        media_url_resolver: (data: { url: string }) => {
          const m = data.url.match(
            /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/
          );
          if (m) {
            return Promise.resolve({
              html: `<iframe src="https://www.youtube.com/embed/${m[1]}" width="560" height="315" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
            });
          }
          // 그 외 URL 은 기본 처리(대부분 발행 시 새니타이저에서 제거됨)
          return Promise.resolve({ html: '' });
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
