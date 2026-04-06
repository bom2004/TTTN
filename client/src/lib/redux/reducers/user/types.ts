// ===== USER TYPES =====

export interface User {
    id: string;
    _id?: string;
    full_name: string;
    email: string;
    phone?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner' | 'receptionist' | 'accountant';
    avatar: string;
    balance: number;
    totalRecharged: number;
    membershipLevel?: 'silver' | 'gold' | 'diamond' | 'platinum';
}

export interface UserState {
    users: User[];
    selectedUser: User | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    onlineUserIds: string[];
}

export interface CreateUserPayload {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    role?: 'customer';
    balance?: number;
    totalRecharged?: number;
}

export interface UpdateUserPayload {
    userId: string;
    full_name?: string;
    email?: string;
    phone?: string;
    password?: string;
    balance?: number;
    totalRecharged?: number;
}

export interface AdminRechargeResult {
    userId: string;
    message: string;
    data: {
        balance: number;
        totalRecharged: number;
        membershipLevel: 'silver' | 'gold' | 'diamond' | 'platinum';
    };
}
