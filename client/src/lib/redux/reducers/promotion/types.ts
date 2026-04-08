// ===== PROMOTION TYPES =====

export interface Promotion {
    _id: string;
    title: string;
    description: string;
    discountPercent: number;
    code: string;
    startDate: string;
    endDate: string;
    minOrderValue: number;
    usageLimit: number;
    usedCount: number;
    usedBy?: string[];
    roomTypes?: string[];
    image?: string;
    maxDiscountAmount: number; // New field
    minGeniusLevel: number;
    status: 'active' | 'inactive' | 'expired';
    createdAt: string;
    updatedAt: string;
}

export interface PromotionState {
    promotions: Promotion[];
    history: Promotion[];
    selectedPromotion: Promotion | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
}
