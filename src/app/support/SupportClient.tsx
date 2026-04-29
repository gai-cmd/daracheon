'use client';

import { useState, type FormEvent } from 'react';
import type { FaqItem } from '@/data/company';
import styles from './page.module.css';
import storyStyles from '@/styles/zoel/story-page.module.css';

export interface SupportHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
  heroImage?: string;
}

export interface SupportChannel {
  num: string;
  label: string;
  title: string;
  sub: string;
  value: string;
  hint: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface SupportCompanyInfoRow {
  dt: string;
  dd: string;
  bold?: string;
}

export interface SupportCompanyInfo {
  rows: SupportCompanyInfoRow[];
}

export interface SupportMapLabel {
  title: string;
  address: string;
}

export interface SupportData {
  hero?: SupportHero;
  channels?: SupportChannel[];
  sampleLots?: string[];
  productOptions?: string[];
  companyInfo?: SupportCompanyInfo;
  mapLabel?: SupportMapLabel;
}

interface SupportClientProps {
  faqItems: FaqItem[];
  supportData: SupportData | null;
}

const TOPICS = [
  '제품 상담',
  '주문·배송',
  'Lot·인증서',
  '대량 주문',
  '미디어 취재',
  '기타',
] as const;

function FragmentRow({ row }: { row: SupportCompanyInfoRow }) {
  return (
    <>
      <dt>{row.dt}</dt>
      <dd>
        {row.dd}
        {row.bold && (
          <>
            {' '}
            <b>{row.bold}</b>
          </>
        )}
      </dd>
    </>
  );
}

export default function SupportClient({ faqItems, supportData }: SupportClientProps) {
  const hero = supportData?.hero;
  const channels = supportData?.channels ?? [];
  const sampleLots = supportData?.sampleLots ?? [];
  const productOptions = supportData?.productOptions ?? [];
  const companyInfo = supportData?.companyInfo;
  const mapLabel = supportData?.mapLabel;

  const phoneChannel = channels.find((c) => c.label === 'Phone') ?? channels[0];

  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('sending');
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          subject: `[${topic}] ${data.get('subject') || '문의'}`,
          message: data.get('message'),
        }),
      });
      if (res.ok) {
        setFormState('sent');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2800);
        form.reset();
      } else {
        setFormState('error');
      }
    } catch {
      setFormState('error');
    }
  }

  return (
    <>
      {/* HERO */}
      <section className={`${storyStyles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '108px' }}>
        {hero?.heroImage && (
          <div className={storyStyles.heroBg} aria-hidden="true" style={{ backgroundImage: `url("${hero.heroImage}")` }} />
        )}
        <div className="orn-plume" aria-hidden style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }} />
        <div className={storyStyles.wrap}>
          <div className={storyStyles.kicker}>{hero?.kicker ?? '문의하기 · Support'}</div>
          <div className={storyStyles.heroMain}>
            <h1>
              {hero?.titleLine1 ?? '무엇을'}
              <br />
              <em>{hero?.titleEmphasis ?? '도와드릴까요'}</em>
            </h1>
            <p className={storyStyles.lede}>
              {hero?.lede ?? '제품 상담부터 Lot 인증서 조회까지. 대라천이 직접 답변드립니다.'}
            </p>
          </div>
        </div>
      </section>

      {/* FORM + PHONE INQUIRY */}
      <section className={styles.main} id="contact">
        <div className={styles.wrap}>
          <div className={styles.mainGrid}>
            {/* Inquiry form */}
            <div className={styles.col}>
              <div className={styles.colHead}>01 · General Inquiry</div>
              <h2>
                문의 양식으로 <em>보내주세요</em>
              </h2>
              <p className={styles.intro}>
                아래 양식을 작성해 주시면 담당 팀원이 내용을 확인하고 영업일 24시간 내 회신드립니다.
                의료·약리 문의는 의약품이 아닌 건강기능식품 기준으로 답변드립니다.
              </p>

              <form className={styles.inq} onSubmit={handleSubmit}>
                <div className={styles.fld}>
                  <label>
                    문의 유형 <span className={styles.req}>*</span>
                  </label>
                  <div className={styles.topics}>
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`${styles.topicChip} ${topic === t ? styles.topicChipActive : ''}`}
                        onClick={() => setTopic(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.fld}>
                    <label htmlFor="name">
                      성함 <span className={styles.req}>*</span>
                    </label>
                    <input id="name" name="name" type="text" placeholder="홍길동" required />
                  </div>
                  <div className={styles.fld}>
                    <label htmlFor="company">회사 / 소속</label>
                    <input id="company" name="company" type="text" placeholder="(선택) 소속기관" />
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.fld}>
                    <label htmlFor="email">
                      이메일 <span className={styles.req}>*</span>
                    </label>
                    <input id="email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div className={styles.fld}>
                    <label htmlFor="phone">연락처</label>
                    <input id="phone" name="phone" type="tel" placeholder="010-0000-0000" />
                  </div>
                </div>

                {productOptions.length > 0 && (
                  <div className={styles.fld}>
                    <label htmlFor="subject">관심 제품 / 제목</label>
                    <select id="subject" name="subject">
                      {productOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.fld}>
                  <label htmlFor="message">
                    문의 내용 <span className={styles.req}>*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="문의하실 내용을 자세히 적어주세요. 대량 주문은 희망 수량, 납기일을 함께 알려주시면 빠른 답변이 가능합니다."
                    required
                  />
                </div>

                <div className={styles.consent}>
                  <input type="checkbox" id="cs" required />
                  <label htmlFor="cs">
                    개인정보 수집·이용에 동의합니다. 수집된 정보는 문의 답변 목적으로만 사용되며, 3년간 보관 후
                    파기됩니다.
                  </label>
                </div>

                {formState === 'error' && (
                  <p style={{ color: '#ff5252', fontSize: '0.85rem' }}>
                    전송에 실패했습니다. 잠시 후 다시 시도해 주세요.
                  </p>
                )}

                <div className={styles.submitRow}>
                  <button type="submit" className={styles.submitBtn} disabled={formState === 'sending'}>
                    {formState === 'sending' ? '전송 중...' : '문의 보내기 →'}
                  </button>
                  <span className={styles.hintTxt}>* 필수 항목 · 24시간 내 회신</span>
                </div>
              </form>
            </div>

            {/* SIDE: phone inquiry */}
            <aside className={styles.side}>
              <div className={styles.colHead} style={{ marginBottom: 8 }}>
                02 · Phone Inquiry
              </div>
              <h3>
                <em>{phoneChannel?.title ?? '전화 문의'}</em>
              </h3>
              <p className={styles.desc}>
                {(phoneChannel?.sub ?? '평일 09:00 – 18:00 (점심 12:00 – 13:00)\n주말 및 공휴일 휴무')
                  .split('\n')
                  .map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </span>
                  ))}
              </p>

              <div
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  color: 'var(--accent)',
                  letterSpacing: '0.02em',
                  fontWeight: 400,
                  marginBottom: 10,
                  lineHeight: 1.2,
                }}
              >
                {phoneChannel?.value ?? '070 · 4140 · 4086'}
              </div>
              <div className={styles.chHint} style={{ marginBottom: 32 }}>
                {phoneChannel?.hint ?? 'Customer · 대표번호'}
              </div>

              <a
                href={phoneChannel?.ctaHref ?? 'tel:070-4140-4086'}
                className={styles.chLink}
              >
                {phoneChannel?.ctaLabel ?? '지금 전화하기 →'}
              </a>

            </aside>
          </div>
        </div>
      </section>

      {/* INFO + MAP */}
      {(companyInfo || mapLabel) && (
        <section className={styles.info}>
          <div className={styles.wrap}>
            <div className={styles.infoGrid}>
              {companyInfo && companyInfo.rows.length > 0 && (
                <div>
                  <h2>
                    회사 <em>정보</em>
                  </h2>
                  <dl>
                    {companyInfo.rows.map((row, i) => (
                      <FragmentRow key={i} row={row} />
                    ))}
                  </dl>
                </div>
              )}
              {mapLabel && (
                <div>
                  <h2>
                    오시는 <em>길</em>
                  </h2>
                  <div className={styles.map}>
                    <div className={styles.mapPin} />
                    <div className={styles.mapLabel}>
                      {mapLabel.title}
                      <small>{mapLabel.address}</small>
                    </div>
                  </div>
                  <p
                    style={{
                      marginTop: 18,
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.55)',
                      lineHeight: 1.8,
                      fontWeight: 300,
                    }}
                  >
                    지하철 및 도보 안내는 사전 예약 시 별도 안내드립니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ (DB-driven) */}
      {faqItems.length > 0 && (
        <section className={styles.faqSection} id="faq">
          <div className={styles.wrap}>
            <div className={styles.colHead}>FAQ · 자주 묻는 질문</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', fontWeight: 200, color: '#fff' }}>
              자주 묻는 <em style={{ color: 'var(--accent)', fontStyle: 'normal', fontFamily: "'Noto Serif KR', serif", fontWeight: 400 }}>질문</em>
            </h2>
            <div className={styles.faqList}>
              {faqItems.map((item, i) => (
                <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                    <span>{item.question}</span>
                    <span className={styles.chevron}>▼</span>
                  </button>
                  {openFaq === i && <div className={styles.faqAnswer}>{item.answer}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TOAST */}
      <div className={`${styles.toast} ${showToast ? styles.toastShow : ''}`}>
        ✓ 문의가 정상 접수되었습니다
      </div>
    </>
  );
}
