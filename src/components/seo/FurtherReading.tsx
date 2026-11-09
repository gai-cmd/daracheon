import Link from 'next/link';
import story from '@/styles/zoel/story-page.module.css';
import styles from './TopicHub.module.css';
import type { FurtherReadingPost } from '@/lib/blog/further-reading';

/** 허브 페이지 하단 "더 읽어보기" — 블로그 글 링크 카드. 목록이 비면 영역을 그리지 않는다. */
export default function FurtherReading({ posts }: { posts: FurtherReadingPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section className={story.chapter} aria-labelledby="further-reading-title">
      <div className={story.wrap}>
        <h2 id="further-reading-title" className={styles.centerTitle}>
          더 읽어보기
        </h2>
        <ul className={styles.related}>
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className={styles.relatedCard}>
                <span className={styles.relatedLabel}>{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
