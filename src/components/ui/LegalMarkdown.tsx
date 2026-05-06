import styles from './LegalMarkdown.module.css';

interface Props {
  content: string;
}

type Block =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'hr' }
  | { kind: 'p'; text: string }
  | { kind: 'ol'; items: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === '') {
      i++;
      continue;
    }

    if (/^---+$/.test(line)) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    const h1 = /^#\s+(.*)$/.exec(line);
    if (h1) {
      blocks.push({ kind: 'h1', text: h1[1] });
      i++;
      continue;
    }
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2) {
      blocks.push({ kind: 'h2', text: h2[1] });
      i++;
      continue;
    }
    const h3 = /^###\s+(.*)$/.exec(line);
    if (h3) {
      blocks.push({ kind: 'h3', text: h3[1] });
      i++;
      continue;
    }

    // Table: pipe-delimited, second row is `|---|---|`
    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s|:-]+\|$/.test(lines[i + 1].trim())) {
      const head = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i].trim()));
        i++;
      }
      blocks.push({ kind: 'table', head, rows });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // Paragraph: gather until blank line / boundary
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const nextRaw = lines[i];
      const next = nextRaw.trim();
      if (
        next === '' ||
        /^---+$/.test(next) ||
        /^#{1,3}\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        /^[-*]\s+/.test(next) ||
        next.startsWith('|')
      ) {
        break;
      }
      paraLines.push(next);
      i++;
    }
    blocks.push({ kind: 'p', text: paraLines.join(' ') });
  }

  return blocks;
}

function splitRow(line: string): string[] {
  // strip leading/trailing pipes then split
  const trimmed = line.replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

// Inline: **bold**, [text](url)
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = 0;
  // **bold** 와 [text](url) 두 패턴을 한 번의 패스로 처리.
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={`${keyBase}-b-${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined && match[3] !== undefined) {
      parts.push(
        <a
          key={`${keyBase}-l-${key++}`}
          href={match[3]}
          target={match[3].startsWith('http') ? '_blank' : undefined}
          rel={match[3].startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {match[2]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function LegalMarkdown({ content }: Props) {
  const blocks = parseBlocks(content);
  return (
    <div className={styles.legal}>
      {blocks.map((b, i) => {
        const k = `b-${i}`;
        switch (b.kind) {
          case 'h1':
            return <h1 key={k}>{renderInline(b.text, k)}</h1>;
          case 'h2':
            return <h2 key={k}>{renderInline(b.text, k)}</h2>;
          case 'h3':
            return <h3 key={k}>{renderInline(b.text, k)}</h3>;
          case 'hr':
            return <hr key={k} />;
          case 'p':
            return <p key={k}>{renderInline(b.text, k)}</p>;
          case 'ol':
            return (
              <ol key={k}>
                {b.items.map((it, j) => (
                  <li key={`${k}-${j}`}>{renderInline(it, `${k}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'ul':
            return (
              <ul key={k}>
                {b.items.map((it, j) => (
                  <li key={`${k}-${j}`}>{renderInline(it, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={k} className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j}>{renderInline(h, `${k}-th-${j}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((c, ci) => (
                          <td key={ci}>{renderInline(c, `${k}-td-${ri}-${ci}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
