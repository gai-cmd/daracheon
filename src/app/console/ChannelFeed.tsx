'use client';

import { useEffect, useRef, useState } from 'react';
import type { FeedChannelInfo, FeedItemInfo, FeedResponse } from '@/lib/console/types';
import { absTime, badgeTextColor, feedHref, relTime } from '@/lib/console/ui-model';
import { fetchFeed } from './api';
import { useApp } from './app-context';
import { Icon } from './Icon';
import { nextInGroup } from './radio-keys';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

// 홈 "채널 새 소식" 본문 (SPEC-CONSOLE-002 REQ-CS2-035·037·038, design.md §2.15). 칩 한 줄 + 타일 격자.
// 그림은 썸네일 경로('/api/console/feed/thumb?u=…')만 쓴다 — 바깥 호스트 그림을 브라우저가 직접 부르지 않는다.
// 피드가 준 제목·주소는 글자로만 그린다.

const THUMB_PREFIX = '/api/console/feed/thumb?u=';
const ALL = 'all';
const ALL_TILES = 12;
const CHANNEL_TILES = 6;

export type FeedState = FeedResponse | 'loading' | 'error';

const safeColor = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c.toLowerCase() : '#777777');

function Badge({ channel, name }: { channel: FeedChannelInfo; name: string }) {
  const bg = safeColor(channel.color);
  return (
    <span className={s.badge} style={{ background: bg, color: badgeTextColor(bg) }}>
      {name}
    </span>
  );
}

/** 링크 타일로 보일 채널: 인스타그램, 가져오기에 실패한 채널, 보여 줄 글이 하나도 없는 채널 (CS2-D25). */
function needsLinkTile(c: FeedChannelInfo, items: readonly FeedItemInfo[]): boolean {
  return c.kind === 'instagram' || !c.ok || !items.some((i) => i.channelId === c.id);
}

/**
 * initial 이 있으면 그 상태로 그리고 부르지 않는다(정적 렌더 테스트). 없으면 마운트할 때 한 번 부르고, rev 가 바뀌면
 * (관리자가 채널을 저장한 뒤) 새로 받는다. onManage 는 관리자에게만 보이는 빈 상태의 "채널 관리" 버튼.
 */
export default function ChannelFeed({ initial, rev = 0, onManage }: { initial?: FeedState; rev?: number; onManage?: () => void }) {
  const { lang, t } = useUi();
  const app = useApp();
  const [state, setState] = useState<FeedState>(initial ?? 'loading');
  const [pick, setPick] = useState<string>(ALL);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const loadedRev = useRef<number | null>(null);

  useEffect(() => {
    if (initial !== undefined) return;
    let live = true;
    const fresh = loadedRev.current !== null && loadedRev.current !== rev;
    loadedRev.current = rev;
    void fetchFeed(fresh).then((r) => {
      if (live) setState(r ?? 'error');
    });
    return () => {
      live = false;
    };
  }, [initial, rev]);

  const retry = () => {
    setState('loading');
    void fetchFeed(true).then((r) => setState(r ?? 'error'));
  };

  if (state === 'loading') {
    return (
      <div className={s.feedSkel} aria-busy="true" role="status">
        <span className={s.sr}>{t('feed.loading')}</span>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className={s.feedEmpty}>
        <p className={s.formErr}>{t('feed.error')}</p>
        <button type="button" className={cx(s.btn, s.ghost)} onClick={retry}>
          {t('feed.retry')}
        </button>
      </div>
    );
  }

  const { channels, items } = state;
  if (!channels.length) {
    return (
      <div className={s.feedEmpty}>
        <p className={s.hint}>{t('feed.empty')}</p>
        {app.me.isAdmin && onManage ? (
          <button type="button" className={cx(s.btn, s.ghost)} onClick={onManage}>
            {t('mChannels')}
          </button>
        ) : null}
      </div>
    );
  }

  const byId = new Map(channels.map((c) => [c.id, c]));
  const nameOf = (c: FeedChannelInfo) => (lang === 'en' && c.label_en ? c.label_en : c.label);
  const current = pick === ALL || byId.has(pick) ? pick : ALL;
  const ids = [ALL, ...channels.map((c) => c.id)];
  const posts = (current === ALL ? items : items.filter((i) => i.channelId === current))
    .filter((i) => byId.has(i.channelId) && feedHref(i.url))
    .slice(0, current === ALL ? ALL_TILES : CHANNEL_TILES);
  const links = channels.filter((c) => (current === ALL || c.id === current) && needsLinkTile(c, items) && feedHref(c.home));

  const choose = (id: string, focus: boolean) => {
    setPick(id);
    if (focus) chipRefs.current.get(id)?.focus();
  };

  return (
    <>
      <div
        className={s.feedChips}
        role="radiogroup"
        aria-label={t('feed.chips')}
        onKeyDown={(e) => {
          const next = nextInGroup(e, current, ids);
          if (next) choose(next, true);
        }}
      >
        {ids.map((id) => {
          const c = byId.get(id);
          return (
            <button
              key={id}
              ref={(el) => {
                if (el) chipRefs.current.set(id, el);
                else chipRefs.current.delete(id);
              }}
              type="button"
              role="radio"
              className={s.fchip}
              aria-checked={current === id}
              tabIndex={current === id ? 0 : -1}
              onClick={() => choose(id, false)}
            >
              {c ? <span className={s.fdot} style={{ background: safeColor(c.color) }} aria-hidden="true" /> : null}
              {c ? nameOf(c) : t('feed.all')}
            </button>
          );
        })}
      </div>
      {posts.length || links.length ? (
        <ul className={s.tiles}>
          {posts.map((i) => {
            const c = byId.get(i.channelId)!;
            const img = i.thumb && i.thumb.startsWith(THUMB_PREFIX) ? i.thumb : null;
            return (
              <li key={`${i.channelId}:${i.url}`}>
                <a className={s.tile} data-tile="post" href={feedHref(i.url)!} target="_blank" rel="noopener noreferrer">
                  {img ? (
                    <span className={s.tileImg}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- 같은 출처 썸네일 경로, next/image 최적화 불필요 */}
                      <img src={img} alt="" loading="lazy" decoding="async" />
                    </span>
                  ) : (
                    <span className={s.tileImg} data-thumb="none" aria-hidden="true" />
                  )}
                  <span className={s.tileBody}>
                    <Badge channel={c} name={nameOf(c)} />
                    <span className={s.tileT}>{i.title}</span>
                    {i.publishedAt ? (
                      <time className={s.tileD} dateTime={i.publishedAt} title={absTime(lang, i.publishedAt)}>
                        {relTime(lang, i.publishedAt)}
                      </time>
                    ) : null}
                  </span>
                  <span className={s.sr}>{` (${t('feed.newTab')})`}</span>
                </a>
              </li>
            );
          })}
          {links.map((c) => (
            <li key={`link:${c.id}`}>
              <a className={cx(s.tile, s.linkTile)} data-tile="link" href={feedHref(c.home)!} target="_blank" rel="noopener noreferrer">
                <span className={s.tileImg} data-thumb="none" aria-hidden="true">
                  <Icon name="external" size={22} />
                </span>
                <span className={s.tileBody}>
                  <Badge channel={c} name={nameOf(c)} />
                  <span className={s.tileT}>{c.kind === 'instagram' ? t('feed.viewOnInstagram') : t('feed.viewOn', { c: nameOf(c) })}</span>
                </span>
                <span className={s.sr}>{` (${t('feed.newTab')})`}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.hint}>{t('feed.noPosts')}</p>
      )}
    </>
  );
}
