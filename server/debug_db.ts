import mongoose from 'mongoose';
import roomModel from './models/roomModel.ts';
import roomTypeModel from './models/roomTypeModel.ts';

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/htqlks'); // Guessing DB name or check .env
        const totalRooms = await roomModel.countDocuments();
        const roomsByStatus = await roomModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
        const roomTypes = await roomTypeModel.find();
        const roomsByTypeId = await roomModel.aggregate([{ $group: { _id: "$roomTypeId", count: { $sum: 1 } } }]);
        
        console.log('Total Rooms:', totalRooms);
        console.log('Rooms by Status:', roomsByStatus);
        console.log('Room Types:', roomTypes.length);
        console.log('Rooms grouped by TypeId:', roomsByTypeId);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
