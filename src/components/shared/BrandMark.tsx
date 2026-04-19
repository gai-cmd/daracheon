import Link from 'next/link';

type Props = {
  href?: string;
  size?: 'sm' | 'md';
  showSub?: boolean;
};

export default function BrandMark({ href = '/', size = 'md', showSub = true }: Props) {
  const word = size === 'sm' ? 'text-sm' : 'text-[0.88rem]';
  const sub = size === 'sm' ? 'text-[0.6rem]' : 'text-[0.62rem]';

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3.5 no-underline leading-none group"
    >
      <span
        aria-hidden
        className="w-2.5 h-2.5 rounded-full shrink-0
                   shadow-[0_0_14px_rgba(212,168,67,0.45),0_0_2px_rgba(212,168,67,0.7)]
                   transition-all duration-600 ease-out-soft
                   group-hover:scale-[1.15]
                   group-hover:shadow-[0_0_22px_rgba(212,168,67,0.7),0_0_4px_rgba(245,220,138,0.9)]"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #f5dc8a 0%, #d4a843 55%, #7a5d1d 100%)',
        }}
      />
      <span className="inline-flex flex-col gap-[3px] whitespace-nowrap">
        <span
          className={`font-sans ${word} font-medium tracking-[0.32em] uppercase text-lx-ivory whitespace-nowrap`}
        >
          ZOEL LIFE
        </span>
        {showSub && (
          <span
            className={`font-serif ${sub} font-light tracking-[0.22em] text-gold-500 whitespace-nowrap`}
          >
            대라천 · 침향
          </span>
        )}
      </span>
    </Link>
  );
}
