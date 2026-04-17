/**
 * 간단한 CSV 파서 — 외부 의존성 없이 BOM/따옴표 이스케이프 처리.
 */

export function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch !== '\r') {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export function buildHeaderMap(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, idx) => {
    const key = h.trim().toLowerCase();
    if (key) map[key] = idx;
  });
  return map;
}

export function cellGetter(row: string[], headerMap: Record<string, number>) {
  return (key: string): string => {
    const idx = headerMap[key.toLowerCase()];
    if (idx === undefined) return '';
    return (row[idx] ?? '').trim();
  };
}
