import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_IMAGES: Record<string, string> = {
  videoHero: "https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06e/data/d40dc46f-82f5-4e47-8cb3-2b4e1d81a19c.mp4",
  imgBrand1: "https://picsum.photos/seed/agarwood1/800/1000",
  imgBrand2: "https://picsum.photos/seed/agarwood2/800/800",
  imgAgarwood: "https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png",
  imgProcess: "https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png",
  imgFarm: "https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png",
  aboutAgarwoodBenefit: "https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png",
  brandStoryHero: "https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg",
  processHero: "https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png",
  mediaHero: "https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png",
  heroImage1: "https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/6ac650af-e832-4e80-a058-999e73ba5a81.jpg",
  heroImage2: "https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg",
  aboutAgarwoodHero: "https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765420985/agarwood/18_ch1_gift_tradition.png",
  companyHero: "https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/6ac650af-e832-4e80-a058-999e73ba5a81.jpg",
};

export const useSiteImages = () => {
  const [images, setImages] = useState<Record<string, string>>(DEFAULT_IMAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'siteImages', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setImages({...DEFAULT_IMAGES, ...docSnap.data() as Record<string, string>});
      } else {
        setImages(DEFAULT_IMAGES);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateImage = async (key: string, url: string) => {
    const docRef = doc(db, 'siteImages', 'main');
    await setDoc(docRef, { [key]: url }, { merge: true });
  };

  return { images, loading, updateImage };
};
