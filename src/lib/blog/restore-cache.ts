/**
 * 스냅샷 복원 결과에 블로그 테이블이 들어 있는지.
 *
 * 복원은 어드민 글·카테고리 저장 라우트를 거치지 않고 blog_posts·blog_categories 를
 * 통째로 바꾼다. 공개 블로그 읽기는 BLOG_LATEST_TAG 캐시(5분)를 거치므로, 복원 라우트가
 * 이 값이 true 일 때 태그를 비워야 내린 글이 바로 내려가고 되살린 글이 바로 보인다.
 */
export function restoreTouchedBlog(restored: readonly string[]): boolean {
  return restored.includes('blogPosts') || restored.includes('blogCategories');
}
