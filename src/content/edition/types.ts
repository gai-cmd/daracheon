export interface EditionCover {
  kicker: string;
  title: string;
  titleHighlight?: string;
  subtitle: string;
  edition: string;
  backgroundImage?: string;
  backgroundVideo?: string;
}

export interface EditionForeword {
  greeting: string;
  body: string[];
  signature: string;
  signatureRole: string;
}

export interface EditionChapter {
  num: string;
  tag: string;
  title: string;
  subtitle?: string;
  body?: string[];
  highlights?: { label: string; value: string }[];
  images?: { src: string; alt: string; caption?: string }[];
  video?: { src: string; poster?: string; title?: string };
  pull?: { quote: string; source?: string };
}

export interface EditionGalleryItem {
  src: string;
  alt: string;
  label?: string;
  sub?: string;
}

export interface EditionGallery {
  num: string;
  tag: string;
  title: string;
  subtitle?: string;
  items: EditionGalleryItem[];
}

export interface EditionProduct {
  category: string;
  name: string;
  nameEn?: string;
  description: string;
  image?: string;
}

export interface EditionLineup {
  num: string;
  tag: string;
  title: string;
  subtitle?: string;
  items: EditionProduct[];
}

export interface EditionClosing {
  kicker: string;
  title: string;
  body: string;
  cta: { label: string; href: string }[];
  contact: { name: string; role: string; email: string; phone?: string }[];
}

export interface EditionContent {
  cover: EditionCover;
  foreword: EditionForeword;
  chapters: EditionChapter[];
  gallery?: EditionGallery;
  lineup?: EditionLineup;
  closing: EditionClosing;
}
