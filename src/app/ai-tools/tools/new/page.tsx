'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../../ai-tools.module.css';
import ToolForm from '../ToolForm';
import type { Team } from '@/lib/ai-tools/types';

export default function NewToolPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetch('/api/ai-tools/teams')
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []))
      .catch(() => {});
  }, []);

  const submit = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/ai-tools/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '등록 실패');
    router.push(`/ai-tools/tools/${data.tool.id}`);
  };

  return (
    <>
      <Link href="/ai-tools/tools" className={styles.backLink}>
        ← 툴 목록
      </Link>
      <div className={styles.h1}>신규 AI툴 등록</div>
      <p className={styles.sub}>툴명·팀·상태는 필수 성격. 금액 미입력 시 자동으로 &ldquo;확인필요&rdquo;로 저장됩니다.</p>
      <div className={styles.card}>
        <ToolForm
          teams={teams}
          submitLabel="등록"
          onSubmit={submit}
          onCancel={() => router.push('/ai-tools/tools')}
        />
      </div>
    </>
  );
}
