import express from "express";
import { 
    createBooking, 
    getAllBookings, 
    getUserBookings, 
    getBookingById, 
    updateBookingStatus,
    deleteBooking,
    cancelBooking,
    assignAndConfirmBooking
} from "../controllers/bookingController.ts";
import {
    adminUpdateBookingController,
    adminAddExtraPayment
} from "../controllers/adminBookingController.ts";

const bookingRouter = express.Router();

bookingRouter.post("/", createBooking);
bookingRouter.post("/:id/assign-and-confirm", assignAndConfirmBooking);
bookingRouter.get("/", getAllBookings);
bookingRouter.get("/user/:userId", getUserBookings);
bookingRouter.get("/:id", getBookingById);
bookingRouter.put("/:id/status", updateBookingStatus);
bookingRouter.put("/:id/cancel", cancelBooking);
bookingRouter.delete("/:id", deleteBooking);

// Admin Professional Edits
bookingRouter.put("/admin/:id/update", adminUpdateBookingController);
bookingRouter.post("/admin/:id/add-payment", adminAddExtraPayment);

export default bookingRouter;
