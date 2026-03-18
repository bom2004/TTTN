import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    try {
        mongoose.connection.on('connected', () => console.log("Database connected"))
        await mongoose.connect(`${process.env.MONGODB_URI}/quickstay`)
    } catch (error) {
        console.error((error as Error).message);
    }
};

export default connectDB;