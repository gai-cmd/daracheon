import React from 'react';

export const renderImage = (
  src: string | undefined | null, 
  alt: string, 
  className: string, 
  placeholderType: 'tree' | 'farm' | 'region' | 'default' = 'default'
) => {
  // Explicitly check for http/https and render img tag
  if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
    return <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" />;
  }

  // Fallback for missing or invalid src
  return (
    <div className={`${className} bg-[#1A1D29] flex items-center justify-center text-[#D4A843] font-medium`}>
      이미지 준비 중
    </div>
  );
};
