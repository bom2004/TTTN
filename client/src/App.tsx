import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SidebarAdmin from './admin/components/SidebarAdmin';
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import SearchPage from './components/Search/Searchpage';
import Promotions from './pages/Promotions';
import Login from "./login/login";
import Register from "./login/Register";
import Forgot from "./login/forgot";
import ViewProfile from "./login/Viewprofile";
import MyBookings from './login/MyBookings';
import HomeAdmin from "./admin/dashboard/homeadmin";
import UserAdmin from "./admin/dashboard/user";
import RoomTypeAdmin from "./admin/dashboard/RoomTypeAdmin";
import RoomAdmin from "./admin/dashboard/RoomAdmin";
import PromotionAdmin from "./admin/dashboard/PromotionAdmin";
import VNPayTopup from "./components/vnpay";
import VNPayReturn from "./components/VNPayReturn";
import GlobalSearch from "./components/Search/GlobalSearch";
import Booking from './components/booking';
import PaymentBooking from './components/Paymentbooking';
import Orderpayment from './components/Orderpayment';
import SidebarStaff from './Staff/components/SidebarStaff';
import HomeStaff from './Staff/dashboard/HomeStaff';
import PlaceholderStaffPage from './Staff/dashboard/PlaceholderStaffPage';
import UserStaff from './Staff/dashboard/UserStaff';
import RoomStaff from './Staff/dashboard/RoomStaff';
import RoomTypeStaff from './Staff/dashboard/RoomTypeStaff';
import BookingStaff from './Staff/dashboard/BookingStaff';
import PromotionHistory from './pages/Promotionhistory';
import { Navigate } from "react-router-dom";
import { UserData } from './types';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/owner');
  const isStaffPath = location.pathname.startsWith('/staff');

  const userDataRaw = localStorage.getItem('userData');
  const userData: UserData | null = userDataRaw ? JSON.parse(userDataRaw) : null;

  // Simple guards
  const isStaff = userData?.role === 'staff' || userData?.role === 'admin';
  const isAdmin = userData?.role === 'admin' || userData?.role === 'hotelOwner';

  if (isStaffPath && !isStaff) {
    return <Navigate to="/login" replace />;
  }

  if (isAdminPath && !isAdmin) {
    return <Navigate to="/login" replace />;
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

      {/* Conditionally render Navbar/Footer, SidebarAdmin, or SidebarStaff based on the path */}
      {isAdminPath ? (
        <div className="flex min-h-screen">
          <SidebarAdmin />
          <main className="flex-grow ml-64 bg-gray-50">
            <Routes>
              <Route path="/owner" element={<HomeAdmin />} />
              <Route path="/owner/bookings" element={<BookingStaff />} />
              <Route path="/owner/user" element={<UserAdmin />} />
              <Route path="/owner/room-types" element={<RoomTypeAdmin />} />
              <Route path="/owner/rooms" element={<RoomAdmin />} />
              <Route path="/owner/promotions" element={<PromotionAdmin />} />
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
              <Route path="/promotion-history" element={<PromotionHistory />} />
              <Route path="/rooms" element={<SearchPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot" element={<Forgot />} />
              <Route path="/profile" element={<ViewProfile />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/topup" element={<VNPayTopup />} />
              <Route path="/vnpay-return" element={<VNPayReturn />} />
              <Route path="/search" element={<GlobalSearch />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/payment" element={<PaymentBooking />} />
              <Route path="/order-payment" element={<Orderpayment />} />
            </Routes>
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default App;