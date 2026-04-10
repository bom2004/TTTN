import mongoose, { Document, Model } from "mongoose";

export interface IUser extends Document {
    full_name: string;
    email: string;
    phone?: string;
    password?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner' | 'receptionist' | 'accountant';
    avatar: string;
    totalSpent: number;
    membershipLevel: 'silver' | 'gold' | 'diamond' | 'platinum';
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    password: { type: String, required: false },
    role: { 
        type: String, 
        enum: ['customer', 'staff', 'admin', 'hotelOwner', 'receptionist', 'accountant'],
        default: 'customer' 
    },
    avatar: { type: String, default: "" },
    totalSpent: { type: Number, default: 0 },
    membershipLevel: { 
        type: String, 
        enum: ['silver', 'gold', 'diamond', 'platinum'], 
        default: 'silver' 
    },
    isActive: { type: Boolean, default: true },
    salary_base: { type: Number, default: 10000000 },
}, { timestamps: true });


const userModel: Model<IUser> = mongoose.models.user || mongoose.model<IUser>("user", userSchema);

export default userModel;

