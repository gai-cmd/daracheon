'use client';

import { useState, type FormEvent } from 'react';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { FaqItem } from '@/data/company';

interface SupportClientProps {
  faqItems: FaqItem[];
}

export default function SupportClient({ faqItems }: SupportClientProps) {
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('sending');
    setErrorMessage('');
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          subject: data.get('subject'),
          message: data.get('message'),
        }),
      });

      if (res.ok) {
        setFormState('sent');
        form.reset();
      } else {
        const payload = await res.json().catch(() => null);
        const msg = payload?.errors?.[0] ?? payload?.message ?? '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
        setErrorMessage(msg);
        setFormState('error');
      }
    } catch {
      setErrorMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      setFormState('error');
    }
  }

  return (
    <div className="bg-lx-black text-lx-ivory">
      {/* Hero */}
      <section className="relative pt-40 pb-24 bg-lx-black">
        <div className="relative z-10 max-w-page mx-auto text-center px-6">
          <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-6 uppercase">
            — 문의하기 —
          </p>
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.15] text-lx-ivory mb-6">
            무엇을
            <br />
            <em className="text-gold-400 not-italic font-serif italic">도와드릴까요</em>
          </h1>
          <p className="text-lx-ivory/60 text-[0.95rem] leading-8 max-w-xl mx-auto">
            평일 09:00–18:00 · 영업일 기준 1~2일 내 답변 드립니다.
          </p>
        </div>
      </section>

      {/* Contact Channels — 3 cards */}
      <section className="py-24 px-6 bg-lx-black">
        <div className="max-w-page mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealOnScroll>
              <div className="bg-lx-ink border border-gold-500/20 p-8 h-full hover:border-gold-500/50 transition-colors">
                <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-6">01 / PHONE</p>
                <h3 className="font-serif text-xl text-lx-ivory mb-4">전화 문의</h3>
                <p className="text-2xl text-gold-400 font-serif mb-2">070-4140-4086</p>
                <p className="text-xs text-lx-ivory/50 mb-6 leading-7">평일 09:00 - 18:00</p>
                <a href="tel:07041404086" className="font-mono text-xs tracking-[0.2em] text-gold-400 hover:text-gold-500 uppercase border-b border-gold-500/40 pb-1">
                  지금 전화하기 →
                </a>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={80}>
              <div className="bg-lx-ink border border-gold-500/20 p-8 h-full hover:border-gold-500/50 transition-colors">
                <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-6">02 / EMAIL</p>
                <h3 className="font-serif text-xl text-lx-ivory mb-4">이메일 문의</h3>
                <p className="text-lg text-gold-400 font-serif mb-2 break-all">bj0202@gmail.com</p>
                <p className="text-xs text-lx-ivory/50 mb-6 leading-7">24시간 접수</p>
                <a href="mailto:bj0202@gmail.com" className="font-mono text-xs tracking-[0.2em] text-gold-400 hover:text-gold-500 uppercase border-b border-gold-500/40 pb-1">
                  메일 작성하기 →
                </a>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={160}>
              <div className="bg-lx-ink border border-gold-500/20 p-8 h-full hover:border-gold-500/50 transition-colors">
                <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-6">03 / KAKAOTALK</p>
                <h3 className="font-serif text-xl text-lx-ivory mb-4">카카오톡 상담</h3>
                <p className="text-lg text-gold-400 font-serif mb-2">@대라천ZOELLIFE</p>
                <p className="text-xs text-lx-ivory/50 mb-6 leading-7">실시간 1:1 채팅</p>
                {/* TODO: 카카오톡 채널 URL 확인 필요 */}
                <a href="#" className="font-mono text-xs tracking-[0.2em] text-gold-400 hover:text-gold-500 uppercase border-b border-gold-500/40 pb-1">
                  채팅 시작 →
                </a>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-28 px-6 bg-lx-slate" id="contact">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll>
              <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-5 uppercase">— 1:1 INQUIRY —</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="font-serif text-4xl md:text-5xl text-lx-ivory mb-4">
                <em className="not-italic italic text-gold-400">1:1 문의</em>하기
              </h2>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            {formState === 'sent' ? (
              <div className="text-center py-16 bg-lx-ink border border-gold-500/30">
                <div className="text-4xl mb-4 text-gold-400">✓</div>
                <h3 className="font-serif text-xl text-lx-ivory mb-3">문의가 접수되었습니다</h3>
                <p className="text-sm text-lx-ivory/60 mb-6">
                  영업일 기준 1~2일 내에 답변 드리겠습니다.
                </p>
                <button
                  onClick={() => setFormState('idle')}
                  className="font-mono text-xs tracking-[0.2em] text-gold-400 border border-gold-500/50 hover:border-gold-500 hover:bg-gold-500/10 px-6 py-3 uppercase transition-colors"
                >
                  추가 문의하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-lx-ink border border-gold-500/20 p-8 md:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block font-mono text-xs tracking-[0.2em] text-lx-ivory/60 mb-2 uppercase">이름 *</label>
                    <input
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 bg-lx-black/50 border border-white/20 text-sm text-lx-ivory placeholder:text-lx-ivory/30 focus:border-gold-500 focus:outline-none transition-colors"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block font-mono text-xs tracking-[0.2em] text-lx-ivory/60 mb-2 uppercase">이메일 *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-lx-black/50 border border-white/20 text-sm text-lx-ivory placeholder:text-lx-ivory/30 focus:border-gold-500 focus:outline-none transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block font-mono text-xs tracking-[0.2em] text-lx-ivory/60 mb-2 uppercase">제목 *</label>
                  <input
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 bg-lx-black/50 border border-white/20 text-sm text-lx-ivory placeholder:text-lx-ivory/30 focus:border-gold-500 focus:outline-none transition-colors"
                    placeholder="문의 제목을 입력해 주세요"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block font-mono text-xs tracking-[0.2em] text-lx-ivory/60 mb-2 uppercase">내용 *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-lx-black/50 border border-white/20 text-sm text-lx-ivory placeholder:text-lx-ivory/30 focus:border-gold-500 focus:outline-none transition-colors resize-y"
                    placeholder="문의 내용을 입력해 주세요."
                  />
                </div>

                {formState === 'error' && (
                  <p className="text-sm text-red-400">{errorMessage || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.'}</p>
                )}

                <button
                  type="submit"
                  disabled={formState === 'sending'}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-lx-black font-mono text-xs tracking-[0.3em] uppercase py-4 transition-colors disabled:opacity-50"
                >
                  {formState === 'sending' ? '전송 중...' : '문의하기 →'}
                </button>
              </form>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* Lot Lookup */}
      <section className="py-28 px-6 bg-lx-black" id="lot-lookup">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll>
              <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-5 uppercase">— LOT TRACEABILITY —</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="font-serif text-4xl md:text-5xl text-lx-ivory mb-4">
                Lot 번호 <em className="not-italic italic text-gold-400">조회</em>
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={160}>
              <p className="text-sm text-lx-ivory/60 leading-7 max-w-xl mx-auto">
                제품 라벨의 Lot 번호를 입력하시면 원산지 · 수지 함량 · 검사 결과를 확인할 수 있습니다.
              </p>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <div className="bg-lx-ink border border-gold-500/30 p-8 md:p-10">
              {/* TODO: Lot 조회 API 없음 — placeholder UI */}
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="ZOEL-2026-XXXX"
                  className="flex-1 px-4 py-3 bg-lx-black/50 border border-white/20 font-mono text-sm text-lx-ivory placeholder:text-lx-ivory/30 tracking-[0.15em] focus:border-gold-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  className="bg-gold-500 hover:bg-gold-400 text-lx-black font-mono text-xs tracking-[0.3em] uppercase px-8 py-3 transition-colors"
                >
                  조회 →
                </button>
              </div>
              <p className="mt-4 font-mono text-xs text-lx-ivory/40 tracking-[0.1em]">
                SAMPLE: ZOEL-2026-0042
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 px-6 bg-lx-slate" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll>
              <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-5 uppercase">— FAQ —</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="font-serif text-4xl md:text-5xl text-lx-ivory mb-4">
                자주 묻는 <em className="not-italic italic text-gold-400">질문</em>
              </h2>
            </RevealOnScroll>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <RevealOnScroll key={i} delay={i * 50}>
                <div className="bg-lx-ink border border-gold-500/20 hover:border-gold-500/40 transition-colors">
                  <button
                    className="w-full flex justify-between items-center p-6 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-serif text-base text-lx-ivory pr-4">{item.question}</span>
                    <span className={`text-gold-400 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 border-t border-gold-500/10 pt-4">
                      <p className="text-sm text-lx-ivory/70 leading-8">{item.answer}</p>
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Map — Kakao Map placeholder */}
      <section className="py-28 px-6 bg-lx-black" id="map">
        <div className="max-w-page mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll>
              <p className="font-mono text-xs tracking-[0.3em] text-gold-400 mb-5 uppercase">— LOCATION —</p>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="font-serif text-4xl md:text-5xl text-lx-ivory mb-4">
                본사 <em className="not-italic italic text-gold-400">위치</em>
              </h2>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            {/* TODO: Kakao Map embed — API key / 주소 확인 필요 */}
            <div className="bg-lx-ink border border-gold-500/20 aspect-[16/7] flex items-center justify-center">
              <p className="font-mono text-xs tracking-[0.3em] text-lx-ivory/40 uppercase">
                Kakao Map Placeholder
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
