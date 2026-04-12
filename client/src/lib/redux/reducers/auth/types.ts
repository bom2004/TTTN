// ===== AUTH TYPES =====

export interface AuthUser {
    id: string;
    _id?: string;
    full_name: string;
    email: string;
    phone?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner' | 'receptionist' | 'accountant';
    avatar: string;
    totalSpent: number;
    membershipLevel: 'silver' | 'gold' | 'diamond' | 'platinum';
    token?: string;
    createdAt?: string;
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface OTPPayload {
    email: string;
    otp: string;
}

export interface ResetPasswordPayload {
    email: string;
    otp: string;
    newPassword: string;
}
