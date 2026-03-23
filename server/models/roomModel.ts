import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRoom extends Document {
  name: string;
  roomType: string;
  capacity: number;
  size: number;

  bedType: string;
  view?: string;
  description: string;
  price: number;
  originalPrice?: number;
  availableRooms: number;
  status: "available" | "sold_out";
  thumbnail: string;
  images: string[];
  amenities: {
    wifi: boolean;
    airConditioner: boolean;
    breakfast: boolean;
    minibar: boolean;
    tv: boolean;
    balcony: boolean;
  };
  rating: number;
  reviewCount: number;
  hotelId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    // ===== Thông tin cơ bản =====
    name: {
      type: String,
      required: true, // Ví dụ: Phòng Deluxe Giường Đôi Nhìn Ra Biển
    },
    roomType: {
      type: String,
      required: true, // Ví dụ: Deluxe, Superior, Suite...
    },
    capacity: {
      type: Number, // Số người tối đa
      required: true,
      default: 2,
    },
    size: {

      type: Number, // m²
      required: true,
    },
    bedType: {
      type: String, // King, Queen, Twin
      required: true,
    },
    view: {
      type: String, // Nhìn ra biển, thành phố...
    },
    description: {
      type: String,
      required: true,
    },

    // ===== Giá & số lượng =====
    price: {
      type: Number,
      required: true, // Giá hiện tại
    },
    originalPrice: {
      type: Number, // Giá gốc (gạch ngang)
    },
    availableRooms: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["available", "sold_out"],
      default: "available",
    },

    // ===== Hình ảnh =====
    thumbnail: {
      type: String, // Ảnh chính
      required: true,
    },
    images: [
      {
        type: String, // Gallery ảnh
      },
    ],

    // ===== Tiện nghi =====
    amenities: {
      wifi: { type: Boolean, default: false },
      airConditioner: { type: Boolean, default: false },
      breakfast: { type: Boolean, default: false },
      minibar: { type: Boolean, default: false },
      tv: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
    },

    // ===== Đánh giá =====
    rating: {
      type: Number,
      default: 0, // ví dụ: 8.9
    },
    reviewCount: {
      type: Number,
      default: 0, // ví dụ: 1248
    },

    // ===== Liên kết khách sạn (nếu có) =====
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


