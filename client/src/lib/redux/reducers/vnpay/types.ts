export interface VNPayHistoryItem {
    _id: string;
    id?: string;
    amount: number;
    txnRef: string;
    status: 'success' | 'pending' | 'failed';
    createdAt: string;
    updatedAt: string;
}

export interface VNPayState {
    history: VNPayHistoryItem[];
    loading: boolean;
    error: string | null;
}
