'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { NAVER_LIVE_URL } from '@/lib/naver-live';
import styles from './PromoFilm.module.css';

const BASE = '/naver-live';
const VIDEO_SRC = `${BASE}/daracheon-oil-promo.mp4`;

interface Scene {
  file: string;
  /** 영상 속 시점 (초) */
  at: number;
  caption: string;
}

interface Chapter {
  title: string;
  desc: string;
  scenes: Scene[];
}

// 장면 캡션·설명은 영상 자막에 나온 내용만 옮긴다 (임의 효능 문구 추가 금지).
const CHAPTERS: Chapter[] = [
  {
    title: '원료',
    desc: '베트남산 아갈로차(Aquilaria agallocha Roxb.) 가운데 수지가 밴 부위만 씁니다.',
    scenes: [
      { file: 'agallocha.jpg', at: 6, caption: '베트남산 아갈로차' },
      { file: 'resin.jpg', at: 30, caption: '수지가 밴 침향 부위' },
    ],
  },
  {
    title: '직영 농장',
    desc: '베트남 직영농장 5곳에서 침향나무를 한 그루씩 번호를 붙여 이력을 관리합니다.',
    scenes: [
      { file: 'farm.jpg', at: 20, caption: '베트남 직영농장 5곳' },
      { file: 'trace.jpg', at: 24, caption: '침향나무 개체별 이력 관리' },
    ],
  },
  {
    title: '추출',
    desc: '목질을 걷어내고 수지 부위만 골라 72시간 연속 증류해 오일을 얻습니다.',
    scenes: [
      { file: 'select.jpg', at: 33, caption: '목질 제거 · 수지 부위 선별' },
      { file: 'distill.jpg', at: 36, caption: '72시간 연속 증류' },
      { file: 'oil.jpg', at: 39, caption: '침향 오일' },
    ],
  },
  {
    title: '검증',
    desc: '재배시설 등록부터 DNA 수종 분석, 식품안전관리 인증까지 서류로 확인합니다.',
    scenes: [
      { file: 'facility.jpg', at: 48, caption: '등록·관리되는 침향 재배시설' },
      { file: 'dna.jpg', at: 57, caption: 'DNA 분석을 통한 침향 수종 확인' },
      { file: 'haccp.jpg', at: 63, caption: 'HACCP · ISO 22000 · OCOP 4성' },
    ],
  },
  {
    title: '제품',
    desc: '그렇게 얻은 침향오일을 한 알에 담았습니다. 1캡슐당 침향오일 3mg.',
    scenes: [
      { file: 'capsule.jpg', at: 15, caption: '한 알에 담기까지' },
      { file: 'dose.jpg', at: 75, caption: '1캡슐당 침향오일 3mg' },
      { file: 'pack.jpg', at: 81, caption: '대라천 참 침향오일' },
    ],
  },
];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function PromoFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<string | null>(null);

  const seek = (scene: Scene) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = scene.at;
    setActive(scene.file);
    v.scrollIntoView({ behavior: 'smooth', block: 'center' });
    void v.play().catch(() => {
      /* autoplay 차단 시 위치만 옮겨 둔다 */
    });
  };

  return (
    <section className={styles.film} aria-labelledby="film-title">
      <p className={styles.kicker}>PROMOTION FILM</p>
      <h2 id="film-title" className={styles.title}>
        한 알에 담기까지
      </h2>
      <p className={styles.lede}>
        라이브에서 소개할 대라천 참 침향오일, 농장에서 캡슐이 되기까지를 90초 영상에 담았습니다.
      </p>

      <div className={styles.player}>
        <video
          ref={videoRef}
          className={styles.video}
          src={VIDEO_SRC}
          poster={`${BASE}/poster.jpg`}
          controls
          playsInline
          preload="metadata"
        />
      </div>

      <ol className={styles.chapters}>
        {CHAPTERS.map((c, i) => (
          <li key={c.title} className={styles.chapter}>
            <div className={styles.chapterHead}>
              <span className={styles.chapterNo}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className={styles.chapterTitle}>{c.title}</h3>
                <p className={styles.chapterDesc}>{c.desc}</p>
              </div>
            </div>
            <div className={styles.scenes} data-count={c.scenes.length}>
              {c.scenes.map((s) => (
                <button
                  key={s.file}
                  type="button"
                  className={`${styles.scene} ${active === s.file ? styles.sceneActive : ''}`}
                  onClick={() => seek(s)}
                  aria-label={`${s.caption} 장면부터 영상 재생 (${mmss(s.at)})`}
                >
                  <span className={styles.thumb}>
                    <Image
                      src={`${BASE}/${s.file}`}
                      alt={s.caption}
                      fill
                      sizes="(max-width: 720px) 100vw, 360px"
                      className={styles.img}
                    />
                    <span className={styles.time}>▶ {mmss(s.at)}</span>
                  </span>
                  <span className={styles.caption}>{s.caption}</span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.closing}>
        <p className={styles.closingText}>영상 속 이야기, 라이브에서 직접 묻고 들어 보세요.</p>
        <a className={styles.cta} href={NAVER_LIVE_URL} target="_blank" rel="noopener noreferrer">
          네이버에서 알림받기
        </a>
      </div>
    </section>
  );
}
