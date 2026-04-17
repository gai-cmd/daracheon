import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";
import { FileText, HelpCircle, FileEdit, ShoppingBag, Image as ImageIcon, Database } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    notices: 0,
    faqs: 0,
    products: 0,
    media: 0,
  });

  const fetchStats = async () => {
    try {
      const noticesSnap = await getDocs(collection(db, "notices"));
      const faqsSnap = await getDocs(collection(db, "faqs"));
      const productsSnap = await getDocs(collection(db, "products"));
      const mediaSnap = await getDocs(collection(db, "media"));

      setStats({
        notices: noticesSnap.size,
        faqs: faqsSnap.size,
        products: productsSnap.size,
        media: mediaSnap.size,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    { title: "공지사항", count: stats.notices, icon: <FileText size={24} />, link: "/admin/notices", color: "bg-blue-50 text-blue-600" },
    { title: "FAQ", count: stats.faqs, icon: <HelpCircle size={24} />, link: "/admin/faq", color: "bg-green-50 text-green-600" },
    { title: "제품", count: stats.products, icon: <ShoppingBag size={24} />, link: "/admin/products", color: "bg-purple-50 text-purple-600" },
    { title: "미디어", count: stats.media, icon: <ImageIcon size={24} />, link: "/admin/media", color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-noto-serif text-luxury-gold">대시보드</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link key={card.title} to={card.link} className="block">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  {card.icon}
                </div>
                <span className="text-2xl font-bold text-gray-800">{card.count}</span>
              </div>
              <h3 className="text-gray-600 font-medium">{card.title} 관리</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-noto-serif text-luxury-gold mb-4">환영합니다!</h2>
        <p className="text-gray-600 mb-6">
          왼쪽 메뉴를 통해 웹사이트의 콘텐츠를 관리할 수 있습니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/admin/home" className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
              <ImageIcon size={24} />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">홈 화면 편집</h4>
              <p className="text-sm text-gray-500">홈 화면의 배경 동영상과 이미지들을 수정합니다.</p>
            </div>
          </Link>
          <Link to="/admin/pages" className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
              <FileEdit size={24} />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">페이지 편집</h4>
              <p className="text-sm text-gray-500">회사소개, 생산공정 등 정적 페이지 내용을 수정합니다.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
