'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EditionContentEditor from './EditionContentEditor';
import EditionLeadsPanel from './EditionLeadsPanel';

type Tab = 'overview' | 'content' | 'leads';

interface LeadsStats {
  total: number;
  pending: number;
  verified: number;
  expired: number;
  recent: { id: string; email: string; name: string; status: string; createdAt: string }[];
}

export default function AdminEditionHub() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<LeadsStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/leads', { cache: 'no-store' });
        if (!res.ok) return;
        const body = (await res.json()) as { success: boolean; leads?: { id: string; email: string; name: string; status: string; createdAt: string }[] };
        const leads = body.leads ?? [];
        setStats({
          total: leads.length,
          pending: leads.filter((l) => l.status === 'pending').length,
          verified: leads.filter((l) => l.status === 'verified').length,
          expired: leads.filter((l) => l.status === 'expired').length,
          recent: [...leads].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5),
        });
      } catch {
        /* silent */
      }
    })();
  }, [tab]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">디지털 에디션</h1>
        <p className="mt-1 text-sm text-gray-500">
          한정 공개 디지털 카탈로그의 콘텐츠 편집·신청 리드 관리·미리보기를 한 곳에서.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
        {[
          { k: 'overview' as const, label: '개요' },
          { k: 'content' as const, label: '카탈로그 콘텐츠' },
          { k: 'leads' as const, label: '신청 리드' },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.k
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab stats={stats} />}
      {tab === 'content' && <EditionContentEditor />}
      {tab === 'leads' && <EditionLeadsPanel />}
    </div>
  );
}

function OverviewTab({ stats }: { stats: LeadsStats | null }) {
  return (
    <div className="space-y-6">
      {/* Process Map — 카탈로그 발송 플로우 한눈에 */}
      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">발송 프로세스</h2>
        <ol className="space-y-3 text-sm">
          <ProcessStep
            num="01"
            title="공개 신청 페이지"
            desc="/agarwood-edition 에서 방문자가 이름·이메일·회사·역할을 입력해 신청합니다."
            href="/agarwood-edition"
            external
          />
          <ProcessStep
            num="02"
            title="인증 메일 자동 발송"
            desc="신청과 동시에 토큰이 포함된 인증 링크가 신청자 이메일로 발송됩니다 (14일 유효)."
          />
          <ProcessStep
            num="03"
            title="이메일 인증 → 리드 verified"
            desc="신청자가 메일 링크 클릭 → /api/agarwood-edition/verify 로 토큰 검증, 리드 상태 verified 로 전환."
          />
          <ProcessStep
            num="04"
            title="디지털 카탈로그 열람"
            desc="/edition/[token]/agarwood 에서 카탈로그 페이지가 열립니다. 열람 시각·횟수 자동 기록."
          />
          <ProcessStep
            num="05"
            title="카탈로그 콘텐츠 편집"
            desc="카탈로그 콘텐츠 탭에서 표지·머리말·챕터·갤러리·라인업·마무리를 편집. 모든 토큰 카탈로그에 즉시 반영."
          />
          <ProcessStep
            num="06"
            title="리드 관리"
            desc="신청 리드 탭에서 리드 상태 확인, 인증 메일 재발송, 카탈로그 URL 복사, CSV 내보내기."
          />
        </ol>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="전체 리드" value={stats?.total ?? '—'} />
        <StatCard label="인증 완료" value={stats?.verified ?? '—'} color="text-emerald-600" />
        <StatCard label="대기 중" value={stats?.pending ?? '—'} color="text-amber-600" />
        <StatCard label="만료" value={stats?.expired ?? '—'} color="text-gray-400" />
      </section>

      {/* Quick actions */}
      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">빠른 작업</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/agarwood-edition"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-gold-500 hover:bg-gold-50/30"
          >
            <span className="text-xl text-gold-500">↗</span>
            <div>
              <div className="text-sm font-semibold text-gray-900">공개 신청 페이지 미리보기</div>
              <div className="text-xs text-gray-500 mt-0.5">/agarwood-edition — 새 탭으로 열림</div>
            </div>
          </a>
          <Link
            href="/admin/settings"
            className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-gold-500 hover:bg-gold-50/30"
          >
            <span className="text-xl text-gold-500">✉</span>
            <div>
              <div className="text-sm font-semibold text-gray-900">메일 발송 설정 확인</div>
              <div className="text-xs text-gray-500 mt-0.5">SMTP 설정이 없으면 인증 메일이 발송되지 않습니다.</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent leads */}
      {stats && stats.recent.length > 0 && (
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">최근 신청 (최대 5건)</h2>
          <ul className="divide-y divide-gray-100">
            {stats.recent.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium text-gray-900">{l.name}</div>
                  <div className="text-xs text-gray-500">{l.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={l.status} />
                  <span className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleString('ko-KR')}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProcessStep({
  num,
  title,
  desc,
  href,
  external,
}: {
  num: string;
  title: string;
  desc: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-start gap-4">
      <span className="font-mono text-xs font-semibold text-gold-600">{num}</span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className="mt-0.5 text-xs text-gray-600">{desc}</div>
      </div>
      {href && <span className="text-gold-500">↗</span>}
    </div>
  );
  if (!href) return <li className="rounded-lg bg-gray-50 px-4 py-3">{inner}</li>;
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-gray-50 px-4 py-3 hover:bg-gold-50/40">
          {inner}
        </a>
      ) : (
        <Link href={href} className="block rounded-lg bg-gray-50 px-4 py-3 hover:bg-gold-50/40">
          {inner}
        </Link>
      )}
    </li>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending: { label: '대기', cls: 'bg-amber-100 text-amber-700' },
    verified: { label: '인증', cls: 'bg-emerald-100 text-emerald-700' },
    expired: { label: '만료', cls: 'bg-gray-100 text-gray-500' },
  };
  const c = cfg[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${c.cls}`}>{c.label}</span>;
}
