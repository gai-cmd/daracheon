import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { Save, Upload } from "lucide-react";
import { uploadFileToStorage } from "../../utils/storage";

const imageFields = [
  { field: 'videoHero', label: '히어로 배경 동영상/이미지', type: 'image' },
  { field: 'imgBrand1', label: '브랜드 스토리 이미지 1', type: 'image' },
  { field: 'imgBrand2', label: '브랜드 스토리 이미지 2', type: 'image' },
  { field: 'imgAgarwood', label: '침향이란 이미지', type: 'image' },
  { field: 'imgProcess', label: '생산 공정 이미지', type: 'image' },
  { field: 'imgFarm', label: '농장 이미지', type: 'image' },
];

export default function AdminHome() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const docRef = doc(db, "siteImages", "main");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setImages(docSnap.data() as Record<string, string>);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (field: string, url: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const docRef = doc(db, "siteImages", "main");
      await setDoc(docRef, { [field]: url }, { merge: true });
      setFeedback({ type: 'success', message: '저장되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error saving image:", error);
      setFeedback({ type: 'error', message: '저장 중 오류가 발생했습니다.' });
    }
    setSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [field]: true }));
    setFeedback(null);
    try {
      const url = await uploadFileToStorage(file, "home");
      await handleSave(field, url);
      setFeedback({ type: 'success', message: '업로드되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      setFeedback({ type: 'error', message: '업로드에 실패했습니다.' });
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const renderUploadField = (field: string, label: string, type: 'image' | 'video') => {
    const isUploading = uploading[field];
    const value = images[field] || "";

    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <h4 className="text-lg font-medium mb-4 text-luxury-gold">{label}</h4>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {value ? (
            type === 'video' ? (
              <video src={value} className="w-48 h-32 object-cover rounded border" controls />
            ) : (
              <img src={value} alt={label} className="w-48 h-32 object-cover rounded border" />
            )
          ) : (
            <div className="w-48 h-32 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-sm shrink-0">
              {type === 'video' ? '영상 없음' : '이미지 없음'}
            </div>
          )}
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL 직접 입력</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setImages(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder="https://..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-black"
              />
              <button 
                onClick={() => handleSave(field, images[field] || "")}
                disabled={saving}
                className="mt-2 px-4 py-2 bg-luxury-gold text-white rounded text-sm hover:bg-luxury-gold/80"
              >
                저장
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">또는</span>
              <input 
                type="file" 
                accept={type === 'video' ? "video/*" : "image/*"} 
                ref={el => fileInputRefs.current[field] = el}
                onChange={(e) => handleUpload(e, field, type)}
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => fileInputRefs.current[field]?.click()}
                disabled={isUploading}
                className="px-4 py-2 border rounded text-sm flex items-center gap-2 hover:bg-gray-100 bg-white disabled:opacity-50"
              >
                <Upload size={16} />
                {isUploading ? "업로드 중..." : "파일 업로드"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-noto-serif text-luxury-gold">홈 화면 이미지 관리</h2>
          {feedback && (
            <span className={`text-sm px-3 py-1 rounded-full ${
              feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {feedback.message}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">불러오는 중...</div>
        ) : (
          <div className="space-y-8">
            {imageFields.map(f => renderUploadField(f.field, f.label, f.type as 'image' | 'video'))}
          </div>
        )}
      </div>
    </div>
  );
}
