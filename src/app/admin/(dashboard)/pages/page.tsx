import Link from 'next/link';

export default function AdminPagesPage() {
  const pageLinks = [
    {
      href: '/admin/pages/home',
      title: '홈 (메인)',
      desc: '/ 메인 페이지 콘텐츠 편집',
      icon: '◉',
    },
    {
      href: '/admin/pages/about-agarwood',
      title: '침향 이야기',
      desc: '/about-agarwood 공개 페이지 콘텐츠 편집',
      icon: '◎',
    },
    {
      href: '/admin/pages/brand-story',
      title: '브랜드 이야기',
      desc: '/brand-story 공개 페이지 콘텐츠 편집',
      icon: '◈',
    },
    {
      href: '/admin/pages/company',
      title: '회사소개',
      desc: '/company 회사 개요 · 4 챕터 편집',
      icon: '◇',
    },
    {
      href: '/admin/pages/process',
      title: '생산 공정 · 농장',
      desc: '/process 농장 챕터 · 영상 · 인증서 편집',
      icon: '◆',
    },
    {
      href: '/admin/pages/support',
      title: '문의하기',
      desc: '/support 연락 채널 · 회사정보 · 샘플 Lot 편집',
      icon: '○',
    },
    {
      href: '/admin/pages/products',
      title: '제품 소개',
      desc: '/products 히어로 키커 · 제목 · 배경 이미지 편집',
      icon: '◑',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">페이지 관리</h1>
        <p className="text-gray-500 mb-8">공개 페이지의 콘텐츠를 편집합니다.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pageLinks.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group flex items-start gap-5 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-gold-500/50 hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl text-gold-500 group-hover:scale-110 transition-transform duration-200">
                {page.icon}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gold-600 transition-colors">
                  {page.title}
                </h2>
                <p className="text-sm text-gray-500">{page.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
