import mongoose from 'mongoose';
import 'dotenv/config';

const uri = `${process.env.MONGODB_URI}/quickstay`;
await mongoose.connect(uri);

const bookingDetailSchema = new mongoose.Schema({}, { strict: false });
const BookingDetail = mongoose.model('bookingdetails', bookingDetailSchema);

const details = await BookingDetail.find({}, { bookingId: 1, roomId: 1, roomStatus: 1 });
console.log('--- BOOKING DETAILS ---');
console.log(JSON.stringify(details, null, 2));

process.exit(0);
