'use client';

import { useState, type FormEvent } from 'react';
import type { FaqItem } from '@/data/company';
import NaverMap from '@/components/NaverMap';
import storyStyles from '@/styles/zoel/story-page.module.css';
import styles from './contact.module.css';

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
  channels?: SupportChannel[];
  sampleLots?: string[];
  productOptions?: string[];
  companyInfo?: SupportCompanyInfo;
  mapLabel?: SupportMapLabel;
}

interface CompanyContactSectionProps {
  faqItems: FaqItem[];
  supportData: SupportData | null;
}

const TOPICS = [
  '제품 상담',
  '주문·배송',
  '대량 주문',
  '미디어 취재',
  '기타',
] as const;

// 토픽 라벨 → 서버 스키마의 category 코드.
// 매핑이 없으면 카테고리 라벨이 항상 "제품"으로 고정되어 시트·메일·텔레그램에서 구분이 안 된다.
const TOPIC_TO_CATEGORY: Record<(typeof TOPICS)[number], 'product' | 'order' | 'wholesale' | 'media' | 'other'> = {
  '제품 상담': 'product',
  '주문·배송': 'order',
  '대량 주문': 'wholesale',
  '미디어 취재': 'media',
  '기타': 'other',
};

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

export default function CompanyContactSection({ faqItems, supportData }: CompanyContactSectionProps) {
  const productOptions = supportData?.productOptions ?? [];
  const companyInfo = supportData?.companyInfo;
  const mapLabel = supportData?.mapLabel;

  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('✓ 문의가 정상 접수되었습니다');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('sending');
    setErrorMsg('');
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone') || '',
          category: TOPIC_TO_CATEGORY[topic as (typeof TOPICS)[number]] ?? 'other',
          subject: `[${topic}] ${data.get('subject') || '문의'}`,
          message: data.get('message'),
          // honeypot — CSS 로 숨긴 input. 사람은 못 보고 봇만 채움.
          website: data.get('website') || '',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        const mail = body?.mailSent;
        // 접수는 됐는데 고객 확인 메일이 실패했으면 정직하게 알림.
        // (운영자 알림 메일 실패는 고객에게 노출하지 않음)
        const customerMailFailed = mail && mail.customer === false;
        if (customerMailFailed) {
          console.warn('[Contact Form] 메일 발송 일부 실패', mail);
          setToastMessage('✓ 접수되었습니다. 확인 메일 발송에 문제가 있어 운영자가 직접 회신드립니다.');
        } else {
          setToastMessage('✓ 문의가 정상 접수되었습니다');
        }
        setFormState('sent');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        form.reset();
      } else {
        const detail = Array.isArray(body?.errors) && body.errors.length > 0
          ? body.errors.join(' ')
          : body?.message || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
        setErrorMsg(detail);
        setFormState('error');
      }
    } catch {
      setErrorMsg('네트워크 오류로 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setFormState('error');
    }
  }

  return (
    <>
      {/* 02 · About — 회사 개요 (회사 정보 + 본사 + 오시는 길 통합) */}
      {(companyInfo || mapLabel) && (
        <section className={`${storyStyles.chapter} ${storyStyles.chapterAlt}`}>
          <div className={storyStyles.wrap}>
            <div className={storyStyles.chapterGrid}>
              <div>
                <div className={storyStyles.chapterNum}>02</div>
                <div className={storyStyles.chapterTag}>About</div>
              </div>
              <div className={storyStyles.chapterBody}>
                <h3>
                  회사 <em>개요</em>
                </h3>

                {(() => {
                  const KEEP_IDENTITY = [
                    '상호',
                    '브랜드',
                    '대표자',
                    '주소',
                    '사업자번호',
                    '통신판매업신고번호',
                    '영업등록증',
                    '개인정보보호책임자',
                    '전화',
                  ];
                  const isIdentity = (dt: string) => KEEP_IDENTITY.some((k) => dt.includes(k));
                  const identityRows = companyInfo?.rows.filter((r) => isIdentity(r.dt)) ?? [];
                  return (
                    <div className={styles.identityRow} style={{ marginTop: 24 }}>
                      {identityRows.length > 0 && (
                        <div className={styles.identityGroup}>
                          <div className={styles.identityGroupLabel}>Identity</div>
                          <dl className={styles.identityDl}>
                            {identityRows.map((row, i) => (
                              <FragmentRow key={`id-${i}`} row={row} />
                            ))}
                          </dl>
                        </div>
                      )}

                      {mapLabel && (
                        <div className={styles.identityGroup}>
                          <div className={styles.identityGroupLabel}>Headquarters</div>
                          <div className={styles.identityMap}>
                            <NaverMap title={mapLabel.title} address={mapLabel.address} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 03 · General Inquiry — 문의 양식 + 전화 CTA (하단) */}
      <section className={storyStyles.chapter} id="contact">
        <div className={storyStyles.wrap}>
          <div className={storyStyles.chapterGrid}>
            <div>
              <div className={storyStyles.chapterNum}>03</div>
              <div className={storyStyles.chapterTag}>General Inquiry</div>
            </div>
            <div className={storyStyles.chapterBody}>
              <h3>
                문의 <em>양식</em>
              </h3>
              <p style={{ marginBottom: 36 }}>
                아래 양식을 작성해 주시면 담당자가 내용을 확인하고 24시간 내 회신드립니다.
              </p>

              <form className={styles.inq} onSubmit={handleSubmit}>
                {/*
                  Honeypot — 사람 눈에 안 보이지만 DOM 에는 존재. 자동 봇 대부분이
                  모든 input 을 채우려 하므로 값이 들어오면 봇으로 판단해 침묵 거부.
                  display:none 은 일부 봇이 skip 하므로 화면 밖 + aria-hidden 사용.
                */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
                  <label htmlFor="website">웹사이트 (입력하지 마세요)</label>
                  <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>
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
                    <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>
                      (10자 이상)
                    </span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="문의하실 내용을 자세히 적어주세요. 대량 주문은 희망 수량, 납기일을 함께 알려주시면 빠른 답변이 가능합니다."
                    minLength={10}
                    maxLength={2000}
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
                    {errorMsg || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.'}
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
          </div>
        </div>
      </section>

      {/* 04 · FAQ — 자주 묻는 질문 */}
      {faqItems.length > 0 && (
        <section className={`${storyStyles.chapter} ${storyStyles.chapterAlt}`} id="faq">
          <div className={storyStyles.wrap}>
            <div className={storyStyles.chapterGrid}>
              <div>
                <div className={storyStyles.chapterNum}>04</div>
                <div className={storyStyles.chapterTag}>FAQ</div>
              </div>
              <div className={storyStyles.chapterBody}>
                <h3>
                  자주 묻는 <em>질문</em>
                </h3>
                <div className={styles.faqList} style={{ marginTop: 28 }}>
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
            </div>
          </div>
        </section>
      )}

      {/* TOAST */}
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </>
  );
}
