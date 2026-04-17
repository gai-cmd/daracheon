import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "침향 이야기", path: "/about-agarwood" },
    { name: "브랜드 이야기", path: "/brand-story" },
    { name: "침향 농장 이야기", path: "/media" },
    { name: "제품 소개", path: "/products" },
    { name: "홈쇼핑 특별관", path: "/home-shopping" },
    { name: "회사소개", path: "/company" },
    { name: "문의하기", path: "/support" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isHome = location.pathname === "/";
  const isLightTheme = scrolled || !isHome;

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-500 ${isLightTheme ? "bg-luxury-cream/90 backdrop-blur-md border-b border-luxury-gold/20 py-3 shadow-sm" : "bg-transparent py-6"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className={`font-playfair text-2xl tracking-[0.15em] transition-colors duration-500 ${isLightTheme ? "text-luxury-black" : "text-luxury-cream"}`}>
              ZOEL LIFE
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-xs tracking-widest uppercase transition-colors duration-300 font-noto-sans ${
                  isActive(link.path) 
                    ? "text-luxury-gold font-semibold" 
                    : isLightTheme 
                      ? "text-luxury-black/90 hover:text-luxury-black" 
                      : "text-luxury-cream hover:text-luxury-cream"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {/* 
            <Link
              to="/payment"
              className={`px-6 py-2.5 rounded-full text-xs tracking-widest uppercase transition-all duration-500 font-noto-sans ${
                isLightTheme 
                  ? "bg-luxury-black text-luxury-cream hover:bg-luxury-gold" 
                  : "bg-luxury-cream text-luxury-black hover:bg-luxury-gold hover:text-luxury-cream"
              }`}
            >
              구매하기
            </Link>
            */}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`focus:outline-none transition-colors duration-500 ${isLightTheme ? "text-luxury-black" : "text-luxury-cream"}`}
            >
              {isOpen ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-luxury-cream border-b border-luxury-gold/20 absolute w-full shadow-lg">
          <div className="px-6 pt-4 pb-8 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block text-sm tracking-widest uppercase font-noto-sans ${
                  isActive(link.path)
                    ? "text-luxury-gold font-semibold"
                    : "text-luxury-black/90 hover:text-luxury-black"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {/* 
            <div className="pt-4">
              <Link
                to="/products"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-luxury-black text-luxury-cream py-3 text-sm tracking-widest uppercase rounded-md font-noto-sans hover:bg-luxury-gold transition-colors"
              >
                구매하기
              </Link>
            </div>
            */}
          </div>
        </div>
      )}
    </nav>
  );
}
