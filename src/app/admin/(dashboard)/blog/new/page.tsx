import { readCategoriesSafe } from '@/lib/blog/store';
import BlogPostForm from '../BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function NewBlogPostPage() {
  const categories = await readCategoriesSafe();
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  return <BlogPostForm mode="create" categories={sorted} />;
}
