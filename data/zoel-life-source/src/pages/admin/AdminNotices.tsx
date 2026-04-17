import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

export default function AdminNotices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    createdAt: "",
    views: 0,
  });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "notices"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSave = async () => {
    setFeedback(null);
    try {
      if (editingId === "new") {
        await addDoc(collection(db, "notices"), {
          ...formData,
          createdAt: new Date().toISOString(),
          views: 0
        });
      } else if (editingId) {
        await updateDoc(doc(db, "notices", editingId), {
          title: formData.title,
          content: formData.content
        });
      }
      setEditingId(null);
      setFeedback({ type: 'success', message: '저장되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
      fetchNotices();
    } catch (error) {
      console.error("Error saving notice:", error);
      setFeedback({ type: 'error', message: '저장 중 오류가 발생했습니다.' });
    }
  };

  const handleDelete = async (id: string) => {
    setFeedback(null);
    try {
      await deleteDoc(doc(db, "notices", id));
      setFeedback({ type: 'success', message: '삭제되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
      setDeleteConfirm(null);
      fetchNotices();
    } catch (error) {
      console.error("Error deleting notice:", error);
      setFeedback({ type: 'error', message: '삭제 중 오류가 발생했습니다.' });
    }
  };

  const startEdit = (item: any = null) => {
    if (item) {
      setFormData({
        title: item.title || "",
        content: item.content || "",
        createdAt: item.createdAt || "",
        views: item.views || 0,
      });
      setEditingId(item.id);
    } else {
      setFormData({
        title: "",
        content: "",
        createdAt: "",
        views: 0,
      });
      setEditingId("new");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-noto-serif text-luxury-gold">공지사항 관리</h2>
          {feedback && (
            <span className={`text-sm px-3 py-1 rounded-full ${
              feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {feedback.message}
            </span>
          )}
        </div>
        <button onClick={() => startEdit()} className="btn-gold flex items-center gap-2">
          <Plus size={18} /> 새 공지사항 추가
        </button>
      </div>

      {editingId && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-luxury-gold/20 mb-8">
          <h3 className="text-lg font-medium mb-4">{editingId === "new" ? "새 공지사항 추가" : "공지사항 수정"}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">제목</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">내용</label>
              <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full border rounded p-2 h-48" />
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
              <th className="p-4">제목</th>
              <th className="p-4">작성일</th>
              <th className="p-4">조회수</th>
              <th className="p-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {notices.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{item.title}</td>
                <td className="p-4 text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-gray-600">{item.views}</td>
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
            {notices.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">등록된 공지사항이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
