import mongoose from 'mongoose';
import roomTypeModel from '../models/roomTypeModel.ts';
import roomModel from '../models/roomModel.ts';
import bookingModel from '../models/bookingModel.ts';

const dbUri = 'mongodb://localhost:27017/HTQLKS'; 

async function check() {
    try {
        await mongoose.connect(dbUri);
        const rts = await roomTypeModel.find();
        const rs = await roomModel.find();
        
        console.log("--- ROOM TYPES ---");
        rts.forEach(rt => {
            console.log(`${rt.name}: totalInventory=${rt.totalInventory}, id=${rt._id}`);
        });

        console.log("\n--- ROOMS ---");
        rs.forEach(r => {
            console.log(`Room ${r.roomNumber}: typeId=${r.roomTypeId}, status=${r.status}`);
        });

        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeBookings = await bookingModel.find({
            status: { $in: ['pending', 'confirmed', 'checked_in'] },
            checkInDate: { $lt: tomorrow },
            checkOutDate: { $gt: today }
        });

        console.log("\n--- ACTIVE BOOKINGS TODAY ---");
        activeBookings.forEach(b => {
             console.log(`Booking ${b._id}: typeId=${b.roomTypeId}, qty=${b.roomQuantity}, status=${b.status}, period=${b.checkInDate.toISOString()} -> ${b.checkOutDate.toISOString()}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
