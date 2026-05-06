import { DEFAULT_PRIVACY } from '@/data/legal';
import LegalEditor from './LegalEditor';

export default function AdminPrivacyPage() {
  return (
    <LegalEditor
      pageKey="privacy"
      pageTitle="개인정보처리방침"
      publicPath="/privacy"
      defaultDoc={DEFAULT_PRIVACY}
    />
  );
}
