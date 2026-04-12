import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderItem {
  serviceId: mongoose.Types.ObjectId;
  quantity: number;
  priceAtOrder: number;
}

export interface IServiceOrder extends Document {
  bookingId: mongoose.Types.ObjectId; // Link to the main booking for accounting
  roomId: mongoose.Types.ObjectId; // Destination for delivery
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid_now" | "charged_to_room";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceOrderSchema = new Schema<IServiceOrder>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "booking",
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "room",
      required: true,
    },
    items: [
      {
        serviceId: {
          type: Schema.Types.ObjectId,
          ref: "service",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        priceAtOrder: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid_now", "charged_to_room"],
      default: "unpaid",
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const serviceOrderModel: Model<IServiceOrder> =
  mongoose.models.serviceOrder ||
  mongoose.model<IServiceOrder>("serviceOrder", serviceOrderSchema);

export default serviceOrderModel;
