import { RootState } from '../../../store';
import { ServiceItem } from '../types';

export const selectAllCategories = (state: RootState) => state.service.categories;
export const selectAllServices = (state: RootState) => state.service.services;
export const selectAllServiceOrders = (state: RootState) => state.service.orders;
export const selectServiceLoading = (state: RootState) => state.service.loading;
export const selectServiceError = (state: RootState) => state.service.error;

export const selectServicesByCategory = (categoryId: string) => (state: RootState) => 
    state.service.services.filter((s: ServiceItem) => {
        const catId = typeof s.categoryId === 'string' ? s.categoryId : s.categoryId._id;
        return catId === categoryId;
    });
