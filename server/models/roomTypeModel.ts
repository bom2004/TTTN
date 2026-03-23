import mongoose, { Document, Model } from "mongoose";

export interface IRoomType extends Document {
    name: string;
    description?: string;
    basePrice: number;
    isActive: boolean;
    image: string;
    createdAt: Date;
    updatedAt: Date;
}

const roomTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    }, // 'Phòng thường', 'Phòng VIP', 'Phòng tiệc', 'Phòng Karaoke'
    description: { 
        type: String, 
        trim: true 
    },
    basePrice: { 
        type: Number, 
        required: true,
        default: 0
    }, // Giá cơ bản tham khảo
    isActive: { 
        type: Boolean, 
        default: true 
    },
    image: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const roomTypeModel: Model<IRoomType> = mongoose.models.roomType || mongoose.model<IRoomType>("roomType", roomTypeSchema);

export default roomTypeModel;
