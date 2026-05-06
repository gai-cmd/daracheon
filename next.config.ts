import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**/*': ['./data/db/**/*'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'assets.floot.app' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      // Vercel Blob 업로드 이미지 — 관리자 업로드 경로와 동일
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async redirects() {
    return [
      // /support 가 /company 로 통합됨. 외부 캐시·검색엔진 인덱스의 구 링크 보전.
      { source: '/support', destination: '/company#contact', permanent: true },
      { source: '/support/:path*', destination: '/company#contact', permanent: true },
      // www → apex 정규화. 네이버 지도 Web 서비스 URL 등록이 apex 만 허용해서
      // www 도메인에서는 인증 실패. 모든 트래픽을 apex 로 영구 이동.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.zoellife.com' }],
        destination: 'https://zoellife.com/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    // img-src: Next.config 의 remotePatterns 와 일치시켜야 이미지 깨지지 않음.
    // script-src: Next 런타임 hydration 용 'unsafe-inline' 필요 (Next 가 nonce
    //   기반 CSP 를 공식 지원하기 전까지는 제거 불가). GA/기타 외부 스크립트는
    //   실제 사용하는 도메인으로 좁히세요.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://openapi.map.naver.com https://oapi.map.naver.com https://*.pstatic.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://drive.google.com https://assets.floot.app https://res.cloudinary.com https://img.youtube.com https://i.ytimg.com https://*.public.blob.vercel-storage.com https://www.google-analytics.com https://*.map.naver.com https://*.map.naver.net https://*.pstatic.net",
      "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
      "connect-src 'self' https://www.google-analytics.com https://*.public.blob.vercel-storage.com https://*.map.naver.com https://*.map.naver.net https://*.pstatic.net https://*.navercorp.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://drive.google.com https://map.naver.com https://*.map.naver.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isProd ? ['upgrade-insecure-requests'] : []),
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Content-Security-Policy', value: csp },
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
