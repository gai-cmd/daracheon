export interface Review {
  id: string;
  author: string;
  age: string;
  product: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
}

export const reviews: Review[] = [
  {
    id: 'r1',
    author: '김*진',
    age: '',
    product: '침향 오일 캡슐',
    rating: 5,
    title: '하루가 활기찹니다',
    content:
      '아침마다 피곤했는데 침향 캡슐을 먹고 나서부터 하루가 활기찹니다. 귀한 성분이라 믿고 먹고 있어요.',
    date: '2025-10-15',
    verified: true,
  },
  {
    id: 'r2',
    author: '이*훈',
    age: '',
    product: '침향단 (환)',
    rating: 5,
    title: '부모님이 너무 좋아하십니다',
    content:
      '부모님 선물로 드렸는데 너무 좋아하십니다. 향이 깊고 진해서 진짜 침향이라는 걸 알 수 있었습니다.',
    date: '2025-09-28',
    verified: true,
  },
  {
    id: 'r3',
    author: '박*영',
    age: '',
    product: '침향 선향',
    rating: 5,
    title: '자연 그대로의 향',
    content:
      '명상할 때 피우는데 향이 마음을 차분하게 해줍니다. 인공적인 향이 아니라 자연 그대로의 향이라 너무 좋습니다.',
    date: '2025-09-10',
    verified: true,
  },
  {
    id: 'r4',
    author: '최*민',
    age: '',
    product: '침향수',
    rating: 4,
    title: '몸이 따뜻해지는 느낌',
    content:
      '매일 아침 공복에 마시고 있습니다. 몸이 따뜻해지는 느낌이 들고 소화도 잘 되는 것 같아요.',
    date: '2025-08-22',
    verified: true,
  },
  {
    id: 'r5',
    author: '정*수',
    age: '',
    product: '침향 오일 캡슐',
    rating: 5,
    title: '품질은 역시 최고',
    content:
      '베트남 여행 갔을 때 알게 된 브랜드인데 한국에서도 살 수 있어서 너무 좋네요. 품질은 역시 최고입니다.',
    date: '2025-08-05',
    verified: true,
  },
  {
    id: 'r6',
    author: '강*희',
    age: '',
    product: '침향차',
    rating: 5,
    title: '손님 대접하기 좋습니다',
    content:
      '손님 오셨을 때 대접하기 좋습니다. 다들 향이 너무 좋다고 어디서 샀냐고 물어보시네요.',
    date: '2025-07-18',
    verified: true,
  },
];
