import { RootState } from '../../store.ts';

export const selectStatsData = (state: RootState) => state.stats.data;
export const selectStatsLoading = (state: RootState) => state.stats.loading;
export const selectStatsError = (state: RootState) => state.stats.error;
