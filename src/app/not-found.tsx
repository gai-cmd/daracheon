import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-[#0a0b10] text-white px-6">
      <div className="text-center">
        <div className="font-display text-[8rem] font-light text-gold-500/30 leading-none mb-4">
          404
        </div>
        <h1 className="font-serif text-2xl mb-4">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-white/50 mb-8 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link href="/" className="btn btn-gold">
          메인으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
