import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

// Map: socketId → userId
const socketUserMap = new Map<string, string>();
// Map: userId → Set of socketIds (hỗ trợ user login nhiều tab)
const userSocketsMap = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Khi user join với userId
        socket.on('join', (userId: string) => {
            if (!userId) return;

            // Lưu map
            socketUserMap.set(socket.id, userId);
            if (!userSocketsMap.has(userId)) {
                userSocketsMap.set(userId, new Set());
            }
            userSocketsMap.get(userId)!.add(socket.id);

            // Join phòng riêng của user
            socket.join(userId);
            console.log(`User ${userId} joined (socket: ${socket.id})`);

            // Nếu đây là socket đầu tiên của user → báo online
            if (userSocketsMap.get(userId)!.size === 1) {
                io.emit('user_online', userId);
                console.log(`User ${userId} is now ONLINE`);
            }

            // Gửi lại danh sách online cho socket vừa join
            const onlineIds = Array.from(userSocketsMap.keys()).filter(
                (id) => (userSocketsMap.get(id)?.size ?? 0) > 0
            );
            socket.emit('get_online_users', onlineIds);
        });

        // Khi admin/client yêu cầu danh sách online
        socket.on('request_online_users', () => {
            const onlineIds = Array.from(userSocketsMap.keys()).filter(
                (id) => (userSocketsMap.get(id)?.size ?? 0) > 0
            );
            socket.emit('get_online_users', onlineIds);
        });

        socket.on('disconnect', () => {
            const userId = socketUserMap.get(socket.id);
            console.log(`Socket ${socket.id} disconnected (user: ${userId ?? 'unknown'})`);

            if (userId) {
                socketUserMap.delete(socket.id);

                const sockets = userSocketsMap.get(userId);
                if (sockets) {
                    sockets.delete(socket.id);

                    // Nếu không còn socket nào → user offline
                    if (sockets.size === 0) {
                        userSocketsMap.delete(userId);
                        io.emit('user_offline', userId);
                        console.log(`User ${userId} is now OFFLINE`);
                    }
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper function to emit events to specific users
export const emitToUser = (userId: string, event: string, data: any) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
};

// Helper function to emit events to all connected clients (e.g., Staff/Admin)
export const emitToAll = (event: string, data: any) => {
    if (io) {
        io.emit(event, data);
    }
};
