import type { FaqEntry } from '@/lib/seo/home-faq';
import story from '@/styles/zoel/story-page.module.css';
import styles from './TopicHub.module.css';

/**
 * 화면에 보이는 FAQ 섹션 — 같은 entries 로 FAQPage 구조화 데이터를 만들어야 한다
 * (구글: 구조화 데이터는 페이지에 보이는 콘텐츠를 설명해야 함).
 * 답변은 <details> 안에 있어도 HTML 에 실려 검색·AI 크롤러가 읽는다.
 */
export default function FaqSection({
  id = 'faq',
  title,
  entries,
  alt = true,
}: {
  id?: string;
  title: string;
  entries: FaqEntry[];
  alt?: boolean;
}) {
  return (
    <section id={id} className={`${story.chapter} ${alt ? story.chapterAlt : ''} ${styles.anchor}`} aria-labelledby={`${id}-title`}>
      <div className={story.wrap}>
        <h2 id={`${id}-title`} className={styles.centerTitle}>
          {title}
        </h2>
        <div className={styles.faqList}>
          {entries.map((f, i) => (
            <details key={f.q} className={styles.faqItem} open={i === 0}>
              <summary className={styles.faqSummary}>
                <h3 className={styles.faqQ}>{f.q}</h3>
                <span className={styles.faqIcon} aria-hidden="true" />
              </summary>
              <p className={styles.faqA}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
