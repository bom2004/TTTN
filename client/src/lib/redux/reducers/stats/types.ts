export interface StatsData {
  revenueData: any[];
  roomTypeStats: any[];
  occupancyRate: number;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    activePromotions: number;
    totalRooms: number;
  };
}

export interface StatsState {
  data: StatsData | null;
  loading: boolean;
  error: string | null;
}
