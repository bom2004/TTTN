import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBooking extends Document {
    userId: mongoose.Types.ObjectId;
    // Lưu thông tin khách hàng tại thời điểm đặt (đề phòng user thay đổi thông tin sau này)
    customerInfo: {
        name: string;
        email: string;
        phone: string;
    };
    checkInDate: Date;
    checkOutDate: Date;
    totalAmount: number; // Tổng tiền trước giảm giá
    discountAmount: number; // Số tiền được giảm
    finalAmount: number; // Số tiền cuối cùng phải thanh toán
    promotionCode?: string; // Mã khuyến mãi áp dụng (Yêu cầu của bạn)
    status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid' | 'deposited';
    paymentMethod: 'vnpay' | 'cash' | 'balance' | 'wallet';
    paidAmount?: number;
    checkInTime?: string;
    specialRequests?: string;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'user', 
            required: true 
        },
        customerInfo: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
        },
        checkInDate: { 
            type: Date, 
            required: true 
        },
        checkOutDate: { 
            type: Date, 
            required: true 
        },
        totalAmount: { 
            type: Number, 
            required: true 
        },
        discountAmount: { 
            type: Number, 
            default: 0 
        },
        finalAmount: { 
            type: Number, 
            required: true 
        },
        promotionCode: { 
            type: String,
            default: ""
        },
        status: { 
            type: String, 
            enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled'], 
            default: 'pending' 
        },
        paymentStatus: { 
            type: String, 
            enum: ['unpaid', 'paid', 'deposited'], 
            default: 'unpaid' 
        },
        paymentMethod: { 
            type: String, 
            enum: ['vnpay', 'cash', 'balance', 'wallet'], 
            default: 'vnpay' 
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        checkInTime: {
            type: String,
            default: "Tôi chưa biết"
        },
        specialRequests: {
            type: String,
            default: ""
        }
    }, 
    { timestamps: true }
);

const bookingModel: Model<IBooking> = 
    mongoose.models.booking || mongoose.model<IBooking>("booking", bookingSchema);

export default bookingModel;
