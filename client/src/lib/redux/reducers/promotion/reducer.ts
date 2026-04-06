import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PromotionState, Promotion } from './types';
import {
    fetchAllPromotionsThunk,
    fetchUserPromotionHistoryThunk,
    createPromotionThunk,
    updatePromotionThunk,
    deletePromotionThunk,
    togglePromotionStatusThunk,
} from './thunks';

const initialState: PromotionState = {
    promotions: [],
    history: [],
    selectedPromotion: null,
    loading: false,
    saving: false,
    error: null,
};

const promotionSlice = createSlice({
    name: 'promotion',
    initialState,
    reducers: {
        setSelectedPromotion(state, action: PayloadAction<Promotion | null>) {
            state.selectedPromotion = action.payload;
        },
        clearPromotionError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch all
        builder
            .addCase(fetchAllPromotionsThunk.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAllPromotionsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.promotions = action.payload;
            })
            .addCase(fetchAllPromotionsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch User History
        builder
            .addCase(fetchUserPromotionHistoryThunk.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchUserPromotionHistoryThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchUserPromotionHistoryThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createPromotionThunk.pending, (state) => { state.saving = true; })
            .addCase(createPromotionThunk.fulfilled, (state, action) => {
                state.saving = false;
                if (action.payload) state.promotions.push(action.payload);
            })
            .addCase(createPromotionThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updatePromotionThunk.pending, (state) => { state.saving = true; })
            .addCase(updatePromotionThunk.fulfilled, (state, action) => {
                state.saving = false;
                const updated: Promotion = action.payload;
                const idx = state.promotions.findIndex((p) => p._id === updated._id);
                if (idx !== -1) state.promotions[idx] = updated;
                if (state.selectedPromotion?._id === updated._id) state.selectedPromotion = updated;
            })
            .addCase(updatePromotionThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deletePromotionThunk.pending, (state) => { state.saving = true; })
            .addCase(deletePromotionThunk.fulfilled, (state, action) => {
                state.saving = false;
                state.promotions = state.promotions.filter((p) => p._id !== action.payload);
                if (state.selectedPromotion?._id === action.payload) state.selectedPromotion = null;
            })
            .addCase(deletePromotionThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });
        // Toggle status
        builder
            .addCase(togglePromotionStatusThunk.fulfilled, (state, action) => {
                const { id, status } = action.payload as any;
                const idx = state.promotions.findIndex((p) => p._id === id);
                if (idx !== -1) state.promotions[idx].status = status;
            });
    },
});

export const { setSelectedPromotion, clearPromotionError } = promotionSlice.actions;
export default promotionSlice.reducer;
