export interface CsvColumn<T> {
  key: string;
  label: string;
  format?: (v: unknown, row: T) => string;
}

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[]
): string {
  // UTF-8 BOM for Excel Korean compatibility
  const BOM = '\uFEFF';

  const header = columns.map((c) => escapeCell(c.label)).join(',');

  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const raw = row[col.key];
          let str: string;
          if (col.format) {
            str = col.format(raw, row);
          } else if (raw === null || raw === undefined) {
            str = '';
          } else if (typeof raw === 'boolean') {
            str = raw ? 'Y' : 'N';
          } else {
            str = String(raw);
          }
          return escapeCell(str);
        })
        .join(',')
    )
    .join('\r\n');

  return BOM + header + '\r\n' + body;
}
