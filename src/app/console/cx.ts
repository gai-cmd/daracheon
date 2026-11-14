/** Joins CSS-module class names, skipping empty slots. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
