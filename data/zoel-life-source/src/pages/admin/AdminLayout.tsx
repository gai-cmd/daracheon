import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { LayoutDashboard, Home, FileText, HelpCircle, FileEdit, ShoppingBag, Image as ImageIcon, LogOut } from "lucide-react";

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isSimpleAdmin = sessionStorage.getItem("isAdmin") === "true";
    
    if (isSimpleAdmin) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/admin/login");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    sessionStorage.removeItem("isAdmin");
    await signOut(auth);
    navigate("/admin/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  const navItems = [
    { path: "/admin", label: "대시보드", icon: <LayoutDashboard size={20} /> },
    { path: "/admin/home", label: "홈 화면 편집", icon: <Home size={20} /> },
    { path: "/admin/notices", label: "공지사항", icon: <FileText size={20} /> },
    { path: "/admin/faq", label: "FAQ", icon: <HelpCircle size={20} /> },
    { path: "/admin/pages", label: "페이지 편집", icon: <FileEdit size={20} /> },
    { path: "/admin/products", label: "제품 관리", icon: <ShoppingBag size={20} /> },
    { path: "/admin/media", label: "미디어 관리", icon: <ImageIcon size={20} /> },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100 font-noto-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-luxury-black text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-noto-serif text-luxury-gold">ZOEL LIFE 관리자</h1>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    location.pathname === item.path
                      ? "bg-luxury-gold/20 text-luxury-gold border-r-4 border-luxury-gold"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-medium text-luxury-black">
            {navItems.find((item) => item.path === location.pathname)?.label || "관리자"}
          </h2>
          <div className="text-sm text-luxury-black/70">
            {auth.currentUser?.email || "관리자 (비밀번호 로그인)"}
          </div>
        </header>
        <div className="p-8 text-luxury-black">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
