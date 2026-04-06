import type { RootState } from '@/lib/redux/store';

export const selectAllPromotions = (state: RootState) => state.promotion.promotions;
export const selectSelectedPromotion = (state: RootState) => state.promotion.selectedPromotion;
export const selectPromotionLoading = (state: RootState) => state.promotion.loading;
export const selectPromotionSaving = (state: RootState) => state.promotion.saving;
export const selectPromotionError = (state: RootState) => state.promotion.error;
export const selectActivePromotions = (state: RootState) =>
    state.promotion.promotions.filter((p: any) => p.status === 'active');
export const selectPromotionHistory = (state: RootState) => state.promotion.history;
