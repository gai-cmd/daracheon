import LegalMarkdown from './LegalMarkdown';
import styles from './LegalPage.module.css';

interface Props {
  kicker: string;
  title: string;
  effectiveDate?: string;
  content: string;
}

export default function LegalPage({ kicker, title, effectiveDate, content }: Props) {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.kicker}>{kicker}</div>
          <h1 className={styles.title}>{title}</h1>
          {effectiveDate && (
            <p className={styles.meta}>시행일: {effectiveDate}</p>
          )}
        </div>
      </header>
      <section className={styles.body}>
        <div className={styles.inner}>
          <LegalMarkdown content={content} />
        </div>
      </section>
    </article>
  );
}
