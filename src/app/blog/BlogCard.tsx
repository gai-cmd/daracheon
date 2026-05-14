import Link from 'next/link';
import type { BlogCategory, BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
  category?: BlogCategory;
}

export default function BlogCard({ post, category }: BlogCardProps) {
  const date = post.publishedAt ?? post.createdAt;
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-luxury-bronze/30 bg-luxury-ink/60 transition hover:border-luxury-gold/60"
    >
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt={post.title}
          className="aspect-[16/9] w-full object-cover transition group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div className="aspect-[16/9] w-full bg-gradient-to-br from-luxury-slate to-luxury-bronze/40" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-xs text-luxury-gold">
          {category && <span>{category.name}</span>}
          {category && <span className="opacity-40">·</span>}
          <time dateTime={date}>{new Date(date).toLocaleDateString('ko-KR')}</time>
          {post.readingTime && (
            <>
              <span className="opacity-40">·</span>
              <span>{post.readingTime}분 읽기</span>
            </>
          )}
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold text-luxury-cream transition group-hover:text-luxury-gold">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm text-luxury-cream/70">{post.excerpt}</p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {post.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full border border-luxury-bronze/40 px-2 py-0.5 text-[11px] text-luxury-cream/60"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
