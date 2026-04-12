import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from './auth';
import { bookingReducer } from './booking';
import { roomReducer } from './room';
import { roomTypeReducer } from './room-type';
import { userReducer } from './user';
import { staffDashboardReducer } from './staff-dashboard';
import { promotionReducer } from './promotion';
import { reducer as vnpayReducer } from './vnpay';
import { reducer as searchReducer } from './search';
import commentReducer from './comment';
import { statsReducer } from './stats';
import { serviceReducer } from './service';

const rootReducer = combineReducers({
    auth: authReducer,
    booking: bookingReducer,
    room: roomReducer,
    roomType: roomTypeReducer,
    user: userReducer,
    staffDashboard: staffDashboardReducer,
    promotion: promotionReducer,
    vnpay: vnpayReducer,
    search: searchReducer,
    comment: commentReducer,
    stats: statsReducer,
    service: serviceReducer,
});

export default rootReducer;
