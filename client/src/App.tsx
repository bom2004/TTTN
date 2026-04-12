import React, { useEffect, Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

// Core UI Components (Import trực tiếp để tránh giật lag khi chuyển trang admin/staff)
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SidebarAdmin from './admin/components/SidebarAdmin';
import SidebarStaff from './Staff/components/SidebarStaff';
import LoadingScreen from "./utils/LoadingScreen";
import Chatbot from "./chatbot/chatbot";

// Lazy Loaded Pages (Pages) cho Client (Chỉ tải khi người dùng truy cập)
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./login/login"));
const Register = lazy(() => import("./login/Register"));
const ForgotPassword = lazy(() => import("./login/forgot"));
const Viewprofile = lazy(() => import("./login/Viewprofile"));
const MyBookings = lazy(() => import("./login/MyBookings"));

// Lazy Loaded Pages (Pages) cho Admin
const HomeAdmin = lazy(() => import("./admin/dashboard/homeadmin"));
const RoomAdmin = lazy(() => import("./admin/dashboard/RoomAdmin"));
const RoomTypeAdmin = lazy(() => import("./admin/dashboard/RoomTypeAdmin"));
const UserAdmin = lazy(() => import("./admin/dashboard/user"));
const PromotionAdmin = lazy(() => import("./admin/dashboard/PromotionAdmin"));
const StaffAdmin = lazy(() => import("./admin/dashboard/StaffAdmin"));
const CommentAdmin = lazy(() => import("./admin/dashboard/commentadmin"));
const ChatbotAdmin = lazy(() => import("./admin/dashboard/chatbotAdmin"));
const PersonalDetailsAdmin = lazy(() => import("./admin/dashboard/PersonalDetailsAdmin"));
const ServiceAdmin = lazy(() => import("./admin/dashboard/servicebooking/ServiceAdmin"));
const ServiceOrdersAdmin = lazy(() => import("./admin/dashboard/servicebooking/ServiceOrdersAdmin"));
const CreateService = lazy(() => import("./admin/dashboard/servicebooking/CreateService"));


// Lazy Loaded Pages (Pages) cho Staff
const HomeStaff = lazy(() => import("./Staff/components/HomeStaff"));
const RoomStaff = lazy(() => import("./Staff/dashboard/RoomStaff"));
const RoomTypeStaff = lazy(() => import("./Staff/dashboard/RoomTypeStaff"));
const BookingStaff = lazy(() => import("./Staff/dashboard/booking/BookingStaff"));
const UserStaff = lazy(() => import("./Staff/dashboard/UserStaff"));

const PersonalDetailsStaff = lazy(() => import("./Staff/dashboard/PersonalDetailsStaff"));

// Shared Components / Features
const Promotions = lazy(() => import("./components/promotion/Promotions"));
const Promotionhistory = lazy(() => import("./components/promotion/Promotionhistory"));
const Booking = lazy(() => import("./components/booking/booking"));
const VNPayTopup = lazy(() => import("./components/vnpay/vnpay"));
const VNPayReturn = lazy(() => import("./components/vnpay/VNPayReturn"));
const GlobalSearch = lazy(() => import("./components/Search/GlobalSearch"));
const SearchPage = lazy(() => import("./components/Search/Searchpage"));
const PaymentBooking = lazy(() => import("./components/booking/Paymentbooking"));
const Orderpayment = lazy(() => import("./components/booking/Orderpayment"));
const ServicesPage = lazy(() => import("./components/servicebooking/ServicesPage"));

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAppSelector } from '@/lib/redux/store';
import { selectIsAdmin, selectIsStaff, selectAuthUser } from '@/lib/redux/reducers/auth/selectors';
import useSocket from '@/hooks/useSocket';

const App: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/owner');
  const isStaffPath = location.pathname.startsWith('/staff');

  const isAdmin = useAppSelector(selectIsAdmin);
  const isStaff = useAppSelector(selectIsStaff);
  const user = useAppSelector(selectAuthUser);

  useSocket();

  if (isStaffPath && !isStaff) {
    return <Navigate to="/login" replace />;
  }

  if (isAdminPath && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Chuyển hướng tự động nhân viên/quản lý nếu cố tình vào giao diện khách hàng
  if ((isAdmin || isStaff) && !isAdminPath && !isStaffPath && location.pathname !== '/login') {
    return <Navigate to={isAdmin ? "/owner" : "/staff"} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Suspense fallback={<LoadingScreen />}>
        {isAdminPath ? (
          <div className="flex min-h-screen">
            <SidebarAdmin />
            <main className="flex-grow ml-64 bg-gray-50">
              <Routes>
                <Route path="/owner" element={<HomeAdmin />} />
                <Route path="/owner/bookings" element={<BookingStaff />} />
                <Route path="/owner/user" element={(user?.role === 'admin') ? <UserAdmin /> : <Navigate to="/owner" replace />} />
                <Route path="/owner/staff" element={<StaffAdmin />} />
                <Route path="/owner/room-types" element={<RoomTypeAdmin />} />
                <Route path="/owner/rooms" element={<RoomAdmin />} />
                <Route path="/owner/promotions" element={<PromotionAdmin />} />
                <Route path="/owner/comments" element={<CommentAdmin />} />
                <Route path="/owner/chatbot" element={<ChatbotAdmin />} />
                <Route path="/owner/services" element={<ServiceAdmin />} />
                <Route path="/owner/service-orders" element={<ServiceOrdersAdmin />} />
                <Route path="/owner/service-orders/create" element={<CreateService />} />
                <Route path="/owner/profile" element={<PersonalDetailsAdmin />} />
              </Routes>

            </main>
          </div>
        ) : isStaffPath ? (
          <div className="flex min-h-screen">
            <SidebarStaff />
            <main className="flex-grow ml-64 bg-gray-50">
              <Routes>
                <Route path="/staff" element={<HomeStaff />} />
                <Route path="/staff/bookings" element={<BookingStaff />} />
                <Route path="/staff/rooms" element={<RoomStaff />} />
                <Route path="/staff/room-types" element={<RoomTypeStaff />} />
                <Route path="/staff/users" element={<UserStaff />} />
                <Route path="/staff/service-orders" element={<ServiceOrdersAdmin />} />
                <Route path="/staff/service-orders/create" element={<CreateService />} />

                <Route path="/staff/profile" element={<PersonalDetailsStaff />} />
              </Routes>
            </main>
          </div>
        ) : (
          <>
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/promotion-history" element={<Promotionhistory />} />
                <Route path="/rooms" element={<SearchPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/profile" element={<Viewprofile />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/topup" element={<VNPayTopup />} />
                <Route path="/vnpay-return" element={<VNPayReturn />} />
                <Route path="/search" element={<GlobalSearch />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/payment" element={<PaymentBooking />} />
                <Route path="/order-payment" element={<Orderpayment />} />
                <Route path="/services" element={<ServicesPage />} />
              </Routes>
            </main>
            <Footer />
          </>
        )}
      </Suspense>
      <Chatbot />
    </div>
  );
};

export default App;
