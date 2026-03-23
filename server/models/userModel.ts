import mongoose, { Document, Model } from "mongoose";

export interface IUser extends Document {
    full_name: string;
    email: string;
    phone?: string;
    password?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner';
    avatar: string;
    balance: number;
    totalRecharged: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    password: { type: String, required: false },
    role: { type: String, default: 'customer' }, // 'customer', 'staff', 'admin', 'hotelOwner'
    avatar: { type: String, default: "" },
    balance: { type: Number, default: 0 },
    totalRecharged: { type: Number, default: 0 },
}, { timestamps: true });


const userModel: Model<IUser> = mongoose.models.user || mongoose.model<IUser>("user", userSchema);

export default userModel;

