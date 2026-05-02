'use client';

import { useState, useEffect } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';

type AnnouncementVariant = 'gold' | 'dark' | 'red';

interface AnnouncementData {
  enabled: boolean;
  text: string;
  link: string;
  linkLabel: string;
  variant: AnnouncementVariant;
  updatedAt: string;
}

interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
}

interface SocialLink {
  label: string;
  url: string;
}

const SEO_DEFAULTS: SeoSettings = {
  metaTitle: "대라천 '참'침향 — 식약처 공식 등재 Aquilaria Agallocha Roxburgh 전문 브랜드 | ZOEL LIFE",
  metaDescription:
    "조엘라이프의 대라천 '참'침향. 베트남 5개 성 200ha 직영 농장에서 25년 직접 재배한 진짜 침향. 식약처 '대한민국약전외한약(생약)규격집'·'식품공전' 공식 등재 학명 Aquilaria Agallocha Roxburgh 보증. CITES·ISO 22000·GMP 인증. 침향 오일·캡슐·침향단·침향차·선향 한국 직판.",
  keywords:
    "침향, 대라천, 참침향, ZOEL LIFE, 조엘라이프, 침향 효능, 침향 오일, 침향 캡슐, 침향환, 침향단, 침향 선향, 침향수, 침향차, 침향 스틱, 베트남 침향, 베트남 직영 침향, 프리미엄 침향, 진짜 침향, 정품 침향, Aquilaria Agallocha Roxburgh, 아퀼라리아 아갈로차 록스버그, 식약처 침향, 약전 침향, CITES 침향, 침향 구매, 침향 도매, 침향 B2B, 침향 OEM, 하띤 침향, 동나이 침향, 냐짱 침향",
  ogImage: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png',
};

interface SettingsData {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  ceo: string;
  businessReg: string;
  foundingDate: string;
  brandLogo: string;
  companyLogo: string;
  brandDesc?: string;
  socialLinks?: SocialLink[];
  seo: SeoSettings;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Section 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    brandLogo: '',
    companyLogo: '',
    brandDesc: '',
  });

  // Section 2: Footer / Company Info
  const [footerInfo, setFooterInfo] = useState({
    ceo: '',
    businessReg: '',
    address: '',
    phone: '',
    email: '',
    foundingDate: '',
  });

  // Section 3: Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  // Section 4: SEO
  const [seo, setSeo] = useState<SeoSettings>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    ogImage: '',
  });

  // Section 5: Announcement Banner
  const [announcement, setAnnouncement] = useState<AnnouncementData>({
    enabled: false,
    text: '',
    link: '',
    linkLabel: '',
    variant: 'gold',
    updatedAt: '',
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  /* ─── Toast auto-hide ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Fetch settings ─── */
  useEffect(() => {
    async function fetchSettings() {
      try {
        const [settingsRes, announcementRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/announcement'),
        ]);
        const data: SettingsData = await settingsRes.json();
        const annData: AnnouncementData = await announcementRes.json();
        setAnnouncement(annData);

        setBasicInfo({
          name: data.name || '',
          description: data.description || '',
          brandLogo: data.brandLogo || '',
          companyLogo: data.companyLogo || '',
          brandDesc: data.brandDesc || '',
        });
        setFooterInfo({
          ceo: data.ceo || '',
          businessReg: data.businessReg || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          foundingDate: data.foundingDate || '',
        });
        setSocialLinks(Array.isArray(data.socialLinks) ? data.socialLinks : []);
        // 비어있는 SEO 필드는 권장 기본값으로 자동 채움.
        // 사용자가 저장 버튼을 누르면 그 값이 blob에 영구 저장됨.
        setSeo({
          metaTitle: data.seo?.metaTitle || SEO_DEFAULTS.metaTitle,
          metaDescription: data.seo?.metaDescription || SEO_DEFAULTS.metaDescription,
          keywords: data.seo?.keywords || SEO_DEFAULTS.keywords,
          ogImage: data.seo?.ogImage || SEO_DEFAULTS.ogImage,
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setToast('설정을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  /* ─── Save helper ─── */
  async function saveSection(section: string, payload: Record<string, unknown>) {
    setSaving(section);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setToast('저장 완료');
    } catch (err) {
      console.error(`Save ${section} error:`, err);
      setToast('저장에 실패했습니다.');
    } finally {
      setSaving(null);
    }
  }

  // Save handlers
  const handleSaveBasicInfo = () => saveSection('basic', { ...basicInfo });
  const handleSaveFooterInfo = () => saveSection('footer', { ...footerInfo });
  const handleSaveSocial = () => saveSection('social', { socialLinks });
  const handleSaveSeo = () => saveSection('seo', { seo });

  async function saveAnnouncement(data: AnnouncementData) {
    setSavingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: data.enabled,
          text: data.text,
          link: data.link,
          linkLabel: data.linkLabel,
          variant: data.variant,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated: AnnouncementData = await res.json();
      setAnnouncement(updated);
      setToast('공지 배너 저장 완료');
    } catch (err) {
      console.error('Save announcement error:', err);
      setToast('공지 배너 저장에 실패했습니다.');
    } finally {
      setSavingAnnouncement(false);
    }
  }

  const handleSaveAnnouncement = () => saveAnnouncement(announcement);

  const handleToggleEnabled = () => {
    const next = { ...announcement, enabled: !announcement.enabled };
    setAnnouncement(next);
    saveAnnouncement(next);
  };

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-9 w-28 rounded bg-gray-200 animate-pulse mb-2" />
          <div className="h-4 w-64 rounded bg-gray-200 animate-pulse mb-8" />
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 w-24 rounded bg-gray-200 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j}>
                      <div className="h-4 w-16 rounded bg-gray-200 mb-2" />
                      <div className="h-10 w-full rounded-lg bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-5 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">회사 설정</h1>
        <p className="text-gray-500 mb-8">
          대라천 웹사이트의 기본 정보와 설정을 관리합니다.
        </p>

        <div className="space-y-8">
          {/* Section 1: Basic Info */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">기본 정보</h2>
            <p className="text-xs text-gray-400 mb-6">사이트 메타·홈페이지 등에 사용되는 회사 기본 정보입니다.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LabeledInput
                label="회사명"
                value={basicInfo.name}
                onChange={(v) => setBasicInfo({ ...basicInfo, name: v })}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사 소개
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
                  value={basicInfo.description}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, description: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  푸터 브랜드 설명
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
                  value={basicInfo.brandDesc}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, brandDesc: e.target.value })
                  }
                  placeholder="조엘라이프의 대라천 '참'침향은 ..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  사이트 하단 푸터의 브랜드 로고 아래에 표시되는 회사 소개 문단. 비어있으면 기본 문구가 노출됩니다.
                </p>
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="브랜드 로고 (좌측 상단 Header)"
                  value={basicInfo.brandLogo}
                  onChange={(url) => setBasicInfo({ ...basicInfo, brandLogo: url })}
                  subdir="settings"
                />
                <p className="mt-1 text-xs text-gray-400">
                  사이트 전 페이지 좌측 상단 nav 에 표시. 비어있으면 골드 도트 + 텍스트 fallback.
                </p>
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="ZOEL LIFE 회사 로고 (Company 페이지)"
                  value={basicInfo.companyLogo}
                  onChange={(url) => setBasicInfo({ ...basicInfo, companyLogo: url })}
                  subdir="settings"
                />
                <p className="mt-1 text-xs text-gray-400">
                  /company 페이지 상단에 표시. 비어있으면 미노출.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveBasicInfo} loading={saving === 'basic'} />
            </div>
          </section>

          {/* Section 2: Footer / Company Info */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">푸터 회사 정보</h2>
            <p className="text-xs text-gray-400 mb-6">
              사이트 하단(footer) 및 llms.txt 에 표시되는 회사 사업자 정보를 관리합니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LabeledInput
                label="대표"
                value={footerInfo.ceo}
                onChange={(v) => setFooterInfo({ ...footerInfo, ceo: v })}
              />
              <LabeledInput
                label="사업자등록번호"
                value={footerInfo.businessReg}
                onChange={(v) => setFooterInfo({ ...footerInfo, businessReg: v })}
              />
              <div className="md:col-span-2">
                <LabeledInput
                  label="주소"
                  value={footerInfo.address}
                  onChange={(v) => setFooterInfo({ ...footerInfo, address: v })}
                />
              </div>
              <LabeledInput
                label="전화"
                value={footerInfo.phone}
                onChange={(v) => setFooterInfo({ ...footerInfo, phone: v })}
              />
              <LabeledInput
                label="이메일"
                type="email"
                value={footerInfo.email}
                onChange={(v) => setFooterInfo({ ...footerInfo, email: v })}
              />
              <LabeledInput
                label="설립일 (선택)"
                value={footerInfo.foundingDate}
                onChange={(v) => setFooterInfo({ ...footerInfo, foundingDate: v })}
              />
            </div>
            <div className="mt-6 rounded-lg bg-gray-50 border border-gray-100 p-4 text-xs text-gray-600 leading-relaxed">
              <p className="font-medium text-gray-700 mb-1.5">미리보기</p>
              <p>
                대표: {footerInfo.ceo || '대표자명'}
                <span className="mx-1.5 text-gray-400">·</span>
                사업자등록번호: {footerInfo.businessReg || '000-00-00000'}
                <span className="mx-1.5 text-gray-400">·</span>
                주소: {footerInfo.address || '주소'}
                <span className="mx-1.5 text-gray-400">·</span>
                전화: {footerInfo.phone || '전화번호'} | 이메일: {footerInfo.email || 'email@example.com'}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveFooterInfo} loading={saving === 'footer'} />
            </div>
          </section>

          {/* Section 3: Social Media */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">소셜 미디어</h2>
            <p className="text-xs text-gray-400 mb-6">URL이 비어있으면 프론트에서 자동으로 숨겨집니다.</p>
            <div className="space-y-3">
              {socialLinks.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    placeholder="이름 (예: Instagram)"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...socialLinks];
                      next[i] = { ...next[i], label: e.target.value };
                      setSocialLinks(next);
                    }}
                    className="w-32 shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={item.url}
                    onChange={(e) => {
                      const next = [...socialLinks];
                      next[i] = { ...next[i], url: e.target.value };
                      setSocialLinks(next);
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))}
                    className="shrink-0 text-red-400 hover:text-red-600 px-2 py-2 text-sm border border-red-200 rounded-lg"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSocialLinks([...socialLinks, { label: '', url: '' }])}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium"
              >
                + 항목 추가
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveSocial} loading={saving === 'social'} />
            </div>
          </section>

          {/* Section 4: SEO Settings */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">SEO 설정</h2>
                <p className="mt-1 text-xs text-gray-400">
                  사이트 메타 태그·검색 결과·SNS 공유 카드(OG)에 사용됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeo({ ...SEO_DEFAULTS })}
                className="shrink-0 rounded-lg border border-gold-300 bg-white px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-50"
              >
                권장 기본값으로 채우기
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <LabeledInput
                  label="메타 타이틀"
                  value={seo.metaTitle}
                  onChange={(v) => setSeo({ ...seo, metaTitle: v })}
                />
                <p className="mt-1 text-xs text-gray-400">
                  검색 결과 제목·브라우저 탭 제목. 권장 50–60자. 현재 {seo.metaTitle.length}자
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메타 설명</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
                  value={seo.metaDescription}
                  onChange={(e) =>
                    setSeo({ ...seo, metaDescription: e.target.value })
                  }
                />
                <p className="mt-1 text-xs text-gray-400">
                  검색 결과 본문 발췌. 권장 150–160자. 현재 {seo.metaDescription.length}자
                </p>
              </div>
              <div>
                <LabeledInput
                  label="키워드 (쉼표로 구분)"
                  value={seo.keywords}
                  onChange={(v) => setSeo({ ...seo, keywords: v })}
                />
                <p className="mt-1 text-xs text-gray-400">
                  현재 {seo.keywords.split(',').filter((k) => k.trim()).length}개 키워드
                </p>
              </div>
              <div>
                <ImageUploadField
                  label="OG 이미지 (SNS 공유 카드)"
                  value={seo.ogImage}
                  onChange={(url) => setSeo({ ...seo, ogImage: url })}
                  subdir="settings"
                />
                <p className="mt-1 text-xs text-gray-400">
                  카카오톡·페이스북·트위터 공유 시 노출. 권장 1200×630.
                </p>
              </div>

              {/* 검색 결과 미리보기 */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-medium text-gray-500">Google 검색 결과 미리보기</p>
                <div className="space-y-1">
                  <p className="truncate text-xs text-emerald-700">
                    https://www.zoellife.com › ko
                  </p>
                  <p className="truncate text-base text-blue-700 hover:underline">
                    {seo.metaTitle || '메타 타이틀'}
                  </p>
                  <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">
                    {seo.metaDescription || '메타 설명이 여기에 표시됩니다.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveSeo} loading={saving === 'seo'} />
            </div>
          </section>

          {/* Section 5: Announcement Banner */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">공지 배너</h2>
            <p className="text-sm text-gray-500 mb-6">
              공개 사이트 상단에 표시되는 공지 배너를 관리합니다.
              저장 후 기존 페이지에 반영되기까지 최대 60초가 소요될 수 있습니다.
            </p>

            <div className="space-y-5">
              {/* Enable toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={announcement.enabled}
                  onClick={handleToggleEnabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    announcement.enabled ? 'bg-gold-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ${
                      announcement.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {announcement.enabled ? '배너 활성화' : '배너 비활성화'}
                </span>
              </div>

              {/* Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공지 텍스트</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
                  placeholder="공지 내용을 입력하세요"
                  value={announcement.text}
                  onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                />
              </div>

              {/* Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">링크 URL (선택)</label>
                  <input
                    type="url"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
                    placeholder="https://..."
                    value={announcement.link}
                    onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">링크 라벨 (선택)</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
                    placeholder="자세히 보기"
                    value={announcement.linkLabel}
                    onChange={(e) => setAnnouncement({ ...announcement, linkLabel: e.target.value })}
                  />
                </div>
              </div>

              {/* Variant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">배경 색상</label>
                <div className="flex gap-4">
                  {([
                    { value: 'gold', label: '골드', bg: 'bg-amber-600', preview: 'text-white' },
                    { value: 'dark', label: '다크', bg: 'bg-gray-900', preview: 'text-white' },
                    { value: 'red', label: '레드', bg: 'bg-red-600', preview: 'text-white' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="variant"
                        value={opt.value}
                        checked={announcement.variant === opt.value}
                        onChange={() => setAnnouncement({ ...announcement, variant: opt.value })}
                        className="sr-only"
                      />
                      <span
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${opt.bg} ${opt.preview} ${
                          announcement.variant === opt.value ? 'ring-2 ring-offset-2 ring-gold-500' : 'opacity-70'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveAnnouncement} loading={savingAnnouncement} />
            </div>
          </section>

          {/* Section 5.5: Mail Settings */}
          <MailSettingsSection
            onToast={setToast}
            saving={saving === 'mail'}
            setSaving={(v) => setSaving(v ? 'mail' : null)}
          />

          {/* Section 6: Data Backup */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 백업 / 복원</h2>
            <p className="text-sm text-gray-500 mb-6">
              모든 DB JSON 파일(제품, 리뷰, 문의, 방송, FAQ, 미디어 등)을 단일 JSON으로 내려받거나, 백업 파일로 복원할 수 있습니다.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <a
                href="/api/admin/backup"
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                전체 데이터 JSON 다운로드
              </a>
            </div>

            <BackupRestoreForm />
          </section>
        </div>
      </div>
    </div>
  );
}

// Reusable components

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SaveButton({ onClick, loading = false }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="adm-btn-primary px-6"
    >
      {loading ? '저장 중...' : '저장'}
    </button>
  );
}

interface MailSettingsForm {
  smtpHost: string;
  smtpPort: number | '';
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  adminEmail: string;
  resendApiKey: string;
}

function MailSettingsSection({
  onToast,
  saving,
  setSaving,
}: {
  onToast: (msg: string) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState<MailSettingsForm>({
    smtpHost: '',
    smtpPort: 465,
    smtpUser: '',
    smtpPass: '',
    mailFrom: '',
    adminEmail: '',
    resendApiKey: '',
  });

  useEffect(() => {
    fetch('/api/admin/mail-settings')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          smtpHost: data.smtpHost ?? '',
          smtpPort: data.smtpPort ?? 465,
          smtpUser: data.smtpUser ?? '',
          smtpPass: data.smtpPass ?? '',
          mailFrom: data.mailFrom ?? '',
          adminEmail: data.adminEmail ?? '',
          resendApiKey: data.resendApiKey ?? '',
        });
      })
      .catch(() => onToast('메일 설정 로드 실패'))
      .finally(() => setLoading(false));
  }, [onToast]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/mail-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          smtpPort: typeof form.smtpPort === 'number' ? form.smtpPort : Number(form.smtpPort) || 465,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      // 서버가 마스킹된 비밀 필드를 돌려보냄 — UI 동기화
      setForm((f) => ({
        ...f,
        smtpPass: data.settings?.smtpPass ?? '',
        resendApiKey: data.settings?.resendApiKey ?? '',
      }));
      onToast('메일 설정 저장 완료');
    } catch {
      onToast('메일 설정 저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/mail-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      onToast(data.success ? data.message : `테스트 실패: ${data.message}`);
    } catch (err) {
      onToast(`테스트 실패: ${err instanceof Error ? err.message : '오류'}`);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
        <div className="h-32 bg-gray-100 rounded" />
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">메일 발송 설정</h2>
      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
        문의 폼 등 사이트에서 발송하는 메일의 SMTP 설정. <br />
        <span className="text-gray-700 font-medium">Gmail / Workspace 권장</span>:
        2단계 인증 활성화 후{' '}
        <a
          href="https://myaccount.google.com/apppasswords"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-700 underline"
        >
          앱 비밀번호
        </a>{' '}
        16자를 발급해 SMTP_PASS 에 입력. <br />
        값을 비워두면 Vercel 환경변수(<code className="text-xs bg-gray-100 px-1">SMTP_*</code>)를 사용합니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <LabeledInput label="SMTP Host" value={form.smtpHost} onChange={(v) => setForm({ ...form, smtpHost: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
          <input
            type="number"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
            value={form.smtpPort}
            onChange={(e) => setForm({ ...form, smtpPort: e.target.value === '' ? '' : Number(e.target.value) })}
          />
          <p className="mt-1 text-xs text-gray-400">Gmail: 465 (SSL) 또는 587 (STARTTLS)</p>
        </div>
        <LabeledInput label="SMTP User (발송 계정)" value={form.smtpUser} onChange={(v) => setForm({ ...form, smtpUser: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password (앱 비밀번호)</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
            value={form.smtpPass}
            onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-400">저장 후 ●●●● 로 마스킹 표시. 변경 시에만 새로 입력.</p>
        </div>
        <LabeledInput
          label="발신 주소 (MAIL_FROM)"
          value={form.mailFrom}
          onChange={(v) => setForm({ ...form, mailFrom: v })}
        />
        <LabeledInput
          label="관리자 수신 이메일 (ADMIN_EMAIL)"
          value={form.adminEmail}
          onChange={(v) => setForm({ ...form, adminEmail: v })}
        />
        <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resend API Key <span className="text-xs font-normal text-gray-400">(SMTP 미사용 시 대안)</span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
            value={form.resendApiKey}
            onChange={(e) => setForm({ ...form, resendApiKey: e.target.value })}
            placeholder="re_xxxxxxxxxxxxxxxx"
          />
          <p className="mt-1 text-xs text-gray-400">SMTP Host 가 비어있고 이 값이 설정되면 Resend HTTP API 사용.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={sendTest}
          disabled={testing}
          className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-60"
        >
          {testing ? '발송 중...' : '테스트 메일 발송'}
        </button>
        <SaveButton onClick={save} loading={saving} />
      </div>
    </section>
  );
}

function BackupRestoreForm() {
  const [file, setFile] = useState<File | null>(null);
  const [restoreUsers, setRestoreUsers] = useState(false);
  const [restoreAuditLog, setRestoreAuditLog] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleRestore() {
    if (!file) return;
    setRestoring(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      if (restoreUsers) form.append('restoreUsers', 'true');
      if (restoreAuditLog) form.append('restoreAuditLog', 'true');
      const res = await fetch('/api/admin/backup', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setResult({ ok: false, message: data.message ?? '복원 실패' });
        return;
      }
      setResult({
        ok: true,
        message: data.message ?? '복원 완료',
        detail: `복원: ${(data.restored ?? []).join(', ') || '-'} | 스킵: ${(data.skipped ?? []).join(', ') || '-'}`,
      });
      setFile(null);
    } finally {
      setRestoring(false);
      setConfirming(false);
    }
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-base font-semibold text-gray-900 mb-2">백업 파일로 복원</h3>
      <p className="text-xs text-gray-500 mb-4">
        이전에 다운로드한 JSON 백업 파일을 업로드해 전체 데이터를 복원합니다. ⚠️ 현재 데이터는 덮어쓰기됩니다.
      </p>

      <div className="space-y-3">
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-widest file:text-white hover:file:bg-gray-900"
        />

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={restoreUsers} onChange={(e) => setRestoreUsers(e.target.checked)} className="h-3.5 w-3.5" />
            <span>관리자 계정 (admin-users)도 덮어쓰기</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={restoreAuditLog} onChange={(e) => setRestoreAuditLog(e.target.checked)} className="h-3.5 w-3.5" />
            <span>감사 로그 (audit-log)도 덮어쓰기</span>
          </label>
        </div>

        {file && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={restoring}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {restoring ? '복원 중...' : '백업 복원 실행'}
          </button>
        )}

        {confirming && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
            <p className="font-medium text-red-800">
              정말 복원하시겠습니까? 현재 DB가 백업 파일로 덮어쓰기됩니다.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {restoring ? '복원 중...' : '네, 복원합니다'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-700 hover:bg-white"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className={`rounded-lg p-4 text-xs ${result.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <p className="font-semibold">{result.message}</p>
            {result.detail && <p className="mt-1 opacity-80">{result.detail}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
