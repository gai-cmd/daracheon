import { defineConfig } from 'vitest/config';
import path from 'node:path';

// 단위 테스트 설정. 순수 로직(auth·totp·ssrf 등)을 node 환경에서 검증한다.
// @/lib 경로 별칭을 tsconfig 와 동일하게 매핑.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 앱 전체 빌드 산출물·스크립트·레거시 소스는 제외.
    exclude: ['node_modules', '.next', 'dist', 'data/zoel-life-source', 'scripts'],
  },
});
