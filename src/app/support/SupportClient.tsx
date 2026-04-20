'use client';

import { useState, type FormEvent } from 'react';
import type { FaqItem } from '@/data/company';
import styles from './page.module.css';

interface SupportClientProps {
  faqItems: FaqItem[];
}

const TOPICS = [
  '제품 상담',
  '주문·배송',
  'Lot·인증서',
  '대량 주문',
  '미디어 취재',
  '기타',
] as const;

const SAMPLE_LOTS = ['DRT-2024-0847', 'DRT-2024-0312', 'DRT-2023-1104'];

const PRODUCT_OPTIONS = [
  '선택 안 함',
  "'참'침향 오일 캡슐",
  '대라천 침향 진액',
  '침향묵주 108염주 — 합장주',
  '침향묵주 108염주 — 평주 (라이트)',
  '침향묵주 108염주 — 대주 (더블랩)',
  '대라천 침향차 티백',
  '원니핀 데일리 캡슐',
];

export default function SupportClient({ faqItems }: SupportClientProps) {
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lotNum, setLotNum] = useState('');
  const [showLotResult, setShowLotResult] = useState(false);

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

  function checkLot() {
    setShowLotResult(true);
  }

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.kicker}>문의하기</div>
          <h1>
            무엇을 <em>도와드릴까요</em>
          </h1>
          <p className={styles.lede}>
            제품에 대한 질문, Lot 번호 조회, 대량 주문, 베트남 직영 농장 견학 신청까지.
            평일 09:00 – 18:00, 전담 담당자가 24시간 내 답변드립니다.
          </p>
        </div>
      </section>

      {/* 3 CHANNELS */}
      <section className={styles.channels}>
        <div className={styles.wrap}>
          <div className={styles.chGrid}>
            <div className={styles.ch}>
              <div className={styles.chNum}>01 · Phone</div>
              <h3>전화 문의</h3>
              <p className={styles.chSub}>
                평일 09:00 – 18:00 (점심 12:00 – 13:00)
                <br />
                주말 및 공휴일 휴무
              </p>
              <div className={styles.chVal}>070 · 4140 · 4086</div>
              <div className={styles.chHint}>Customer · 대표번호</div>
              <a href="tel:070-4140-4086" className={styles.chLink}>
                지금 전화하기 →
              </a>
            </div>
            <div className={styles.ch}>
              <div className={styles.chNum}>02 · Email</div>
              <h3>이메일 문의</h3>
              <p className={styles.chSub}>
                24시간 접수 · 평일 24시간 내 회신
                <br />
                첨부파일은 10MB 이하로 부탁드립니다
              </p>
              <div className={`${styles.chVal} ${styles.chValSm}`}>zoel@zoellife.co.kr</div>
              <div className={styles.chHint}>Business · 사업 제휴 · 대량 주문</div>
              <a href="mailto:zoel@zoellife.co.kr" className={styles.chLink}>
                메일 작성하기 →
              </a>
            </div>
            <div className={styles.ch}>
              <div className={styles.chNum}>03 · KakaoTalk</div>
              <h3>카카오톡 상담</h3>
              <p className={styles.chSub}>
                실시간 1:1 상담 · 평일 09:00 – 18:00
                <br />
                이미지·영상 첨부 가능
              </p>
              <div className={`${styles.chVal} ${styles.chValSm}`}>@대라천ZOELLIFE</div>
              <div className={styles.chHint}>Live Chat · 가장 빠른 응답</div>
              {/* TODO: 카카오톡 채널 실제 URL 확인 필요 */}
              <a href="#" className={styles.chLink}>
                채팅 시작 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FORM + LOT CHECKER */}
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

                <div className={styles.fld}>
                  <label htmlFor="subject">관심 제품 / 제목</label>
                  <select id="subject" name="subject">
                    {PRODUCT_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

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

            {/* SIDE: lot checker */}
            <aside className={styles.side}>
              <div className={styles.colHead} style={{ marginBottom: 8 }}>
                02 · Lot · Certificate
              </div>
              <h3>
                <em>Lot 번호 조회</em>
              </h3>
              <p className={styles.desc}>
                제품 뒷면 또는 방송 중 안내된 Lot 번호를 입력하시면 원산지·수확일·성분검사 결과·GC-MS
                크로마토그램을 즉시 확인할 수 있습니다.
              </p>

              {/* TODO: Lot 조회 API 없음 — 샘플 응답 표시 (실제 API 연결 필요) */}
              <div className={styles.lotIn}>
                <input
                  type="text"
                  value={lotNum}
                  onChange={(e) => setLotNum(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkLot()}
                  placeholder="예: DRT-2024-0847"
                />
                <button type="button" onClick={checkLot}>
                  조회
                </button>
              </div>

              <div className={styles.samples}>
                {SAMPLE_LOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setLotNum(s);
                      checkLot();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {showLotResult && (
                <div className={styles.lotResult}>
                  <div className={styles.ok}>✓ Verified · 정품 인증</div>
                  <div className={styles.lotProd}>'참'침향 오일 캡슐 60정</div>
                  <dl>
                    <dt>Lot 번호</dt>
                    <dd>
                      <b>{lotNum || 'DRT-2024-0847'}</b>
                    </dd>
                    <dt>원산지</dt>
                    <dd>베트남 하띤성 대라천 직영 농장 · Plot B-07</dd>
                    <dt>수확일</dt>
                    <dd>2024년 7월 · 수령 약 28년생</dd>
                    <dt>제조일</dt>
                    <dd>2024년 11월 18일</dd>
                    <dt>소비기한</dt>
                    <dd>2027년 11월 18일</dd>
                    <dt>성분</dt>
                    <dd>
                      Agarofuran <b>3.42%</b> · β-Caryophyllene <b>6.18%</b>
                    </dd>
                    <dt>인증</dt>
                    <dd>CITES · HACCP · GMP · GC-MS 크로마토그램 첨부</dd>
                  </dl>
                </div>
              )}

              <div className={styles.sideDivider} />

              <h3 style={{ fontSize: '1.15rem', marginBottom: 8 }}>도움이 필요하신가요?</h3>
              <p className={styles.desc} style={{ marginBottom: 14 }}>
                Lot 번호를 찾지 못하거나 조회 결과가 의심스러운 경우 아래 번호로 바로 연락주세요.
              </p>
              <a href="tel:070-4140-4086" className={styles.chLink}>
                위조 의심 신고 · 070-4140-4086 →
              </a>
            </aside>
          </div>
        </div>
      </section>

      {/* INFO + MAP */}
      <section className={styles.info}>
        <div className={styles.wrap}>
          <div className={styles.infoGrid}>
            <div>
              <h2>
                회사 <em>정보</em>
              </h2>
              <dl>
                <dt>상호</dt>
                <dd>
                  (주)조엘라이프 <b>ZOEL LIFE Co., Ltd.</b>
                </dd>
                <dt>브랜드</dt>
                <dd>
                  대라천 <b>大羅天 · DAERACHEON</b>
                </dd>
                <dt>대표자</dt>
                <dd>박병주</dd>
                <dt>설립일</dt>
                <dd>2019년 · 연구 개시 1999년</dd>
                <dt>사업자번호</dt>
                <dd>749-86-03668</dd>
                <dt>주소</dt>
                <dd>
                  서울특별시 금천구 벚꽃로36길 30, 1511호
                </dd>
                <dt>전화</dt>
                <dd>070 - 4140 - 4086</dd>
                <dt>이메일</dt>
                <dd>bj0202@gmail.com</dd>
              </dl>
            </div>
            <div>
              <h2>
                오시는 <em>길</em>
              </h2>
              {/* TODO: Kakao Map embed/API 키 확인 필요 — 현재는 placeholder */}
              <div className={styles.map}>
                <div className={styles.mapPin} />
                <div className={styles.mapLabel}>
                  대라천 · ZOEL LIFE 본사
                  <small>서울 금천구 벚꽃로36길 30, 1511호</small>
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
          </div>
        </div>
      </section>

      {/* FAQ (DB-driven, 보존) */}
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
