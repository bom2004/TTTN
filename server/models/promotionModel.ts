import mongoose, { Document, Model } from "mongoose";

export interface IPromotion extends Document {
    title: string;
    description: string;
    discountPercent: number;
    code: string;
    startDate: Date;
    endDate: Date;
    minOrderValue: number;
    usageLimit: number;
    usedCount: number;
    usedBy: mongoose.Types.ObjectId[];
    roomTypes: mongoose.Types.ObjectId[]; // New field
    image: string;
    minGeniusLevel: number;
    status: 'active' | 'inactive' | 'expired';
    createdAt: Date;
}

const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    discountPercent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    usageLimit: {
        type: Number,
        default: 0  // 0 = không giới hạn
    },
    usedCount: {
        type: Number,
        default: 0
    },

    // chiếu tham số để lấy dữ liệu bảng user và roomType
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    roomTypes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roomType'
    }],
    image: {
        type: String,
        default: ""
    },
    minGeniusLevel: {
        type: Number,
        default: 0 // 0 = mọi đối tượng, 1 = Genius 1 trở lên...
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    }
}, { timestamps: true });

const promotionModel: Model<IPromotion> = mongoose.models.promotion || mongoose.model<IPromotion>("promotion", promotionSchema);

export default promotionModel;
