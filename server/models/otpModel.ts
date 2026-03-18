import mongoose, { Document, Model } from "mongoose";

export interface IOtp extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
}

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

const otpModel: Model<IOtp> = mongoose.models.otp || mongoose.model<IOtp>("otp", otpSchema);

export default otpModel;
