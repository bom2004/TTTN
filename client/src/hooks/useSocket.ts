import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../lib/redux/store';
import socket from '../lib/redux/socket';
import { selectAuthUser, selectIsStaff, selectIsAdmin } from '../lib/redux/reducers/auth/selectors';
import { addBookingSocket, updateBookingSocket } from '../lib/redux/reducers/booking/reducer';
import { updateRoomStatusSocket } from '../lib/redux/reducers/room/reducer';
import { setOnlineUsers, addOnlineUser, removeOnlineUser, updateUserSocket } from '../lib/redux/reducers/user/reducer';
import { updateUserAuthSocket } from '../lib/redux/reducers/auth';

const useSocket = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectAuthUser);
    const isStaff = useAppSelector(selectIsStaff);
    const isAdmin = useAppSelector(selectIsAdmin);

    useEffect(() => {
        if (!user) {
            if (socket.connected) {
                socket.disconnect();
            }
            return;
        }

        const userId = (user as any).id || (user as any)._id;

        // Hàm join: emit userId lên server để track online status
        const emitJoin = () => {
            socket.emit('join', userId);
        };

        if (!socket.connected) {
            socket.connect();
        } else {
            // Đã kết nối sẵn → join lại để đảm bảo server biết userId
            emitJoin();
        }

        // Khi (re)connect thành công → emit join
        socket.on('connect', emitJoin);

        // Listen for new bookings (Staff/Admin)
        if (isStaff || isAdmin) {
            socket.on('booking_created', (booking) => {
                dispatch(addBookingSocket(booking));
                toast.info(`🔔 Đơn đặt phòng mới từ ${booking.customerInfo.name}`, {
                    position: "top-right",
                    autoClose: 5000,
                });
            });

            socket.on('booking_cancelled', (booking) => {
                dispatch(updateBookingSocket(booking));
                toast.warning(`⚠️ Đơn đặt phòng ${booking._id.slice(-6)} đã bị hủy`, {
                    position: "top-right",
                });
            });

            socket.on('booking_status_changed', (booking) => {
                dispatch(updateBookingSocket(booking));
            });
        }

        // Listen for booking updates (User specific)
        socket.on('booking_updated', (booking) => {
            dispatch(updateBookingSocket(booking));

            // If the user is the owner of the booking and not staff/admin, notify them
            const isOwner = booking.userId === userId || booking.userId?._id === userId;
            if (isOwner && !isStaff && !isAdmin) {
                let message = `Trạng thái đơn đặt phòng của bạn đã cập nhật: ${booking.status}`;
                if (booking.status === 'confirmed') message = '✅ Đơn đặt phòng của bạn đã được xác nhận!';
                else if (booking.status === 'cancelled') message = '❌ Đơn đặt phòng của bạn đã bị hủy.';
                else if (booking.status === 'checked_in') message = '🏨 Chào mừng bạn đã nhận phòng!';

                toast.success(message, {
                    position: "top-right",
                });
            }
        });

        // Listen for room status changes
        socket.on('room_status_changed', (data: { id: string, status: any }) => {
            dispatch(updateRoomStatusSocket(data));
        });

        // Listen for user online/offline status
        socket.on('get_online_users', (userIds: string[]) => {
            dispatch(setOnlineUsers(userIds));
        });

        socket.on('user_online', (userId: string) => {
            dispatch(addOnlineUser(userId));
        });

        socket.on('user_offline', (userId: string) => {
            dispatch(removeOnlineUser(userId));
        });

        // Listen for membership upgrades (Current User)
        socket.on('user_membership_upgraded', (data: { membershipLevel: 'silver' | 'gold' | 'diamond' | 'platinum', totalSpent: number }) => {
            dispatch(updateUserAuthSocket(data));
        });

        // Listen for all user updates (Staff/Admin)
        socket.on('user_updated', (updatedUser: any) => {
            dispatch(updateUserSocket(updatedUser));
        });

        return () => {
            socket.off('connect');
            socket.off('booking_created');
            socket.off('booking_updated');
            socket.off('booking_cancelled');
            socket.off('booking_status_changed');
            socket.off('room_status_changed');
            socket.off('get_online_users');
            socket.off('user_online');
            socket.off('user_offline');
            socket.off('user_membership_upgraded');
            socket.off('user_updated');
        };
    }, [user, isStaff, isAdmin, dispatch]);

    return socket;
};

export default useSocket;
