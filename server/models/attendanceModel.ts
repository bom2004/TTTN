import mongoose, { Document, Model } from "mongoose";

export interface IAttendance extends Document {
    user_id: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    check_in_time?: Date;
    check_out_time?: Date;
    status: 'on_time' | 'late' | 'approved_leave' | 'absent' | 'incomplete';
    image_evidence?: string;
    location_data?: {
        latitude: number;
        longitude: number;
        distance: number;
    };
    total_hours?: number;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

const attendanceSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    date: { type: String, required: true }, // Format: "YYYY-MM-DD"
    check_in_time: { type: Date },
    check_out_time: { type: Date },
    status: { 
        type: String, 
        enum: ['on_time', 'late', 'approved_leave', 'absent', 'incomplete'],
        default: 'absent'
    },
    image_evidence: { type: String, default: '' },
    location_data: {
        latitude: { type: Number },
        longitude: { type: Number },
        distance: { type: Number }
    },
    total_hours: { type: Number, default: 0 },
    note: { type: String, default: '' }
}, { timestamps: true });

// Tự động tạo index kết hợp user_id và date để một ngày chỉ có 1 bản ghi chấm công (unique)
attendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });

const attendanceModel: Model<IAttendance> = mongoose.models.attendance || mongoose.model<IAttendance>("attendance", attendanceSchema);
export default attendanceModel;
