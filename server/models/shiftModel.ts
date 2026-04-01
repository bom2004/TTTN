import mongoose, { Document, Schema } from 'mongoose';

export interface IShiftSchedule extends Document {
  user_id: mongoose.Types.ObjectId;
  date: Date;
  shift_type: 'day' | 'night' | 'full_day';
}

const shiftScheduleSchema = new Schema<IShiftSchedule>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    // Ngày diễn ra ca làm việc, được chuẩn hóa về 00:00:00
    date: { type: Date, required: true }, 
    shift_type: { type: String, enum: ['day', 'night', 'full_day'], required: true },
  },
  { timestamps: true }
);

// Một nhân viên chỉ được xếp vào 1 ca (ngày hoặc đêm) trong cùng 1 ngày
shiftScheduleSchema.index({ user_id: 1, date: 1 }, { unique: true });

const ShiftSchedule = mongoose.model<IShiftSchedule>('ShiftSchedule', shiftScheduleSchema);
export default ShiftSchedule;
