import { redirect } from 'next/navigation';

// 디지털 에디션 편집은 통합 허브 /admin/edition 의 '카탈로그 콘텐츠' 탭으로 이동.
export default function EditionAgarwoodLegacyPage(): never {
  redirect('/admin/edition');
}
