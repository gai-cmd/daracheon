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

interface Farm {
  name: string;
  nameVi: string;
  region: string;
  trees: number;
}

interface Certification {
  name: string;
  nameEn: string;
  icon: string;
  description: string;
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

interface SettingsData {
  name: string;
  nameHanja: string;
  nameEn: string;
  nameVi: string;
  slogan: string;
  sloganEn: string;
  description: string;
  email: string;
  url: string;
  logo: string;
  brandLogo: string;
  companyLogo: string;
  socialLinks?: SocialLink[];
  farms: Farm[];
  certifications: Certification[];
  awards: string[];
  seo: SeoSettings;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Section 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    nameHanja: '',
    nameEn: '',
    nameVi: '',
    slogan: '',
    sloganEn: '',
    description: '',
    email: '',
    url: '',
    logo: '',
    brandLogo: '',
    companyLogo: '',
  });

  // Section 2: Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  // Section 3: Farms
  const [farms, setFarms] = useState<Farm[]>([]);
  const [editingFarmIndex, setEditingFarmIndex] = useState<number | null>(null);
  const [farmForm, setFarmForm] = useState<Farm>({
    name: '',
    nameVi: '',
    region: '',
    trees: 0,
  });

  // Section 4: Certifications & Awards
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [awards, setAwards] = useState<string[]>([]);
  const [newAward, setNewAward] = useState('');

  // Section 5: SEO
  const [seo, setSeo] = useState<SeoSettings>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    ogImage: '',
  });

  // Section 6: Announcement Banner
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
          nameHanja: data.nameHanja || '',
          nameEn: data.nameEn || '',
          nameVi: data.nameVi || '',
          slogan: data.slogan || '',
          sloganEn: data.sloganEn || '',
          description: data.description || '',
          email: data.email || '',
          url: data.url || '',
          logo: data.logo || '',
          brandLogo: data.brandLogo || '',
          companyLogo: data.companyLogo || '',
        });
        setSocialLinks(Array.isArray(data.socialLinks) ? data.socialLinks : []);
        setFarms(data.farms || []);
        setCertifications(
          (data.certifications || []).map((c) => ({
            name: c.name,
            nameEn: c.nameEn,
            icon: c.icon,
            description: c.description,
          }))
        );
        setAwards(data.awards || []);
        setSeo(data.seo || {
          metaTitle: '',
          metaDescription: '',
          keywords: '',
          ogImage: '',
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
  const handleSaveSocial = () => saveSection('social', { socialLinks });
  const handleSaveFarms = () => saveSection('farms', { farms });
  const handleSaveCertifications = () => saveSection('certs', { certifications, awards });
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

  // Farm CRUD
  const handleAddFarm = () => {
    if (!farmForm.name || !farmForm.region) return;
    setFarms([...farms, { ...farmForm }]);
    setFarmForm({ name: '', nameVi: '', region: '', trees: 0 });
  };

  const handleEditFarm = (index: number) => {
    setEditingFarmIndex(index);
    setFarmForm({ ...farms[index] });
  };

  const handleUpdateFarm = () => {
    if (editingFarmIndex === null) return;
    const updated = [...farms];
    updated[editingFarmIndex] = { ...farmForm };
    setFarms(updated);
    setEditingFarmIndex(null);
    setFarmForm({ name: '', nameVi: '', region: '', trees: 0 });
  };

  const handleRemoveFarm = (index: number) => {
    if (!confirm('이 농장을 삭제하시겠습니까?')) return;
    setFarms(farms.filter((_, i) => i !== index));
  };

  // Certification CRUD
  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      { name: '', nameEn: '', icon: '', description: '' },
    ]);
  };

  const handleUpdateCertification = (
    index: number,
    field: keyof Certification,
    value: string
  ) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const handleRemoveCertification = (index: number) => {
    if (!confirm('이 인증을 삭제하시겠습니까?')) return;
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Award CRUD
  const handleAddAward = () => {
    if (!newAward.trim()) return;
    setAwards([...awards, newAward.trim()]);
    setNewAward('');
  };

  const handleRemoveAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              기본 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LabeledInput
                label="회사명 (한글)"
                value={basicInfo.name}
                onChange={(v) => setBasicInfo({ ...basicInfo, name: v })}
              />
              <LabeledInput
                label="회사명 (한자)"
                value={basicInfo.nameHanja}
                onChange={(v) => setBasicInfo({ ...basicInfo, nameHanja: v })}
              />
              <LabeledInput
                label="회사명 (영문)"
                value={basicInfo.nameEn}
                onChange={(v) => setBasicInfo({ ...basicInfo, nameEn: v })}
              />
              <LabeledInput
                label="회사명 (베트남어)"
                value={basicInfo.nameVi}
                onChange={(v) => setBasicInfo({ ...basicInfo, nameVi: v })}
              />
              <LabeledInput
                label="슬로건 (한글)"
                value={basicInfo.slogan}
                onChange={(v) => setBasicInfo({ ...basicInfo, slogan: v })}
              />
              <LabeledInput
                label="슬로건 (영문)"
                value={basicInfo.sloganEn}
                onChange={(v) => setBasicInfo({ ...basicInfo, sloganEn: v })}
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
              <LabeledInput
                label="이메일"
                type="email"
                value={basicInfo.email}
                onChange={(v) => setBasicInfo({ ...basicInfo, email: v })}
              />
              <LabeledInput
                label="웹사이트 URL"
                type="url"
                value={basicInfo.url}
                onChange={(v) => setBasicInfo({ ...basicInfo, url: v })}
              />
              <div className="md:col-span-2">
                <ImageUploadField
                  label="로고 이미지 (legacy)"
                  value={basicInfo.logo}
                  onChange={(url) => setBasicInfo({ ...basicInfo, logo: url })}
                  subdir="settings"
                />
                <p className="mt-1 text-xs text-gray-400">
                  하위 호환용 단일 로고 필드. 신규 사이트에서는 아래 두 로고를 사용합니다.
                </p>
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="브랜드 로고 (좌측 상단 Header — 대라천)"
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

          {/* Section 2: Social Media */}
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

          {/* Section 3: Farm Management */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              농장 관리
            </h2>

            {/* Farm Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-600">
                      농장명
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">
                      베트남어명
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">
                      지역
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">
                      나무 수
                    </th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {farms.map((farm, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3 text-gray-900">{farm.name}</td>
                      <td className="py-3 px-3 text-gray-600">{farm.nameVi}</td>
                      <td className="py-3 px-3 text-gray-600">{farm.region}</td>
                      <td className="py-3 px-3 text-right text-gray-900">
                        {farm.trees.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleEditFarm(index)}
                          className="text-gold-600 hover:text-gold-700 text-sm mr-3"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleRemoveFarm(index)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Farm Form */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {editingFarmIndex !== null ? '농장 수정' : '농장 추가'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  placeholder="농장명"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                  value={farmForm.name}
                  onChange={(e) =>
                    setFarmForm({ ...farmForm, name: e.target.value })
                  }
                />
                <input
                  placeholder="베트남어명"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                  value={farmForm.nameVi}
                  onChange={(e) =>
                    setFarmForm({ ...farmForm, nameVi: e.target.value })
                  }
                />
                <input
                  placeholder="지역"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                  value={farmForm.region}
                  onChange={(e) =>
                    setFarmForm({ ...farmForm, region: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="나무 수"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                  value={farmForm.trees || ''}
                  onChange={(e) =>
                    setFarmForm({
                      ...farmForm,
                      trees: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="mt-3 flex gap-2">
                {editingFarmIndex !== null ? (
                  <>
                    <button
                      onClick={handleUpdateFarm}
                      className="adm-btn-primary"
                    >
                      수정 완료
                    </button>
                    <button
                      onClick={() => {
                        setEditingFarmIndex(null);
                        setFarmForm({
                          name: '',
                          nameVi: '',
                          region: '',
                          trees: 0,
                        });
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddFarm}
                    className="adm-btn-primary"
                  >
                    농장 추가
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveFarms} loading={saving === 'farms'} />
            </div>
          </section>

          {/* Section 4: Certifications & Awards */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              인증 및 수상
            </h2>

            {/* Certifications */}
            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-800 mb-4">
                인증 목록
              </h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 relative"
                  >
                    <button
                      onClick={() => handleRemoveCertification(index)}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-sm"
                    >
                      삭제
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <input
                        placeholder="아이콘"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        value={cert.icon}
                        onChange={(e) =>
                          handleUpdateCertification(
                            index,
                            'icon',
                            e.target.value
                          )
                        }
                      />
                      <input
                        placeholder="인증명 (한글)"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        value={cert.name}
                        onChange={(e) =>
                          handleUpdateCertification(
                            index,
                            'name',
                            e.target.value
                          )
                        }
                      />
                      <input
                        placeholder="인증명 (영문)"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                        value={cert.nameEn}
                        onChange={(e) =>
                          handleUpdateCertification(
                            index,
                            'nameEn',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <textarea
                      placeholder="설명"
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                      value={cert.description}
                      onChange={(e) =>
                        handleUpdateCertification(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddCertification}
                className="mt-3 text-gold-600 hover:text-gold-700 text-sm font-medium"
              >
                + 인증 추가
              </button>
            </div>

            {/* Awards */}
            <div>
              <h3 className="text-base font-medium text-gray-800 mb-4">
                수상 내역
              </h3>
              <ul className="space-y-2 mb-4">
                {awards.map((award, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5"
                  >
                    <span className="text-sm text-gray-800">{award}</span>
                    <button
                      onClick={() => handleRemoveAward(index)}
                      className="text-red-400 hover:text-red-600 text-sm ml-4 shrink-0"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  placeholder="수상 내역 입력"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                  value={newAward}
                  onChange={(e) => setNewAward(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddAward();
                  }}
                />
                <button
                  onClick={handleAddAward}
                  className="adm-btn-primary"
                >
                  추가
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveCertifications} loading={saving === 'certs'} />
            </div>
          </section>

          {/* Section 5: SEO Settings */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              SEO 설정
            </h2>
            <div className="space-y-4">
              <LabeledInput
                label="메타 타이틀"
                value={seo.metaTitle}
                onChange={(v) => setSeo({ ...seo, metaTitle: v })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메타 설명
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-colors"
                  value={seo.metaDescription}
                  onChange={(e) =>
                    setSeo({ ...seo, metaDescription: e.target.value })
                  }
                />
              </div>
              <LabeledInput
                label="키워드 (쉼표로 구분)"
                value={seo.keywords}
                onChange={(v) => setSeo({ ...seo, keywords: v })}
              />
              <ImageUploadField
                label="OG 이미지"
                value={seo.ogImage}
                onChange={(url) => setSeo({ ...seo, ogImage: url })}
                subdir="settings"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <SaveButton onClick={handleSaveSeo} loading={saving === 'seo'} />
            </div>
          </section>

          {/* Section 6: Announcement Banner */}
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

          {/* Section 7: Data Backup */}
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
