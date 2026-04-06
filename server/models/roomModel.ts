import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRoom extends Document {
  roomTypeId: mongoose.Types.ObjectId;
  roomNumber: string;
  status: "available" | "occupied" | "maintenance";
  hotelId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    // ===== Thông tin cơ bản =====`
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'roomType',
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
    },
  },
  {
    timestamps: true,
  }
);

const roomModel: Model<IRoom> =
  mongoose.models.room || mongoose.model<IRoom>("room", roomSchema);

export default roomModel;


