'use client';

import { useEffect, useMemo, useState } from 'react';
import { isStoredImageUrl, listBodyImages, setBodyImageAlt, type BodyImage } from '@/lib/blog/image-alt';
import styles from './BlogPostForm.module.css';

interface Props {
  html: string;
  onChange: (html: string) => void;
}

/**
 * 본문 이미지 대체텍스트(alt) 일괄 편집 패널.
 * 에디터 툴바의 alt 버튼은 이미지를 하나씩 눌러야 보이므로, 본문의 모든 이미지를
 * 한눈에 보고 빠진 alt 를 채울 수 있게 목록으로 펼친다. 해당 <img> 의 alt 속성만 바꾼
 * HTML 을 에디터에 되돌린다 (lib/blog/image-alt).
 */
export default function ImageAltPanel({ html, onChange }: Props) {
  const images = useMemo(() => listBodyImages(html), [html]);
  const missing = images.filter((img) => !img.alt?.trim()).length;

  if (images.length === 0) {
    return <p className={styles.help}>본문에 이미지가 없습니다.</p>;
  }

  return (
    <div className={styles.altPanel}>
      <p className={styles.help}>
        본문 이미지 {images.length}장 · 대체텍스트 없음{' '}
        <strong className={missing ? styles.altMissingCount : undefined}>{missing}장</strong>
        {' '}— 이미지가 무엇을 보여 주는지 한 문장(20~80자)으로 적어 주세요. 검색엔진과 화면 낭독기가 이 글을 읽습니다.
      </p>
      <ul className={styles.altList}>
        {images.map((img) => (
          <AltRow
            key={img.index}
            img={img}
            onCommit={(alt) => onChange(setBodyImageAlt(html, img.index, alt))}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * 입력 중에는 칸 안의 값만 바꾸고, 칸을 벗어날 때(또는 Enter) 한 번만 본문에 반영한다.
 * 키 입력마다 에디터의 controlled value 를 다시 쓰면 TinyMCE 가 속성값 끝 공백을 잘라
 * 띄어쓰기가 사라지고, 본문 전체를 매번 다시 그리며 undo 기록도 글자 단위로 쌓인다.
 */
function AltRow({ img, onCommit }: { img: BodyImage; onCommit: (alt: string) => void }) {
  const saved = img.alt ?? '';
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(false);
  const external = !isStoredImageUrl(img.src);

  // 편집 중이 아닐 때만 본문 쪽 값(에디터 alt 버튼으로 바꾼 값 등)을 따라간다.
  useEffect(() => {
    if (!editing) setDraft(saved);
  }, [saved, editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== saved) onCommit(next);
  };

  return (
    <li className={styles.altRow}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.src} alt="" className={styles.altThumb} loading="lazy" />
      <div className={styles.altField}>
        <label className={styles.label} htmlFor={`img-alt-${img.index}`}>
          이미지 {img.index + 1}
          {!saved.trim() && <span className={styles.altBadge}>대체텍스트 없음</span>}
          {external && (
            <span className={styles.altBadge}>외부 이미지 — 저장하면 본문에서 삭제됩니다. 이미지 업로드로 다시 넣어 주세요</span>
          )}
        </label>
        <input
          id={`img-alt-${img.index}`}
          className={styles.input}
          value={draft}
          maxLength={150}
          placeholder="예: 베트남 하띤 농장에서 침향나무 수피에 상처를 내는 모습"
          onFocus={() => setEditing(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            // Enter 로 폼이 제출되지 않게 막고 반영만 한다. 한글 조합 중 Enter 는 그대로 둔다.
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
        <span className={styles.help}>{draft.length}자 · 입력칸을 벗어나면 본문에 반영됩니다</span>
      </div>
    </li>
  );
}
