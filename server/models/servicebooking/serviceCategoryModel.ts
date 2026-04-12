import mongoose, { Document, Model, Schema } from "mongoose";

export interface IServiceCategory extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const serviceCategoryModel: Model<IServiceCategory> =
  mongoose.models.serviceCategory ||
  mongoose.model<IServiceCategory>("serviceCategory", serviceCategorySchema);

export default serviceCategoryModel;
