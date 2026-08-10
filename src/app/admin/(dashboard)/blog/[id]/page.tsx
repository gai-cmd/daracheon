import { notFound } from 'next/navigation';
import { readPostsSafe, readCategoriesSafe } from '@/lib/blog/store';
import BlogPostForm from '../BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [posts, categories] = await Promise.all([
    readPostsSafe(),
    readCategoriesSafe(),
  ]);
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  return <BlogPostForm mode="edit" initial={post} categories={sorted} />;
}
