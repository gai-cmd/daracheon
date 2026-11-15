// 콘솔 화면 소스의 한글 문자열 검사 (SPEC-CONSOLE-002 REQ-CS2-027, AC-CS2-028).
// TypeScript 파서로 TSX 를 읽어 문자열·템플릿 문자열·JSX 글자 노드만 본다. 주석은 노드가 아니므로
// 자연스럽게 빠지고, 'https://' 처럼 문자열 안의 // 를 주석으로 잘못 보는 일도 없다.
import ts from 'typescript';

export interface HangulFinding {
  /** 1부터 세는 줄 번호. */
  line: number;
  /** 노드의 글자(앞뒤 공백 제거). */
  text: string;
}

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;

export function findHangulLiterals(source: string, fileName: string): HangulFinding[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: HangulFinding[] = [];
  const visit = (node: ts.Node) => {
    let text: string | null = null;
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      text = node.text;
    } else if (ts.isJsxText(node)) {
      text = node.text;
    }
    if (text !== null && HANGUL.test(text)) {
      out.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text: text.trim() });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}
