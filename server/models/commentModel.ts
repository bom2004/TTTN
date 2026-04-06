import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
    userId: mongoose.Types.ObjectId;
    roomTypeId: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    images?: string[];
    reply?: string;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'user', 
            required: true 
        },
        roomTypeId: { 
            type: Schema.Types.ObjectId, 
            ref: 'roomType', 
            required: true 
        },
        bookingId: { 
            type: Schema.Types.ObjectId, 
            ref: 'booking', 
            required: true,
            unique: true // Một đơn đặt phòng chỉ được đánh giá 1 lần để đảm bảo trung thực
        },
        rating: { 
            type: Number, 
            required: true, 
            min: 1, 
            max: 5 
        },
        comment: { 
            type: String, 
            required: true, 
            trim: true 
        },
        images: [{ 
            type: String,
            default: []
        }],
        reply: { 
            type: String, 
            default: "" // Phản hồi từ phía khách sạn/Admin
        },
        isHidden: { 
            type: Boolean, 
            default: false // Ẩn bình luận nếu vi phạm
        }
    },
    { timestamps: true }
);

const commentModel: Model<IComment> = 
    mongoose.models.comment || mongoose.model<IComment>("comment", commentSchema);

export default commentModel;
