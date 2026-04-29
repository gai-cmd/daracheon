interface MapProps {
  title?: string;
  address?: string;
}

export default function NaverMap({
  address = '서울특별시 금천구 벚꽃로36길 30',
}: MapProps) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=ko&z=17`;

  return (
    <iframe
      title="오시는 길"
      src={src}
      width="100%"
      style={{ aspectRatio: '4/3', border: 0, display: 'block' }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
