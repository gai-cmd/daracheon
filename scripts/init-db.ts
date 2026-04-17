// Run with: npx tsx scripts/init-db.ts
import fs from 'fs';
import path from 'path';
import { products, productCategories } from '../src/data/products';
import { reviews } from '../src/data/reviews';
import { company, mediaItems, faqItems } from '../src/data/company';

const DB_DIR = path.join(process.cwd(), 'data', 'db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function write(name: string, data: unknown) {
  fs.writeFileSync(path.join(DB_DIR, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`✓ ${name}.json created`);
}

write('products', products);
write('productCategories', productCategories);
write('reviews', reviews);
write('company', company);
write('media', mediaItems);
write('faq', faqItems.map((item, i) => ({ id: `faq-${i + 1}`, ...item })));
write('inquiries', [
  { id: 'inq-1', name: '김민수', email: 'kim@example.com', phone: '010-1234-5678', category: 'product', message: '프리미엄 침향 원목 대량 구매 문의드립니다.', date: '2026-04-05', status: 'new' },
  { id: 'inq-2', name: '이지은', email: 'lee@example.com', phone: '', category: 'wholesale', message: '도매 거래 조건을 알고 싶습니다.', date: '2026-04-04', status: 'replied' },
  { id: 'inq-3', name: '박서준', email: 'park@example.com', phone: '010-9876-5432', category: 'order', message: '주문한 건강차 배송 상태 확인 부탁드립니다.', date: '2026-04-03', status: 'resolved' },
]);

console.log('\n✅ Database initialized successfully!');
