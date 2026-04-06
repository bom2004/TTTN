// ===== STAFF DASHBOARD TYPES =====

export interface DashboardStats {
    todayBookings: number;
    availableRooms: number;
    totalCustomers: number;
    pendingCheckins: number;
}

export interface StaffDashboardState {
    stats: DashboardStats;
    loading: boolean;
    error: string | null;
}
