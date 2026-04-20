import type { Metadata } from 'next';
import styles from '@/styles/zoel/story-page.module.css';

export const metadata: Metadata = {
  title: '침향 농장 이야기 - 베트남 하띤 20ha | ZOEL LIFE',
  description:
    '베트남 하띤(Ha Tinh) 북위 18°의 직영 침향 농장 20헥타르, 약 400만 그루. 62가구의 현지 공동체 파트너십과 4단계 원산지 검증 체계.',
  alternates: { canonical: 'https://www.daracheon.com/process' },
};

interface Chapter {
  num: string;
  tag: string;
  title: string;
  body: string;
  stat?: { value: string; label: string }[];
}

const chapters: Chapter[] = [
  {
    num: '01',
    tag: 'Location',
    title: '북위 18° — 침향의 마지막 기후대',
    body: '아퀼라리아 아갈로차(Aquilaria Agallocha Roxburgh)는 북위 10°~22° 사이 아열대 산림에서만 자연 수지를 만듭니다. 베트남 하띤은 그 중에서도 연평균 강수량 2,400mm, 안개일 수 180일 — 수지 침착에 최적화된 마이크로클라이밋을 가진 세계에서 가장 북쪽 끝 침향 산지입니다.',
  },
  {
    num: '02',
    tag: 'Scale',
    title: '직영 20ha · 약 400만 그루',
    body: '농장은 CITES(멸종위기종 국제거래협약) 등록 번호 VN-2008-AAR-003 하에 관리되는 공식 조림지. 평균 수령 18년 이상의 성숙목 400만 그루가 자연 침착 환경에서 자라고 있으며, 매년 평균 180그루에서 제한된 수확만 이루어집니다.',
    stat: [
      { value: '20', label: 'ha' },
      { value: '4M', label: 'trees' },
    ],
  },
  {
    num: '03',
    tag: 'Partnership',
    title: '현지 공동체와의 25년',
    body: '농장의 관리는 하띤 지역 62가구의 현지 파트너 가족이 맡고 있습니다. 25년간 함께 일해온 이들에게는 한국 본사와 동일한 의료·교육 복지가 제공됩니다. "진짜 침향은 사람과 자연 모두가 건강할 때만 만들어집니다" — 박병주 대표의 원칙.',
    stat: [{ value: '62', label: 'families' }],
  },
  {
    num: '04',
    tag: 'Verification',
    title: '4단계 원산지 검증',
    body: '① GPS 좌표로 각 나무의 위치 기록 ② 수확 시 나무 ID와 수지 함량 DB 입력 ③ 베트남 농업부 검사증 발급 ④ 한국 식약처 수입 통관 시 2차 검증. 제품의 Lot 번호로 이 모든 이력을 누구나 조회할 수 있습니다.',
    stat: [{ value: '4', label: 'steps' }],
  },
];

export default function ProcessPage() {
  return (
    <>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-60px', opacity: 0.45, zIndex: 1 }}
        />
        <div
          className="orn-plume"
          aria-hidden
          style={{ left: '8%', bottom: '-120px', opacity: 0.22, transform: 'scaleX(-1)', width: 240, height: 320, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>침향 농장 이야기</div>
          <h1>
            베트남 하띤의
            <br />
            <em>20헥타르, 25년의 시간</em>
          </h1>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.72rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--accent-soft)',
              marginBottom: 24,
              maxWidth: 420,
            }}
          >
            Lat 18° N · Ha Tinh, Vietnam
          </div>
          <p className={styles.lede}>
            호치민에서 북쪽으로 500km, 베트남 중부의 하띤(Ha Tinh) — 연평균 습도 84%, 해발 300~600m의 아열대 산림.
            침향나무가 가장 깊은 수지를 만드는 유일한 기후. 대라천은 이곳에서 25년째 직영 농장을 운영합니다.
          </p>
        </div>
      </section>

      {/* CHAPTERS */}
      {chapters.map((ch, i) => (
        <section
          key={ch.num}
          className={styles.chapter}
          data-alt={i % 2 === 1 ? '1' : undefined}
        >
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>{ch.num}</div>
                <div className={styles.chapterTag}>{ch.tag}</div>
                {ch.stat && ch.stat.length > 0 && (
                  <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
                    {ch.stat.map((s) => (
                      <div
                        key={s.label}
                        style={{
                          border: '1px solid rgba(212,168,67,0.35)',
                          padding: '10px 14px',
                          minWidth: 70,
                          textAlign: 'center',
                        }}
                      >
                        <b
                          style={{
                            display: 'block',
                            fontFamily: "'Noto Serif KR', serif",
                            fontSize: '1.6rem',
                            fontWeight: 400,
                            color: 'var(--accent)',
                            lineHeight: 1,
                          }}
                        >
                          {s.value}
                        </b>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: '0.6rem',
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 4,
                            display: 'inline-block',
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.chapterBody}>
                <h3>{ch.title}</h3>
                <p>{ch.body}</p>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
