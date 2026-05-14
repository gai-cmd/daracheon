import { notFound } from 'next/navigation';
import { readDataSafe } from '@/lib/db';
import {
  BLOG_CATEGORIES_FILE,
  BLOG_POSTS_FILE,
  type BlogCategory,
  type BlogPost,
} from '@/types/blog';
import BlogPostForm from '../BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [posts, categories] = await Promise.all([
    readDataSafe<BlogPost>(BLOG_POSTS_FILE),
    readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE),
  ]);
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  return <BlogPostForm mode="edit" initial={post} categories={sorted} />;
}
