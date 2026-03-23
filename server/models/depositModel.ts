import mongoose, { Document, Model } from "mongoose";

export interface IDeposit extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    txnRef: string;
    status: 'pending' | 'success' | 'failed';
    bankCode?: string;
    payDate?: string;
    createdAt: Date;
}

const depositSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    amount: { type: Number, required: true },
    txnRef: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    bankCode: { type: String },
    payDate: { type: String },
}, { timestamps: true });

const depositModel: Model<IDeposit> = mongoose.models.deposit || mongoose.model<IDeposit>("deposit", depositSchema);

export default depositModel;
