import mongoose, { Document, Model } from "mongoose";

export interface IRoomType extends Document {
    name: string;
    description?: string;
    basePrice: number;
    totalInventory: number;
    capacity: number;
    size: number;
    bedType: string;
    view?: string;
    amenities: {
        wifi: boolean;
        airConditioner: boolean;
        breakfast: boolean;
        minibar: boolean;
        tv: boolean;
        balcony: boolean;
    };
    rating: number;
    reviewCount: number;
    isActive: boolean;
    image: string;
    images: string[];
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
    totalInventory: {
        type: Number,
        default: 0,
        min: 0
    },
    capacity: {
        type: Number,
        required: true,
        default: 2,
    },
    size: {
        type: Number, // m²
        required: true,
    },
    bedType: {
        type: String, // King, Queen, Twin
        required: true,
    },
    view: {
        type: String,
    },
    amenities: {
        wifi: { type: Boolean, default: false },
        airConditioner: { type: Boolean, default: false },
        breakfast: { type: Boolean, default: false },
        minibar: { type: Boolean, default: false },
        tv: { type: Boolean, default: false },
        balcony: { type: Boolean, default: false },
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    image: {
        type: String,
        default: ""
    },
    images: [{
        type: String,
    }],
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

const roomTypeModel: Model<IRoomType> = mongoose.models.roomType || mongoose.model<IRoomType>("roomType", roomTypeSchema);

export default roomTypeModel;
