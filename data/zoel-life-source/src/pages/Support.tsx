import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import SEO from "../components/SEO";

export default function Support() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Contact form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const faqsSnap = await getDocs(query(collection(db, "faqs"), orderBy("order", "asc")));
        setFaqs(faqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const noticesSnap = await getDocs(query(collection(db, "notices"), orderBy("createdAt", "desc")));
        setNotices(noticesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching support data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: '문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.' });
        setFormData({ name: "", email: "", subject: "", message: "" }); // Reset form
      } else {
        setSubmitStatus({ type: 'error', message: data.error || '문의 접수 중 오류가 발생했습니다.' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: '서버와 통신 중 오류가 발생했습니다. 나중에 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-luxury-cream min-h-screen pb-24 font-noto-sans">
      <SEO 
        title="고객 지원 - 문의 및 안내 | ZOEL LIFE"
        description="ZOEL LIFE 제품 및 서비스에 대한 문의사항, 배송 안내, 자주 묻는 질문(FAQ) 등 고객 지원 서비스를 제공합니다. 궁금하신 점은 언제든 고객센터로 문의해 주세요."
        keywords="ZOEL LIFE 고객센터, ZOEL LIFE 문의, 침향 배송, ZOEL LIFE FAQ, 공지사항, 침향 구매 문의, ZOEL LIFE 서비스 안내"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "고객 지원", "item": "https://www.daracheon.com/support" }
              ]
            }
          ]
        }}
      />
      {/* Header */}
      <header className="pt-32 pb-16 px-4 bg-white border-b border-luxury-gold/20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-micro mb-4"
          >
            CUSTOMER SERVICE
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-noto-serif font-light mb-6 text-luxury-black"
          >
            고객 지원
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-luxury-black/60 font-light"
          >
            무엇을 도와드릴까요?
          </motion.p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Contact Info */}
          <aside className="lg:col-span-1">
            <div className="glass-panel-dark p-8 rounded-2xl sticky top-32">
              <h2 className="text-2xl font-noto-serif font-light mb-8 text-luxury-black">고객센터</h2>
              
              <div className="space-y-8">
                <div>
                  <div className="text-xs text-luxury-black/60 tracking-widest uppercase mb-2">전화 문의</div>
                  <div className="text-3xl font-playfair text-luxury-gold mb-2">070-4140-4086</div>
                  <div className="text-sm text-luxury-black/60 font-light">평일 09:00 - 18:00<br/>(점심시간 12:00 - 13:00 / 주말 및 공휴일 휴무)</div>
                </div>
                
                <div className="h-px bg-luxury-gold/20 w-full"></div>
                
                <div>
                  <div className="text-xs text-luxury-black/60 tracking-widest uppercase mb-2">이메일 문의</div>
                  <div className="text-lg text-luxury-black font-light">bj0202@gmail.com</div>
                </div>
                
                <div className="h-px bg-luxury-gold/20 w-full"></div>
                
                <div>
                  <div className="text-xs text-luxury-black/60 tracking-widest uppercase mb-4">카카오톡 상담</div>
                  <button className="w-full bg-[#FEE500] text-[#191919] py-3 rounded-full font-medium text-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center shadow-sm">
                    카카오톡 채널 바로가기
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <section className="glass-panel-dark p-8 rounded-2xl mt-8">
              <h2 className="text-2xl font-noto-serif font-light mb-6 text-luxury-black">1:1 문의하기</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-luxury-black/80 mb-1">이름</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-luxury-gold/30 rounded-md focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 bg-white/50"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-luxury-black/80 mb-1">이메일</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-luxury-gold/30 rounded-md focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 bg-white/50"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-luxury-black/80 mb-1">제목</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-luxury-gold/30 rounded-md focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 bg-white/50"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-luxury-black/80 mb-1">내용</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-luxury-gold/30 rounded-md focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 bg-white/50 resize-none"
                  ></textarea>
                </div>
                
                {submitStatus.message && (
                  <div className={`p-3 rounded-md text-sm ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {submitStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-luxury-black text-white py-3 rounded-md font-medium text-sm hover:bg-luxury-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isSubmitting ? '전송 중...' : '문의하기'}
                </button>
              </form>
            </section>
          </aside>

          {/* FAQ & Notices */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Notices Section */}
            <section>
              <h2 className="text-3xl font-noto-serif font-light mb-8 text-luxury-black flex items-center">
                <span className="w-8 h-px bg-luxury-gold mr-4"></span>
                공지사항
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm border border-luxury-gold/20 overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">로딩 중...</div>
                ) : notices.length > 0 ? (
                  <ul className="divide-y divide-luxury-gold/10">
                    {notices.map((notice) => (
                      <li key={notice.id} className="p-6 hover:bg-luxury-cream/50 transition-colors">
                        <details className="group">
                          <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-luxury-black">
                            <span className="text-lg">{notice.title}</span>
                            <time className="text-sm text-luxury-black/40" dateTime={new Date(notice.createdAt).toISOString()}>{new Date(notice.createdAt).toLocaleDateString()}</time>
                          </summary>
                          <div className="text-luxury-black/70 font-light mt-4 pt-4 border-t border-luxury-gold/10 whitespace-pre-wrap">
                            {notice.content}
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-500">등록된 공지사항이 없습니다.</div>
                )}
              </div>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="text-3xl font-noto-serif font-light mb-8 text-luxury-black flex items-center">
                <span className="w-8 h-px bg-luxury-gold mr-4"></span>
                자주 묻는 질문 (FAQ)
              </h2>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">로딩 중...</div>
                ) : faqs.length > 0 ? (
                  faqs.map((faq, idx) => (
                    <motion.div 
                      key={faq.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="glass-panel-light p-6 rounded-2xl group cursor-pointer hover:border-luxury-gold/50 transition-colors bg-white"
                    >
                      <details className="group">
                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-luxury-black">
                          <span className="flex items-center">
                            <span className="text-luxury-gold font-playfair text-xl mr-4">Q.</span>
                            {faq.question}
                          </span>
                          <span className="transition group-open:rotate-180 text-luxury-black/60">
                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                          </span>
                        </summary>
                        <div className="text-luxury-black/60 font-light mt-4 pt-4 border-t border-luxury-gold/20 flex items-start leading-relaxed whitespace-pre-wrap">
                          <span className="text-luxury-black/40 font-playfair text-xl mr-4">A.</span>
                          <p>{faq.answer}</p>
                        </div>
                      </details>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">등록된 FAQ가 없습니다.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
