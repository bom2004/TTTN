import express from "express";
import { 
    createBooking, 
    getAllBookings, 
    getUserBookings, 
    getBookingById, 
    updateBookingStatus,
    deleteBooking,
    cancelBooking
} from "../controllers/bookingController.ts";

const bookingRouter = express.Router();

bookingRouter.post("/", createBooking);
bookingRouter.get("/", getAllBookings);
bookingRouter.get("/user/:userId", getUserBookings);
bookingRouter.get("/:id", getBookingById);
bookingRouter.put("/:id/status", updateBookingStatus);
bookingRouter.put("/:id/cancel", cancelBooking);
bookingRouter.delete("/:id", deleteBooking);

export default bookingRouter;
