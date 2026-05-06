import { DEFAULT_TERMS } from '@/data/legal';
import LegalEditor from '../privacy/LegalEditor';

export default function AdminTermsPage() {
  return (
    <LegalEditor
      pageKey="terms"
      pageTitle="이용약관"
      publicPath="/terms"
      defaultDoc={DEFAULT_TERMS}
    />
  );
}
