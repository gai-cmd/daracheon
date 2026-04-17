import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Save, X, Upload } from "lucide-react";
import { uploadFileToStorage } from "../../utils/storage";

export default function AdminMedia() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    order: 0,
    type: "photo",
  });

  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "media"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedia(data.sort((a: any, b: any) => a.order - b.order));
    } catch (error) {
      console.error("Error fetching media:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFeedback(null);
    try {
      const url = await uploadFileToStorage(file, "media");
      setFormData({ ...formData, url });
      setFeedback({ type: 'success', message: '업로드되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error uploading file:", error);
      setFeedback({ type: 'error', message: '파일 업로드에 실패했습니다.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setFeedback(null);
    try {
      if (editingId === "new") {
        await addDoc(collection(db, "media"), formData);
      } else if (editingId) {
        await updateDoc(doc(db, "media", editingId), formData);
      }
      setEditingId(null);
      setFeedback({ type: 'success', message: '저장되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
      fetchMedia();
    } catch (error) {
      console.error("Error saving media:", error);
      setFeedback({ type: 'error', message: '저장 중 오류가 발생했습니다.' });
    }
  };

  const handleDelete = async (id: string) => {
    setFeedback(null);
    try {
      await deleteDoc(doc(db, "media", id));
      setFeedback({ type: 'success', message: '삭제되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
      setDeleteConfirm(null);
      fetchMedia();
    } catch (error) {
      console.error("Error deleting media:", error);
      setFeedback({ type: 'error', message: '삭제 중 오류가 발생했습니다.' });
    }
  };

  const startEdit = (item: any = null) => {
    if (item) {
      setFormData({
        title: item.title || "",
        url: item.url || "",
        order: item.order || 0,
        type: item.type || "photo",
      });
      setEditingId(item.id);
    } else {
      setFormData({
        title: "",
        url: "",
        order: media.length,
        type: "photo",
      });
      setEditingId("new");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-noto-serif text-luxury-gold">미디어 관리</h2>
          {feedback && (
            <span className={`text-sm px-3 py-1 rounded-full ${
              feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {feedback.message}
            </span>
          )}
        </div>
        <button onClick={() => startEdit()} className="btn-gold flex items-center gap-2">
          <Plus size={18} /> 새 미디어 추가
        </button>
      </div>

      {editingId && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-luxury-gold/20 mb-8">
          <h3 className="text-lg font-medium mb-4">{editingId === "new" ? "새 미디어 추가" : "미디어 수정"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">제목</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">URL (이미지 또는 동영상)</label>
              <div className="flex gap-2 items-center">
                <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full border rounded p-2" placeholder="직접 입력 또는 업로드" />
                <input 
                  type="file" 
                  accept={formData.type === "photo" ? "image/*" : "video/*"} 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-2 border rounded text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                >
                  <Upload size={16} />
                  {uploading ? "업로드 중..." : "파일 업로드"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">타입</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded p-2">
                <option value="photo">사진 (Photo)</option>
                <option value="video">동영상 (Video)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">정렬 순서</label>
              <input type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} className="w-full border rounded p-2" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 flex items-center gap-2">
              <X size={18} /> 취소
            </button>
            <button onClick={handleSave} className="btn-gold flex items-center gap-2">
              <Save size={18} /> 저장
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4">미리보기</th>
              <th className="p-4">제목</th>
              <th className="p-4">타입</th>
              <th className="p-4">순서</th>
              <th className="p-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {media.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4">
                  {item.type === 'video' ? (
                    <div className="w-24 h-16 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500">Video</div>
                  ) : (
                    <img src={item.url} alt={item.title} className="w-24 h-16 object-cover rounded" referrerPolicy="no-referrer" />
                  )}
                </td>
                <td className="p-4 font-medium">{item.title}</td>
                <td className="p-4 text-gray-600">{item.type === 'video' ? '동영상' : '사진'}</td>
                <td className="p-4 text-gray-600">{item.order}</td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded mr-2">
                    <Edit size={18} />
                  </button>
                  {deleteConfirm === item.id ? (
                    <div className="inline-flex items-center gap-2 bg-red-50 px-2 py-1 rounded border border-red-100">
                      <span className="text-xs text-red-600 font-medium">삭제?</span>
                      <button onClick={() => handleDelete(item.id)} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700">확인</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-300">취소</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(item.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {media.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">등록된 미디어가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
