import { readDataSafe } from '@/lib/db';
import { BLOG_CATEGORIES_FILE, type BlogCategory } from '@/types/blog';
import BlogPostForm from '../BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function NewBlogPostPage() {
  const categories = await readDataSafe<BlogCategory>(BLOG_CATEGORIES_FILE);
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  return <BlogPostForm mode="create" categories={sorted} />;
}
