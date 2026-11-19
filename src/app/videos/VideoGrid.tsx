'use client';

import { useContext } from 'react';
import Image from 'next/image';
import { VideoContext } from '../BentoClient';

/** /videos 영상 카드 격자 — 누르면 홈과 같은 유튜브 모달로 재생한다. */
export default function VideoGrid({ sources }: { sources: string[] }) {
  const { videos, open } = useContext(VideoContext);
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {videos.map((v, i) => (
        <li key={v.id}>
          <button
            type="button"
            onClick={() => open(i)}
            aria-label={`${v.title} 재생`}
            className="group block w-full text-left"
          >
            <span className="relative block aspect-video overflow-hidden rounded-lg border border-[#3a3328] bg-[#16140f]">
              <Image
                src={v.thumbnail}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 320px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute left-2 top-2 rounded-full bg-[#e02424] px-2 py-0.5 text-xs font-semibold text-white">
                ▶ 유튜브
              </span>
              <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111]">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path fill="currentColor" d="M8 5.5v13l11-6.5z" />
                </svg>
              </span>
            </span>
            <span className="mt-3 line-clamp-2 block text-base font-medium leading-snug text-[#fdfbf7]">{v.title}</span>
            <span className="mt-1 block truncate text-xs text-[#a39b8b]">
              {v.date}
              {sources[i] ? ` · ${sources[i]}` : ''}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
