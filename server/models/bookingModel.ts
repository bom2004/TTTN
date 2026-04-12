import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPaymentLog {
    amount: number;
    paymentMethod: 'vnpay' | 'cash';
    txnRef?: string; // Lưu mã giao dịch nếu có
    note?: string; // Ghi chú lý do nộp tiền (VD: Thu thêm do đổi phòng)
    createdAt: Date;
}

export interface IBooking extends Document {
    userId?: mongoose.Types.ObjectId;
    customerInfo: {
        name: string;
        email: string;
        phone: string;
    };
    // Thay đổi từ đặt 1 phòng sang đặt Loại phòng + Số lượng
    roomTypeId: mongoose.Types.ObjectId;
    roomQuantity: number;
    assignedRooms: mongoose.Types.ObjectId[]; // Gán khi check-in

    checkInDate: Date;
    checkOutDate: Date;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    originalAmount?: number; // Lưu giá gốc trước khi Admin sửa
    promotionCode?: string;
    status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid' | 'deposited';
    paymentMethod: 'vnpay' | 'cash';
    paidAmount?: number;
    paymentHistory: IPaymentLog[]; // Lịch sử thanh toán chi tiết
    vnp_TxnRef?: string; // Hỗ trợ VNPay trực tiếp
    checkInTime?: string;
    specialRequests?: string;
    adminNote?: string; // Ghi chú riêng của Admin
    source?: 'web' | 'chatbot';
    serviceAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'user', 
            required: false 
        },
        customerInfo: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
        },
        roomTypeId: {
            type: Schema.Types.ObjectId,
            ref: 'roomType',
            required: true
        },
        roomQuantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        assignedRooms: [{
            type: Schema.Types.ObjectId,
            ref: 'room'
        }],
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
        originalAmount: { 
            type: Number, 
            default: 0 
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
            enum: ['vnpay', 'cash'], 
            default: 'vnpay' 
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        paymentHistory: [
            {
                amount: { type: Number, required: true },
                paymentMethod: { type: String, required: true },
                txnRef: { type: String },
                note: { type: String },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        vnp_TxnRef: {
            type: String,
            default: ""
        },
        checkInTime: {
            type: String,
            default: "Tôi chưa biết"
        },
        specialRequests: {
            type: String,
            default: ""
        },
        adminNote: {
            type: String,
            default: ""
        },
        source: {
            type: String,
            enum: ['web', 'chatbot'],
            default: 'web'
        },
        serviceAmount: {
            type: Number,
            default: 0
        }
    }, 
    { timestamps: true }
);

const bookingModel: Model<IBooking> = 
    mongoose.models.booking || mongoose.model<IBooking>("booking", bookingSchema);

export default bookingModel;
