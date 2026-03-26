import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBookingDetail extends Document {
    bookingId: mongoose.Types.ObjectId;
    roomId: mongoose.Types.ObjectId;
    price: number; // Giá của phòng này tại thời điểm đặt
    roomStatus: 'waiting' | 'checked_in' | 'checked_out' | 'cancelled'; // Trạng thái cụ thể của phòng trong đơn đặt này (Yêu cầu của bạn)
    createdAt: Date;
    updatedAt: Date;
}

const bookingDetailSchema = new Schema<IBookingDetail>(
    {
        bookingId: { 
            type: Schema.Types.ObjectId, 
            ref: 'booking', 
            required: true 
        },
        roomId: { 
            type: Schema.Types.ObjectId, 
            ref: 'room', 
            required: true 
        },
        price: { 
            type: Number, 
            required: true 
        },
        roomStatus: { 
            type: String, 
            enum: ['waiting', 'checked_in', 'checked_out', 'cancelled'], 
            default: 'waiting' 
        }
    }, 
    { timestamps: true }
);

const bookingDetailModel: Model<IBookingDetail> = 
    mongoose.models.bookingDetail || mongoose.model<IBookingDetail>("bookingDetail", bookingDetailSchema);

export default bookingDetailModel;
