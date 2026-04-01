export interface AttendanceData {
    _id?: string;
    id?: string;
    user_id: string | any;
    date: string;
    check_in_time?: string;
    check_out_time?: string;
    status: 'on_time' | 'late' | 'approved_leave' | 'absent' | 'incomplete';
    total_hours?: number;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AttendanceState {
    records: AttendanceData[];
    myRecords: AttendanceData[];
    loading: boolean;
    error: string | null;
}
