interface Props {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // 어드민이 입력한 문자열(제품명 등)에 '</script>' 가 섞여도 스크립트 밖으로 빠져나가지 않게 '<' 를 이스케이프한다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
