import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../lib/redux/store";
import { selectAuthUser } from "../../lib/redux/reducers/auth/selectors";
import { fetchAllRoomsThunk, selectAllRooms, selectRoomLoading } from "../../lib/redux/reducers/room";
import { fetchAllUsersThunk, selectAllUsers, selectUserLoading } from "../../lib/redux/reducers/user";
import { fetchAllBookingsThunk, selectAllBookings, selectBookingLoading } from "../../lib/redux/reducers/booking";
import { fetchMyAttendanceThunk, selectMyAttendance, checkOutThunk, checkInThunk } from "../../lib/redux/reducers/attendance";
import { fetchShiftsByMonthThunk, selectAllShifts, selectShiftLoading } from "../../lib/redux/reducers/shift";
import { toast } from "react-toastify";

export const useHomeStaff = () => {
    const dispatch = useAppDispatch();
    const authUser = useAppSelector(selectAuthUser);
    const myAttendance = useAppSelector(selectMyAttendance);
    const shifts = useAppSelector(selectAllShifts) ?? [];
    
    // Global State
    const rooms = useAppSelector(selectAllRooms) ?? [];
    const users = useAppSelector(selectAllUsers) ?? [];
    const bookings = useAppSelector(selectAllBookings) ?? [];
    
    // Nạp loading an toàn (Fix Rules of Hooks)
    const load1 = useAppSelector(selectRoomLoading);
    const load2 = useAppSelector(selectUserLoading);
    const load3 = useAppSelector(selectBookingLoading);
    const load4 = useAppSelector(selectShiftLoading);
    const loading = load1 || load2 || load3 || load4;

    // Attendance State
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Initial Sync
    useEffect(() => {
        const now = new Date();
        dispatch(fetchAllRoomsThunk()).unwrap().catch(() => {});
        dispatch(fetchAllUsersThunk()).unwrap().catch(() => {});
        dispatch(fetchAllBookingsThunk()).unwrap().catch(() => {});
        // Lấy danh sách ca làm tháng này
        dispatch(fetchShiftsByMonthThunk({ year: now.getFullYear(), month: now.getMonth() + 1 }));
        
        if (authUser?.id || authUser?._id) {
            dispatch(fetchMyAttendanceThunk(authUser._id || authUser.id));
        }
    }, [dispatch, authUser]);

    // Data Engine (Stats, Bookings, Attendance, Shifts)
    const viewData = useMemo(() => {
        const now = new Date();
        const vietnamOffset = 7 * 60 * 60 * 1000;
        const today = new Date(now.getTime() + vietnamOffset).toISOString().split('T')[0];
        const currentUserId = authUser?._id || authUser?.id;

        const safeBookings = Array.isArray(bookings) ? bookings : [];
        const safeRooms = Array.isArray(rooms) ? rooms : [];
        const safeUsers = Array.isArray(users) ? users : [];
        const safeShifts = Array.isArray(shifts) ? shifts : [];

        // 1. Phân tích Ca làm việc (Shifts)
        const todayShift = safeShifts.find(s => 
            s.date === today && 
            (s.user_id === currentUserId || s.user_id?._id === currentUserId)
        );

        // 2. Sắp xếp đơn đặt phòng
        const sortedRecent = [...safeBookings]
            .filter(b => b?._id && b?.createdAt)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);

        // 3. Trạng thái Điểm danh
        const currentAttendance = Array.isArray(myAttendance) ? myAttendance : [];
        const todayRecord = currentAttendance.find(r => r?.date === today);

        return {
            stats: {
                todayBookings: safeBookings.filter(b => b?.createdAt?.startsWith(today)).length,
                availableRooms: safeRooms.filter(r => r?.status === 'available').length,
                customers: safeUsers.filter(u => u?.role === 'customer').length,
                pending: safeBookings.filter(b => b?.status === 'pending').length,
            },
            recentBookings: sortedRecent,
            attendance: {
                hasCheckedIn: !!todayRecord,
                hasCheckedOut: !!todayRecord?.check_out_time,
                todayRecord
            },
            myShiftToday: todayShift || null
        };
    }, [rooms, users, bookings, myAttendance, shifts, authUser]);

    // Handlers
    const handleStartCheckIn = () => {
        if (!gpsLocation) {
            toast.error("❌ Link GPS chưa sẵn sàng. Vui lòng cho phép định vị trình duyệt.");
            return;
        }
        setShowCameraModal(true);
    };

    const handleCheckInAction = async (image: string) => {
        if (!authUser || !gpsLocation) return;
        setIsAttendanceLoading(true);
        try {
            const userId = authUser._id || authUser.id;
            await dispatch(checkInThunk({
                userId,
                latitude: gpsLocation.latitude,
                longitude: gpsLocation.longitude,
                image_base64: image
            })).unwrap();
            
            toast.success("✅ Điểm danh vào ca thành công!");
            setShowCameraModal(false);
            dispatch(fetchMyAttendanceThunk(userId)); // Refresh immediately
        } catch (error: any) {
            toast.error(error || "❌ Lỗi xác thực");
        } finally {
            setIsAttendanceLoading(false);
        }
    };

    const handleCheckOutAction = async () => {
        if (!authUser) return;
        setIsAttendanceLoading(true);
        try {
            const userId = authUser._id || authUser.id;
            await dispatch(checkOutThunk(userId)).unwrap();
            toast.success(`✅ Chấm công tan ca thành công!`);
            dispatch(fetchMyAttendanceThunk(userId)); // Refresh immediately
        } catch (error: any) {
            toast.error(error || "❌ Lỗi tan ca");
        } finally {
            setIsAttendanceLoading(false);
        }
    };

    return {
        authUser,
        loading,
        isAttendanceLoading,
        viewData,
        showCameraModal, setShowCameraModal,
        setGpsLocation,
        handleStartCheckIn,
        handleCheckInAction,
        handleCheckOutAction
    };
};
