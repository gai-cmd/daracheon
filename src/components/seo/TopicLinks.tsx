import Link from 'next/link';
import story from '@/styles/zoel/story-page.module.css';
import styles from './TopicHub.module.css';

export interface TopicLink {
  href: string;
  label: string;
  desc: string;
}

/** 주제 클러스터 내부 링크 카드 — 앵커 텍스트가 곧 검색어가 되도록 label 을 짧게 둔다. */
export default function TopicLinks({ title, links }: { title: string; links: TopicLink[] }) {
  return (
    <section className={story.chapter} aria-labelledby="topic-links-title">
      <div className={story.wrap}>
        <h2 id="topic-links-title" className={styles.centerTitle}>
          {title}
        </h2>
        <ul className={styles.related}>
          {links.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className={styles.relatedCard}>
                <span className={styles.relatedLabel}>{r.label}</span>
                <span className={styles.relatedDesc}>{r.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
