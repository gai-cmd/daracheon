import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Save, X, Upload } from "lucide-react";
import { uploadFileToStorage } from "../../utils/storage";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    image: "",
    isMain: false,
    order: 0,
    description: "",
  });

  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data.sort((a: any, b: any) => a.order - b.order));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFeedback(null);
    try {
      const url = await uploadFileToStorage(file, "products");
      setFormData({ ...formData, image: url });
      setFeedback({ type: 'success', message: '이미지가 업로드되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error uploading image:", error);
      setFeedback({ type: 'error', message: '이미지 업로드에 실패했습니다.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setFeedback(null);
    try {
      if (editingId === "new") {
        await addDoc(collection(db, "products"), formData);
      } else if (editingId) {
        await updateDoc(doc(db, "products", editingId), formData);
      }
      setEditingId(null);
      setFeedback({ type: 'success', message: '저장되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setFeedback({ type: 'error', message: '저장 중 오류가 발생했습니다.' });
    }
  };

  const handleDelete = async (id: string) => {
    setFeedback(null);
    try {
      await deleteDoc(doc(db, "products", id));
      setFeedback({ type: 'success', message: '삭제되었습니다.' });
      setTimeout(() => setFeedback(null), 3000);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setFeedback({ type: 'error', message: '삭제 중 오류가 발생했습니다.' });
    }
  };

  const startEdit = (product: any = null) => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price || "",
        image: product.image || "",
        isMain: product.isMain || false,
        order: product.order || 0,
        description: product.description || "",
      });
      setEditingId(product.id);
    } else {
      setFormData({
        name: "",
        category: "",
        price: "",
        image: "",
        isMain: false,
        order: products.length,
        description: "",
      });
      setEditingId("new");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-noto-serif text-luxury-gold">제품 관리</h2>
          {feedback && (
            <span className={`text-sm px-3 py-1 rounded-full ${
              feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {feedback.message}
            </span>
          )}
        </div>
        <button onClick={() => startEdit()} className="btn-gold flex items-center gap-2">
          <Plus size={18} /> 새 제품 추가
        </button>
      </div>

      {editingId && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-luxury-gold/20 mb-8">
          <h3 className="text-lg font-medium mb-4">{editingId === "new" ? "새 제품 추가" : "제품 수정"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">제품명</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">카테고리</label>
              <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">가격</label>
              <input type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">이미지</label>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-48 h-32 object-cover rounded border" />
                ) : (
                  <div className="w-48 h-32 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-sm shrink-0">이미지 없음</div>
                )}
                <div className="flex-1 w-full space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL 직접 입력</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      placeholder="https://..."
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">또는</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 border rounded text-sm flex items-center gap-2 hover:bg-gray-100 bg-white disabled:opacity-50"
                    >
                      <Upload size={16} />
                      {uploading ? "업로드 중..." : "파일 업로드"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">정렬 순서</label>
              <input type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isMain} onChange={e => setFormData({...formData, isMain: e.target.checked})} className="w-5 h-5" />
                <span className="text-sm text-gray-600">메인 페이지 노출</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">상세 설명</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded p-2 h-24" />
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
              <th className="p-4">이미지</th>
              <th className="p-4">제품명</th>
              <th className="p-4">카테고리</th>
              <th className="p-4">가격</th>
              <th className="p-4">메인 노출</th>
              <th className="p-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" referrerPolicy="no-referrer" />
                </td>
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 text-gray-600">{product.category}</td>
                <td className="p-4 text-gray-600">{product.price}</td>
                <td className="p-4">
                  {product.isMain ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">노출</span> : <span className="text-gray-400">-</span>}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(product)} className="text-blue-600 hover:bg-blue-50 p-2 rounded mr-2">
                    <Edit size={18} />
                  </button>
                  {deleteConfirm === product.id ? (
                    <div className="inline-flex items-center gap-2 bg-red-50 px-2 py-1 rounded border border-red-100">
                      <span className="text-xs text-red-600 font-medium">삭제?</span>
                      <button onClick={() => handleDelete(product.id)} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700">확인</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-300">취소</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(product.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">등록된 제품이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
