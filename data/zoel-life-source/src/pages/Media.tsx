import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import SEO from "../components/SEO";
import { renderImage } from "../utils/image";

const fallbackVideos: any[] = [];
const fallbackPhotos: any[] = [];

export default function Media() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const snap = await getDocs(query(collection(db, "media"), orderBy("order", "asc")));
        if (!snap.empty) {
          setPhotos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setPhotos(fallbackPhotos);
        }
      } catch (error) {
        console.error("Error fetching media:", error);
        setPhotos(fallbackPhotos);
      }
      setLoading(false);
    };

    fetchMedia();
  }, []);

  const videos = photos.filter(item => item.type === 'video');
  const actualPhotos = photos.filter(item => item.type === 'photo' || !item.type);

  return (
    <div className="bg-luxury-cream min-h-screen pb-24 font-noto-sans">
      <SEO 
        title="미디어 갤러리 - ZOEL LIFE의 순간들 | ZOEL LIFE"
        description="ZOEL LIFE 침향의 아름다움과 제조 과정, 그리고 브랜드의 다양한 활동을 사진과 영상으로 만나보세요. 베트남 현지의 생생한 침향 채취 현장을 확인하실 수 있습니다."
        keywords="ZOEL LIFE 미디어, 침향 사진, 침향 영상, ZOEL LIFE 갤러리, 침향 채취 영상, 베트남 침향 현장"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "name": "미디어 갤러리",
              "description": "ZOEL LIFE 침향의 아름다움과 제조 과정, 브랜드 활동을 담은 사진 및 영상 갤러리"
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://www.daracheon.com/" },
                { "@type": "ListItem", "position": 2, "name": "미디어", "item": "https://www.daracheon.com/media" }
              ]
            }
          ]
        }}
      />
      {/* Header */}
      <header className="pt-32 pb-16 px-4 bg-white border-b border-luxury-gold/20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-micro mb-4"
          >
            GALLERY
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-noto-serif font-light mb-6 text-luxury-black"
          >
            미디어
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-luxury-black/60 font-light"
          >
            영상과 사진으로 만나는 ZOEL LIFE 침향의 생생한 현장
          </motion.p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {/* Videos */}
        <section className="mb-24">
          <h2 className="text-3xl font-playfair font-light mb-8 text-luxury-black flex items-center">
            <span className="w-8 h-px bg-luxury-gold mr-4"></span>
            Videos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {videos.length > 0 ? videos.map((video, idx) => (
              <motion.article 
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="aspect-video bg-luxury-cream rounded-2xl overflow-hidden relative mb-4 border border-luxury-gold/20 shadow-sm">
                  {video.url ? (
                    <iframe 
                      src={video.url} 
                      className="w-full h-full" 
                      allow="autoplay; encrypted-media" 
                      allowFullScreen
                      title={video.title}
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 font-medium">
                      영상 준비 중
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-noto-serif font-medium group-hover:text-luxury-gold transition-colors text-luxury-black">{video.title}</h3>
              </motion.article>
            )) : (
              <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-500">
                <p className="text-xl mb-2">등록된 영상이 없습니다.</p>
                <p className="text-sm text-gray-400">관리자 페이지에서 영상을 등록해주세요.</p>
              </div>
            )}
          </div>
        </section>

        {/* Photos */}
        <section>
          <h2 className="text-3xl font-playfair font-light mb-8 text-luxury-black flex items-center">
            <span className="w-8 h-px bg-luxury-gold mr-4"></span>
            Photos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            {actualPhotos.length > 0 ? actualPhotos.map((photo, idx) => (
              <motion.article 
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="aspect-square bg-luxury-cream rounded-2xl overflow-hidden relative group border border-luxury-gold/20 shadow-sm"
              >
                {photo.url ? (
                  renderImage(photo.url, photo.title, "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700")
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 font-medium">
                    사진 준비 중
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <h3 className="text-luxury-cream font-noto-serif text-lg">{photo.title}</h3>
                </div>
              </motion.article>
            )) : (
              <div className="col-span-2 md:col-span-3 text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-500">
                <p className="text-xl mb-2">등록된 사진이 없습니다.</p>
                <p className="text-sm text-gray-400">관리자 페이지에서 사진을 등록해주세요.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
