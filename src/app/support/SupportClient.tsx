'use client';

import { useState, type FormEvent } from 'react';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import type { FaqItem } from '@/data/company';

interface SupportClientProps {
  faqItems: FaqItem[];
}

export default function SupportClient({ faqItems }: SupportClientProps) {
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
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
          subject: data.get('subject'),
          message: data.get('message'),
        }),
      });

      if (res.ok) {
        setFormState('sent');
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
      {/* Hero */}
      <section className="relative pt-40 pb-28 bg-[#0a0b10] text-white">
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <p className="section-tag mb-5">CUSTOMER SERVICE</p>
          <h1 className="section-title-kr text-white mb-5">고객 지원</h1>
          <p className="text-white/60 text-[0.95rem] leading-8">
            무엇을 도와드릴까요?
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-28 px-6 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">Contact</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">연락처 안내</h2>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RevealOnScroll>
              <div className="bg-white p-8 border border-neutral-200 hover:border-gold-500/30 transition-colors text-center h-full">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-gold-500/30 flex items-center justify-center">
                  <span className="text-gold-500 text-xl">&#9742;</span>
                </div>
                <h3 className="font-serif text-base mb-2">전화 문의</h3>
                <p className="text-lg font-medium text-neutral-800 mb-1">070-4140-4086</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={80}>
              <div className="bg-white p-8 border border-neutral-200 hover:border-gold-500/30 transition-colors text-center h-full">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-gold-500/30 flex items-center justify-center">
                  <span className="text-gold-500 text-xl">&#9200;</span>
                </div>
                <h3 className="font-serif text-base mb-2">운영시간</h3>
                <p className="text-sm text-neutral-600 leading-7">
                  평일 09:00 - 18:00<br />
                  점심시간 12:00 - 13:00<br />
                  주말 및 공휴일 휴무
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={160}>
              <div className="bg-white p-8 border border-neutral-200 hover:border-gold-500/30 transition-colors text-center h-full">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-gold-500/30 flex items-center justify-center">
                  <span className="text-gold-500 text-xl">&#9993;</span>
                </div>
                <h3 className="font-serif text-base mb-2">이메일 문의</h3>
                <a href="mailto:bj0202@gmail.com" className="text-gold-600 hover:text-gold-700 transition-colors text-sm">
                  bj0202@gmail.com
                </a>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-28 px-6 bg-white" id="contact">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">1:1 Inquiry</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">1:1 문의하기</h2>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            {formState === 'sent' ? (
              <div className="text-center py-16 bg-[#fdfbf7] border border-gold-500/30">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="font-serif text-xl mb-3">문의가 접수되었습니다</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  영업일 기준 1~2일 내에 답변 드리겠습니다.
                </p>
                <button onClick={() => setFormState('idle')} className="btn btn-outline-dark">
                  추가 문의하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-xs tracking-wider text-neutral-500 mb-2">이름 *</label>
                    <input
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 border border-neutral-300 text-sm focus:border-gold-500 focus:outline-none transition-colors"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs tracking-wider text-neutral-500 mb-2">이메일 *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-neutral-300 text-sm focus:border-gold-500 focus:outline-none transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs tracking-wider text-neutral-500 mb-2">제목 *</label>
                  <input
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border border-neutral-300 text-sm focus:border-gold-500 focus:outline-none transition-colors"
                    placeholder="문의 제목을 입력해 주세요"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs tracking-wider text-neutral-500 mb-2">내용 *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-neutral-300 text-sm focus:border-gold-500 focus:outline-none transition-colors resize-y"
                    placeholder="문의 내용을 입력해 주세요."
                  />
                </div>

                {formState === 'error' && (
                  <p className="text-sm text-red-600">전송에 실패했습니다. 잠시 후 다시 시도해 주세요.</p>
                )}

                <button
                  type="submit"
                  disabled={formState === 'sending'}
                  className="btn btn-gold w-full text-center disabled:opacity-50"
                >
                  {formState === 'sending' ? '전송 중...' : '문의하기'}
                </button>
              </form>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 px-6 bg-[#fdfbf7]" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <RevealOnScroll><p className="section-tag">FAQ</p></RevealOnScroll>
            <RevealOnScroll delay={100}>
              <h2 className="section-title-kr mb-4">자주 묻는 질문</h2>
            </RevealOnScroll>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <RevealOnScroll key={i} delay={i * 50}>
                <div className="bg-white border border-neutral-200">
                  <button
                    className="w-full flex justify-between items-center p-5 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-serif text-base pr-4">{item.question}</span>
                    <span className={`text-gold-500 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 border-t border-neutral-100 pt-4">
                      <p className="text-sm text-neutral-500 leading-8">{item.answer}</p>
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
