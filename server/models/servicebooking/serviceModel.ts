import mongoose, { Document, Model, Schema } from "mongoose";

export interface IService extends Document {
  categoryId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  unit: string; // e.g., "Lon", "Đĩa", "Bộ"
  image?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "serviceCategory",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "Phần",
    },
    image: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const serviceModel: Model<IService> =
  mongoose.models.service || mongoose.model<IService>("service", serviceSchema);

export default serviceModel;
