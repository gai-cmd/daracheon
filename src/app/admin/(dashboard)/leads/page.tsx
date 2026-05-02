import { redirect } from 'next/navigation';

// 에디션 리드 관리는 통합 허브 /admin/edition 의 '신청 리드' 탭으로 이동.
export default function LeadsLegacyPage(): never {
  redirect('/admin/edition');
}
