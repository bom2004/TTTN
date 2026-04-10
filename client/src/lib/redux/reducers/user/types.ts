// ===== USER TYPES =====

export interface User {
    id: string;
    _id?: string;
    full_name: string;
    email: string;
    phone?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner' | 'receptionist' | 'accountant';
    avatar: string;
    totalSpent: number;
    membershipLevel: 'silver' | 'gold' | 'diamond' | 'platinum';
    isActive?: boolean;
    createdAt?: string;
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
    totalSpent?: number;
}

export interface UpdateUserPayload {
    userId: string;
    full_name?: string;
    email?: string;
    phone?: string;
    password?: string;
    totalSpent?: number;
}


