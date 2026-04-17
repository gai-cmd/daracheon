import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import AboutAgarwood from "./pages/AboutAgarwood";
import BrandStory from "./pages/BrandStory";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Process from "./pages/Process";
import Company from "./pages/Company";
import Media from "./pages/Media";
import HomeShopping from "./pages/HomeShopping";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Reviews from "./pages/Reviews";
import Support from "./pages/Support";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHome from "./pages/admin/AdminHome";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminPages from "./pages/admin/AdminPages";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminMedia from "./pages/admin/AdminMedia";

export default function App() {
  return (
    <HelmetProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about-agarwood" element={<AboutAgarwood />} />
              <Route path="brand-story" element={<BrandStory />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="process" element={<Process />} />
              <Route path="company" element={<Company />} />
              <Route path="media" element={<Media />} />
              <Route path="home-shopping" element={<HomeShopping />} />
              {/* 
              <Route path="payment" element={<Payment />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              */}
              <Route path="reviews" element={<Reviews />} />
              <Route path="support" element={<Support />} />
            </Route>
            
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="home" element={<AdminHome />} />
              <Route path="notices" element={<AdminNotices />} />
              <Route path="faq" element={<AdminFAQ />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="media" element={<AdminMedia />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </HelmetProvider>
  );
}
