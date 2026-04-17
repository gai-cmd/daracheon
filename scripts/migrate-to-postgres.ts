/**
 * JSON DB → Postgres 마이그레이션 스크립트
 *
 * 사전 요구사항:
 *   1) DATABASE_URL 환경변수 설정 (.env.local)
 *   2) Prisma 설치:
 *        npm install -D prisma
 *        npm install @prisma/client
 *   3) 프로젝트 루트에 아래 출력되는 schema 를 prisma/schema.prisma 로 저장
 *   4) 마이그레이션 생성:
 *        npx prisma migrate dev --name init
 *   5) Prisma Client 생성:
 *        npx prisma generate
 *   6) 이 파일 하단 PRISMA_IMPORT_BLOCK 영역의 주석을 해제하고 실행:
 *        npx tsx scripts/migrate-to-postgres.ts --run
 *
 * --run 플래그 없으면 dry-run (스키마만 출력).
 * 기존 Postgres 데이터가 있을 경우 upsert 방식으로 병합합니다.
 */

import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data', 'db');
const DRY_RUN = !process.argv.includes('--run');

const PRISMA_SCHEMA = `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id                 String    @id
  slug               String    @unique
  name               String
  nameEn             String    @default("")
  category           String
  categoryEn         String    @default("")
  badge              String    @default("")
  price              Int
  priceDisplay       String
  image              String    @default("")
  gallery            String[]  @default([])
  description        String    @default("")
  shortDescription   String    @default("")
  features           String[]  @default([])
  specs              Json      @default("{}")
  inStock            Boolean   @default(true)
  variants           Json?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@map("product")
}

model ProductCategory {
  id       String @id
  label    String
  labelEn  String @default("")

  @@map("product_category")
}

model Review {
  id        String   @id
  author    String
  age       String   @default("")
  product   String
  rating    Int
  title     String   @default("")
  content   String
  date      DateTime @default(now())
  verified  Boolean  @default(false)

  @@map("review")
}

model Inquiry {
  id        String    @id
  name      String
  email     String
  phone     String?
  category  String
  subject   String?
  message   String
  date      DateTime  @default(now())
  status    String    @default("new")
  reply     String?
  replyAt   DateTime?
  replyBy   String?

  @@map("inquiry")
}

model Media {
  id      String   @id
  type    String
  title   String
  source  String   @default("")
  date    DateTime
  image   String   @default("")
  excerpt String   @default("")
  url     String   @default("")

  @@map("media")
}

model Broadcast {
  id              String    @id
  channel         String
  scheduledAt     DateTime
  durationMinutes Int       @default(60)
  host            String?
  productIds      String[]  @default([])
  specialPrice    Int?
  regularPrice    Int?
  discountRate    Int?
  livestreamUrl   String?
  vodUrl          String?
  description     String?
  status          String    @default("scheduled")
  salesCount      Int?
  feedback        String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("broadcast")
}

model Faq {
  id       String  @id
  question String
  answer   String
  category String?

  @@map("faq")
}

model AdminUser {
  email         String    @id
  role          String
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  failedAttempts Int?     @default(0)
  lockedUntil   DateTime?
  totpSecret    String?
  totpEnabled   Boolean?  @default(false)

  @@map("admin_user")
}

model AuditLog {
  id        String   @id
  at        DateTime @default(now())
  actor     String
  actorRole String
  module    String
  action    String
  targetId  String?
  summary   String?
  meta      Json?

  @@index([at])
  @@index([module, action])
  @@index([actor])
  @@map("audit_log")
}

model Singleton {
  id      String   @id
  data    Json
  updated DateTime @default(now()) @updatedAt

  @@map("singleton")
}
`;

type TransformFn = (row: Record<string, unknown>) => Record<string, unknown>;

interface ArrayModule {
  file: string;
  modelMethod: string;
  idField: string;
  transform?: TransformFn;
}

interface SingletonModule {
  file: string;
  singletonId: string;
}

const iso = (s?: unknown): Date | undefined => {
  if (typeof s !== 'string') return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const ARRAY_MODULES: ArrayModule[] = [
  { file: 'products.json', modelMethod: 'product', idField: 'id' },
  { file: 'productCategories.json', modelMethod: 'productCategory', idField: 'id' },
  {
    file: 'reviews.json',
    modelMethod: 'review',
    idField: 'id',
    transform: (r) => ({ ...r, date: iso(r.date) ?? new Date() }),
  },
  {
    file: 'inquiries.json',
    modelMethod: 'inquiry',
    idField: 'id',
    transform: (r) => ({
      ...r,
      date: iso(r.date) ?? new Date(),
      replyAt: iso(r.replyAt),
    }),
  },
  { file: 'media.json', modelMethod: 'media', idField: 'id', transform: (r) => ({ ...r, date: iso(r.date) ?? new Date() }) },
  {
    file: 'broadcasts.json',
    modelMethod: 'broadcast',
    idField: 'id',
    transform: (r) => ({
      ...r,
      scheduledAt: iso(r.scheduledAt) ?? new Date(),
      createdAt: iso(r.createdAt) ?? new Date(),
      updatedAt: iso(r.updatedAt) ?? new Date(),
    }),
  },
  { file: 'faq.json', modelMethod: 'faq', idField: 'id' },
  {
    file: 'admin-users.json',
    modelMethod: 'adminUser',
    idField: 'email',
    transform: (r) => ({
      ...r,
      createdAt: iso(r.createdAt) ?? new Date(),
      updatedAt: iso(r.updatedAt) ?? new Date(),
      lastLoginAt: iso(r.lastLoginAt),
      lockedUntil: iso(r.lockedUntil),
    }),
  },
  {
    file: 'audit-log.json',
    modelMethod: 'auditLog',
    idField: 'id',
    transform: (r) => ({ ...r, at: iso(r.at) ?? new Date() }),
  },
];

const SINGLETON_MODULES: SingletonModule[] = [
  { file: 'company.json', singletonId: 'company' },
  { file: 'announcement.json', singletonId: 'announcement' },
  { file: 'pages.json', singletonId: 'pages' },
];

async function main() {
  console.log('═══ Daracheon JSON → Postgres 마이그레이션 ═══');
  console.log(DRY_RUN ? '(DRY-RUN — 실제 삽입 안 함. --run 플래그로 실행)' : '(REAL RUN — 실제 삽입 수행)');

  if (!fs.existsSync(DB_DIR)) {
    console.error('❌ data/db 디렉토리가 없습니다.');
    process.exit(1);
  }

  console.log('\n📋 Prisma 스키마 (prisma/schema.prisma 로 저장):');
  console.log('─────────────────────────────────────────');
  console.log(PRISMA_SCHEMA);
  console.log('─────────────────────────────────────────\n');

  if (DRY_RUN) {
    console.log('📦 발견된 JSON 파일:');
    for (const mod of ARRAY_MODULES) {
      const filePath = path.join(DB_DIR, mod.file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ○ ${mod.file} (없음)`);
        continue;
      }
      const rows = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`  ✓ ${mod.file} → ${mod.modelMethod} (${Array.isArray(rows) ? rows.length : 0}건)`);
    }
    for (const mod of SINGLETON_MODULES) {
      const filePath = path.join(DB_DIR, mod.file);
      console.log(`  ${fs.existsSync(filePath) ? '✓' : '○'} ${mod.file} → singleton#${mod.singletonId}`);
    }
    console.log('\n다음 단계:');
    console.log('  1) npm install -D prisma tsx');
    console.log('  2) npm install @prisma/client');
    console.log('  3) 위 스키마를 prisma/schema.prisma 에 저장');
    console.log('  4) npx prisma migrate dev --name init');
    console.log('  5) 이 파일의 PRISMA_IMPORT_BLOCK 주석 해제');
    console.log('  6) npx tsx scripts/migrate-to-postgres.ts --run');
    return;
  }

  // ─── PRISMA_IMPORT_BLOCK (Prisma 설치 후 주석 해제) ─────────────
  /*
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    for (const mod of ARRAY_MODULES) {
      const filePath = path.join(DB_DIR, mod.file);
      if (!fs.existsSync(filePath)) continue;
      const rows = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>[];
      if (!Array.isArray(rows)) continue;

      let inserted = 0;
      for (const raw of rows) {
        const row = mod.transform ? mod.transform(raw) : raw;
        const idValue = row[mod.idField];
        if (!idValue) continue;
        const client = (prisma as any)[mod.modelMethod];
        await client.upsert({
          where: { [mod.idField]: idValue },
          create: row,
          update: row,
        });
        inserted++;
      }
      console.log(`  ✓ ${mod.file} → ${mod.modelMethod} (${inserted}건 upsert)`);
    }

    for (const mod of SINGLETON_MODULES) {
      const filePath = path.join(DB_DIR, mod.file);
      if (!fs.existsSync(filePath)) continue;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      await prisma.singleton.upsert({
        where: { id: mod.singletonId },
        create: { id: mod.singletonId, data },
        update: { data },
      });
      console.log(`  ✓ ${mod.file} → singleton#${mod.singletonId}`);
    }

    console.log('\n✅ 마이그레이션 완료.');
  } finally {
    await prisma.$disconnect();
  }
  */
  // ─── PRISMA_IMPORT_BLOCK 끝 ──────────────────────────────────────

  console.error('⚠️ --run 플래그 사용 시 PRISMA_IMPORT_BLOCK 영역의 주석을 먼저 해제하세요.');
  console.error('   (Prisma Client 설치 후에만 동작합니다.)');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
